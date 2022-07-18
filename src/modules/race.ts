import * as utils from '@dcl/ecs-scene-utils'
import { scene, player } from "./scene";
//import { trackPath as _trackPath} from "../tracks/track_01";
import { realDistance, distance, ToDegrees, drawLineBetween, moveLineBetween, getProjectedPointOnLineFast, isPointOnSegment, percentOfLine} from "./utilities";
import { GAME_STATE } from "./state";
import { PlayerRaceDataState } from "./connection/state/server-state-spec";
import { CONFIG } from "src/config";
import { IntervalUtil } from "./interval-util";
import { TrackData } from "./trackPlacement";
import { EntityWrapper, SceneEntity } from "./scene/subScene";
import { Game_2DUI } from "./ui/index";
import { getOrCreateMaterial } from 'src/resources/common';
import { Level } from 'src/tracks/levelManager';
import { Constants } from './resources/globals';
import { ENEMY_MGR } from './playerManager';
import { MovesWithWorld } from 'src/components/moveWithWorld';

export class RaceData {
    //numberOfPlayers:number
    //ranking:number //TODO move to player ?
    
    //id of the level being played
    id:string
    name:string
    maxLaps:number 
    maxPlayers:number//does this belong here?
    checkpointSegmentId:number[] //come from level??
    //trackItems:TrackItem[]
    
    //nextCheckpointIndex:number
    started:boolean
    ended:boolean
    startTime:number
    endTime:number

    //lap:number //TODO move to player ?
    //currentCheckpointIndex:number  //TODO move to player ?

    constructor(){
      this.reset()
    }
    reset(){
      this.id = "Demo1"
      this.name = "_Untitled Race_"+this.id
      this.started = false
      this.ended = false
      this.startTime = -1
      this.maxPlayers = -1
      //this.numberOfPlayers = 1
      //this.ranking = 0
      this.maxLaps = 1
      this.checkpointSegmentId = []
      //this.nextCheckpointIndex = 1  
    }
    startRace(){
      this.started = true
      this.startTime = Date.now()
    }
    endRace(){
      this.started = false
      this.ended = true
      this.endTime = Date.now()
    }
    
    init(level:Level,trackData:TrackData){
      this.id = level.id
      this.name = level.name
      if(level.maxLaps){
        this.maxLaps = level.maxLaps
      }else{
        log("warning level did not have max laps defined!?!?!")
      }
      level.trackData
    //init(trackData:TrackData){
      //CHECKPOINTS ALONG THE CURVE

      const trackPath = trackData.trackPath

      //TODO move checkpoint segements to track data???
      for(let i=0; i<3; i++){
        this.checkpointSegmentId.push(Math.floor((trackPath.length/4))*(i+1))
        log("Checkpoint set to ID: " + this.checkpointSegmentId[i])
      }

    }
}

//export const raceData = new RaceData()
//GAME_STATE.raceData = raceData
 

//const DEBUGGING_ENABLED = CONFIG.DEBUGGING_ENABLED
 
export class DebugRaceUI extends SceneEntity{
  debugLine:Entity
  debugFirstFoot:Entity
  debugCenterCube:Entity
  debugClosestTrackCube:Entity
  debugClosestTrackCubeA:Entity
  debugClosestTrackCubeB:Entity

  DebugMatGreen:Material
  DebugMatBlue:Material
 
  lineSegments:Entity[]=[]
  debugLinesParent:Entity

  constructor(name:string){
    super(name,[])
  }

  onInit(){
    if(CONFIG.DEBUGGING_ENABLED  && CONFIG.DEBUGGING_UI_ENABLED){
      const trackData = GAME_STATE.trackData
      const trackPath = trackData.trackPath
    
      this.DebugMatGreen = getOrCreateMaterial(Color3.Green(),false) as Material
    
      this.DebugMatBlue = getOrCreateMaterial(Color3.Blue(),false) as Material
       
 
      this.debugLinesParent = new Entity()
      this.debugLinesParent.addComponent(new Transform())
      this.debugLinesParent.addComponent(new MovesWithWorld())
      engine.addEntity(this.debugLinesParent)

      /*
      for(let x=0;x<20;x+=1){
        debugLine = new Entity()       
        const pos = scene.center.clone()
        pos.z+=x
        if(x==1){
          debugFirstFoot = debugLine
        }
        pos.y +=1
        debugLine.addComponent(new Transform({
            position: pos,
            scale: new Vector3(1,0.1,1)       
        }))    
        debugLine.addComponent(new PlaneShape()).withCollisions = false
        debugLine.addComponent(new movesWithWorld())
        debugLine.addComponent(DebugMatGreen)
        engine.addEntity(debugLine)
      }*/
     
      this.debugLine = new Entity()        
      this.debugLine.addComponent(new Transform({
          position: scene.center.clone(),
          scale: new Vector3(1,0.1,1)       
      }))    
      this.debugLine.addComponent(new PlaneShape()).withCollisions = false
     // this.debugLine.addComponent(new MovesWithWorld())
      this.debugLine.addComponent(this.DebugMatGreen)
      engine.addEntity(this.debugLine)
    
      this.debugClosestTrackCube = new Entity();
      this.debugClosestTrackCube.addComponent(new BoxShape()).withCollisions=false
      this.debugClosestTrackCube.addComponent(this.DebugMatGreen) 
      this.debugClosestTrackCube.addComponent(new Transform({
        position: scene.center.clone(),
        scale: new Vector3(.1,2,.1)        
      }))    
      engine.addEntity(this.debugClosestTrackCube)
    
      this.debugClosestTrackCubeA = new Entity();
      this.debugClosestTrackCubeA.addComponent(new BoxShape()).withCollisions=false
      this.debugClosestTrackCubeA.addComponent(this.DebugMatBlue) 
      this.debugClosestTrackCubeA.addComponent(new Transform({
        position: scene.center.clone(),
        scale: new Vector3(.1,2,.1)        
      }))    
      engine.addEntity(this.debugClosestTrackCubeA)
    
    
      this.debugClosestTrackCubeB = new Entity();
      this.debugClosestTrackCubeB.addComponent(new BoxShape()).withCollisions=false
      this.debugClosestTrackCubeB.addComponent(this.DebugMatGreen) 
      this.debugClosestTrackCubeB.addComponent(new Transform({
        position: scene.center.clone(),
        scale: new Vector3(.1,2,.1)        
      }))    
      engine.addEntity(this.debugClosestTrackCubeB)
      
    
      this.debugCenterCube = new Entity();
      this.debugCenterCube.addComponent(new BoxShape()).withCollisions=false
      this.debugCenterCube.addComponent(new Transform({
        position: scene.center.clone(),
        scale: new Vector3(.2,.05,.2)        
      }))    
      this.debugCenterCube.getComponent(Transform).position.y = 2.1
      engine.addEntity(this.debugCenterCube)
    

      //make sure added in order of parentage, parents first, children last
      const ents:Entity[] = [ this.debugLine,this.debugClosestTrackCube
        ,this.debugClosestTrackCubeA,this.debugClosestTrackCubeB,this.debugFirstFoot,this.debugCenterCube]
    
      //create line segment pool (assuming wont have a track longer than 400 segments)
      for(let i=0;i<400;i++){
        const line = new Entity()
        ents.push(line)
        this.lineSegments.push(line)
        line.addComponent(new Transform({
          position: Vector3.Zero(),
          scale: Vector3.Zero(),
          rotation: Quaternion.Euler(0,0,0)
        }))
        //line.addComponent(new MovesWithWorld())
        line.addComponent(new PlaneShape()).withCollisions = false
        line.setParent(this.debugLinesParent)
      }
      
      //load entities
      for(const p in ents){
        this.entities.push( ents[p] )
      }

    } 
  }
  reset(){
    if(CONFIG.DEBUGGING_ENABLED && CONFIG.DEBUGGING_UI_ENABLED){
      const trackData = GAME_STATE.trackData
      const trackPath = trackData.trackPath

      for(const p in this.lineSegments){
        const line = this.lineSegments[p]
        line.getComponent(PlaneShape).visible = false
      } 
      
      let counter = 0
      for(let i=0; i<trackPath.length -1; i++){  
          const line = this.lineSegments[counter]
          line.getComponent(PlaneShape).visible = true

          moveLineBetween(line,trackPath[i], trackPath[i+1])  
          
          this.lineSegments.push(line)
          if(i % 2 ==0){
            line.addComponentOrReplace(this.DebugMatGreen)
          }
          counter++
        }
        const line = this.lineSegments[counter]
        const lastLine = moveLineBetween(line,trackPath[trackPath.length-1],trackPath[0])
        this.debugLinesParent.getComponent(Transform).position.setAll(0)
      }
   
  }
}

//DEBUG CENTER LINE DRAWER



interface RacingTrackData{
  closestPointID:number
  prevClosestPointID:number
  closestSegmentID:number
  minDistance:number
  currentDistance:number
  projectedPointA :Vector3
  projectedPointB :Vector3
  closestProjectedPoint:Vector3
  isPointOnSegmentA:boolean
  isPointOnSegmentB:boolean
  originA:number
  endA:number
  originB:number
  endB:number
  lapTime:number
}

function findClosestPointID(target:RacingTrackData){
  const trackData = GAME_STATE.trackData
  const trackPath = trackData.trackPath
  const data = target
  
  //find the curve point closest to the car(in scene center)
  //for(let i =0; i < trackPath.length; i++){
  
  let trackIndex = trackData.getPrevSegmentId(data.prevClosestPointID)
  trackIndex = trackData.getPrevSegmentId(trackIndex)
  const checkedArr = []
  for(let i =0; i < 5; i++){  
    checkedArr.push(trackIndex)
    const dist = distance(trackPath[trackIndex], scene.center)
    //log("findClosestPointID","data.closestPointID",data.closestPointID,"checking",trackIndex,dist,"data.minDistance",data.minDistance)
    if(dist < data.minDistance ){
      data.minDistance = dist
      data.closestPointID = trackIndex     
    }      
    trackIndex = trackData.getNextSegmentId(trackIndex)
  }
  data.prevClosestPointID = data.closestPointID
  
  //log("findClosestPointID",checkedArr)
}
function computeSegmentData(target:RacingTrackData){
  const trackData = GAME_STATE.trackData
  const trackPath = trackData.trackPath
  const data = target
  
  //coords of next segment after closest point
  data.originA = data.closestPointID
  data.endA    = data.closestPointID + 1

  if(data.endA >= trackPath.length )
  {
    data.endA = 0
  }

  //coords of previous segment before closest point
  data.originB = data.closestPointID - 1
  data.endB    = data.closestPointID

  if(data.originB < 0 )
  {
    data.originB = trackPath.length-1 
  }       
  
  data.projectedPointA = getProjectedPointOnLineFast(scene.center,trackPath[data.originA], trackPath[data.endA])
  data.projectedPointA.y = scene.raceGroundElevation+0.05
 
  //if the projected point A is inside the segment A    
  if (isPointOnSegment(data.projectedPointA,trackPath[data.originA], trackPath[data.endA])){
    data.isPointOnSegmentA = true           
  }        
  
  data.projectedPointB = getProjectedPointOnLineFast(scene.center,trackPath[data.originB], trackPath[data.endB])
  data.projectedPointB.y = scene.raceGroundElevation+0.05
 
  //if the projected B point is inside the segment B
  if (isPointOnSegment(data.projectedPointB,trackPath[data.originB], trackPath[data.endB])){
    data.isPointOnSegmentB = true
  }
  
    

}

function updateClosestSegmentID(target:RacingTrackData){
  const trackData = GAME_STATE.trackData
  const trackPath = trackData.trackPath
  const data = target

  //if player is near both segments then let the distance decide
  if(data.isPointOnSegmentB && data.isPointOnSegmentA){
    // log("Both points are on segments A and B")
     if(distance(scene.center,data.projectedPointA) > distance(scene.center, data.projectedPointB)){
       data.closestProjectedPoint.copyFrom(data.projectedPointB) 
       data.closestSegmentID = data.closestPointID - 1    

       if( data.closestSegmentID < 0 ){
         data.closestSegmentID = trackPath.length-1
       }  
     }
     else{
       data.closestProjectedPoint.copyFrom(data.projectedPointA)
       data.closestSegmentID = data.closestPointID 
         
     }
   }
   else if(data.isPointOnSegmentB && !data.isPointOnSegmentA){
     //log("Point is on segment B")
     data.closestProjectedPoint.copyFrom(data.projectedPointB)

     data.closestSegmentID = data.closestPointID - 1  

     if( data.closestSegmentID < 0 ){
       data.closestSegmentID = trackPath.length-1
     }
   }
   else if(!data.isPointOnSegmentB && data.isPointOnSegmentA){
    // log("Point is on segment A")
     data.closestProjectedPoint.copyFrom(data.projectedPointA)
     data.closestSegmentID = data.closestPointID  
   }
   else{
    // log("Point is controlpoint between segments")
     data.closestProjectedPoint.copyFrom(trackPath[data.originA])
     data.closestSegmentID = data.closestPointID  
   }  
}

function checkWrongWay(closestSegmentID:number):boolean{
  const trackData = GAME_STATE.trackData
  const trackPath = trackData.trackPath
  let nextID = closestSegmentID +1

  if(nextID >= trackPath.length){
    nextID = 0
  }
  if(!trackPath[nextID]) log("checkWrongWay trackPath[nextID] is null!!! GAME_STATE.trackData:", nextID ,trackPath[nextID] , trackData ,trackPath)
  if(!trackPath[closestSegmentID]) log("checkWrongWay trackPath[closestSegmentID] is null!!!")
  //check if the car car is facing the wrong way
  //FIXME scene.roadDir is being used in a few spots, maybe calculate in a more common method/location?
  scene.roadDir = trackPath[nextID].subtract(trackPath[closestSegmentID]).normalizeToNew() 

  if(Vector3.Dot(scene.roadDir, Vector3.Forward().rotate(player.shootDirection)) > 0){
    //log("GOOD DIRECTION")
    if(player.wrongWay){
      Game_2DUI.showWrongWay(false)
      player.wrongWay = false
      return false
    }        
  }
  else{
    //log("WRONG WAY")
    if(!player.wrongWay){
      Game_2DUI.showWrongWay(true)
      player.wrongWay = true
      return true
    }

  }
  
}

const racingData:PlayerRaceDataState={ 
  carScenePosition: {x:0,y:0,z:0},
  closestProjectedPoint:{x:0,y:0,z:0},
  endTime:0,
  closestPointID:0,
  closestSegmentID:0,
  closestSegmentPercent:0,
  closestSegmentDistance:0,
  currentSpeed:0,
  shootDirection:{x:0,y:0,z:0,w:0},
  cameraDirection:{x:0,y:0,z:0,w:0},
  worldPosition:{x:0,y:0,z:0},
  carModelId:undefined,
  serverTime:-1,
  racePosition:-1,
  lap:-1,
  worldMoveDirection:{x:0,y:0,z:0,w:0},
  lastKnownServerTime:-1,
  lastKnownClientTime:-1
}


const updatePlayerRacingDataInterval = new IntervalUtil(CONFIG.SEND_RACE_DATA_FREQ_MILLIS)
const updateLapTimeInterval = new IntervalUtil(CONFIG.SEND_RACE_DATA_FREQ_MILLIS)

function updatePlayerRacingData(){
  const trackData = GAME_STATE.trackData
  const trackPath = trackData.trackPath
  if(!trackPath[0]) log("updatePlayerRacingData.trackPath[0] is null")
 
    
  let distFromLine:number = realDistance(player.closestProjectedPoint, scene.center)  

  racingData.closestSegmentID = player.closestSegmentID
  racingData.closestProjectedPoint = player.closestProjectedPoint
  racingData.closestPointID = player.closestPointID
  
  let worldPos = scene.center.subtract(trackPath[0])
  
  let playerWorldPosition = worldPos//worldPos.add(trackPath[0])
  racingData.worldPosition = playerWorldPosition
  
  racingData.lastKnownServerTime = player.lastKnowServerTime
  racingData.lastKnownClientTime = Date.now()//snaphot for when sent
   
  const closestSegmentIDNext = trackData.getNextSegmentId(player.closestSegmentID)
  
  const percOfLine = percentOfLine(trackPath[player.closestSegmentID],trackPath[closestSegmentIDNext],player.closestProjectedPoint)
  player.closestSegmentPercent = percOfLine
  racingData.closestSegmentPercent = percOfLine
  //FIXME for some reason its inverted when dropping track features?!?!? its used for enemy position so need to look into it before changing,
  if(player.isOnSideRight) distFromLine *= -1
  racingData.closestSegmentDistance = distFromLine
  player.closestSegmentDistance = distFromLine

  racingData.currentSpeed = player.currentSpeed
  racingData.shootDirection = player.shootDirection//player.shootDirection
  racingData.cameraDirection = player.cameraDirection
  racingData.worldMoveDirection = player.worldMoveDirection
  racingData.carModelId = player.carModelId
  racingData.lap = player.lap
 
  //log("sending",GAME_STATE.gameConnected,racingData)
  //TODO only send during race??? && GAME_STATE.gameRoom.state.raceData.startTime > 0
  if(GAME_STATE.gameRoom && GAME_STATE.gameRoom.name == CONFIG.GAME_RACE_ROOM_NAME && GAME_STATE.gameConnected == 'connected' ){
    GAME_STATE.gameRoom.send("player.racingData.update",racingData)
  } 
}

const logDebugInterval = new IntervalUtil(5000)

const triggerComponentGroup = engine.getComponentGroup(utils.TriggerComponent)

export class ClosestTrackSystem implements ISystem,RacingTrackData{
   
    closestPointID:number
    prevClosestPointID:number
    closestSegmentID:number
    minDistance:number
    currentDistance:number
    projectedPointA :Vector3
    projectedPointB :Vector3
    closestProjectedPoint:Vector3
    isPointOnSegmentA:boolean
    isPointOnSegmentB:boolean
    originA:number
    endA:number
    originB:number
    endB:number
    lapTime:number
    totalTime:number
    //wrongWay:boolean
    debugUI:DebugRaceUI

    constructor(){
      this.reset()
    }

    init(){
      if(!this.debugUI){
        this.debugUI = new DebugRaceUI("closestTrack.debugUI")
        this.debugUI.init()
      }

    }

    reset(){
      if(this.debugUI){
        this.debugUI.reset()
      }
      this.closestPointID = 0
      this.closestSegmentID = 0
      this.prevClosestPointID = 0
      this.minDistance = 500
      this.currentDistance = 500
      this.projectedPointA = undefined
      this.projectedPointB = undefined
      this.closestProjectedPoint = new Vector3(0,0,0)
      this.isPointOnSegmentA = false
      this.isPointOnSegmentB = false
      this.originA = 0
      this.endA = 1
      this.originB = 0
      this.endB = 1
      this.lapTime = 0  //TODO MOVE TO PLAYER DATA  
      this.totalTime = 0  //TODO MOVE TO PLAYER DATA

      const trackData = GAME_STATE.trackData
      const raceData = GAME_STATE.raceData

    }
   
    update(dt: number){   
      const trackData = GAME_STATE.trackData
      const raceData = GAME_STATE.raceData
      const trackPath = trackData.trackPath

      if(raceData.started){
        this.lapTime += dt  
        this.totalTime += dt  
      }
      

      this.isPointOnSegmentA = false
      this.isPointOnSegmentB = false          

       

      
     // UI.setUISegmentID(this.closestSegmentID) 
      //UI.setUIDistance(scene.distanceFromStart)    
      
     
      if(!player.completedRace ){
        if(updatePlayerRacingDataInterval.update(dt)){
          updatePlayerRacingData()
        }
      }
  
      
      findClosestPointID(this)
      computeSegmentData(this)
      updateClosestSegmentID(this)
      
      //FIXME has sideaffect of updating scene.roadDir
      checkWrongWay(this.closestSegmentID)

      player.closestProjectedPoint = this.closestProjectedPoint
      if(this.closestSegmentID>=0 && player.forwardMostVisitedSegmentID >= trackData.trackPathLenSub1){
        player.forwardMostVisitedSegmentID = 0
      }else{
        player.forwardMostVisitedSegmentID = Math.max(this.closestSegmentID,player.forwardMostVisitedSegmentID)
      }
      player.closestSegmentID = this.closestSegmentID
      player.closestPointID = this.closestPointID 
  
      
      
      scene.distanceFromStart = trackData.trackPathFullDistanceToID[this.closestSegmentID] + realDistance( this.closestProjectedPoint, trackPath[this.closestSegmentID] )
      //const otherDistCacl = trackData.trackPathDistances[this.closestSegmentID] + realDistance( this.closestProjectedPoint, trackPath[this.closestSegmentID] )
     

      //log("trackPathFullDistanceToID",otherDistCacl,scene.distanceFromStart)
      
      scene.distanceFromCenterLine = distance(this.closestProjectedPoint, scene.center)

      if(!this.closestProjectedPoint) log("ClosestTrackSystem this.closestProjectedPoint is null!!")
      //which side of the centerLine the player is on
      if( Vector3.GetAngleBetweenVectors(scene.roadDir,scene.center.subtract(this.closestProjectedPoint),Vector3.Up()) > 0){
        player.isOnSideRight = true
      }
      else{
        player.isOnSideRight = false
      }
      
 
     
      if(CONFIG.DEBUGGING_ENABLED ){ 
        let closestSegIDNext = trackData.getNextSegmentId( this.closestSegmentID )
          
        if(CONFIG.DEBUGGING_UI_ENABLED && this.debugUI ){
          
          const debugUI = this.debugUI
          moveLineBetween(debugUI.debugLine, this.closestProjectedPoint, scene.center)
          debugUI.debugClosestTrackCube.getComponent(Transform).position.copyFrom( this.closestProjectedPoint )
          
          debugUI.debugClosestTrackCubeA.getComponent(Transform).position.copyFrom( trackPath[this.closestSegmentID] )
          debugUI.debugClosestTrackCubeB.getComponent(Transform).position.copyFrom( trackPath[closestSegIDNext] )
        }
        if(CONFIG.DEBUGGING_LOGS_ENABLED && logDebugInterval.update(dt)){
          const percOfLine = percentOfLine(trackPath[this.closestSegmentID],trackPath[closestSegIDNext],this.closestProjectedPoint)
          
          const distFromLine:number = realDistance(this.closestProjectedPoint, scene.center)  
  
          //log("this.closestSegmentID","closestPointID",this.closestPointID,"segmentIds(closest,a,b,a,b)",this.closestSegmentID,this.endA,this.endB,this.originA,this.originB
          //,"scene.vs.closestProjectedPoint",scene.center,this.closestProjectedPoint,"closestTrackSeg",trackPath[this.closestSegmentID],"distFromLine",distFromLine,"percOfLine",percOfLine,"isOnSideRight",player.isOnSideRight,"worldPos",worldPos,selfEnemy.getEnemyData().worldPos,"enemyPosVector",enemyPosVector)

          //const firstFootPos = debugFirstFoot.getComponent(Transform).position

          //const firstFootPosWorld = firstFootPos.  subtract( trackPath[0])

          log("this.closestSegmentID",this.closestSegmentID,"fmSegmentID",player.forwardMostVisitedSegmentID,trackData.trackPath.length,
            "scene.vs.closestProjectedPoint",scene.center,this.closestProjectedPoint,"closestTrackSeg",this.closestSegmentID,trackPath[this.closestSegmentID]
            ,"percOfLine",percOfLine
            ,"carPos",utils.getEntityWorldPosition( Constants.SCENE_MGR.racingScene.car.car )
            ,"triggerComponentGroup",triggerComponentGroup.entities.length,"latencies",player.latencyAvg,ENEMY_MGR.getDebugLatanciesArray() )//,"enemyPosVector",enemyPosVector)//,"debugFirstFoot",firstFootPos,"firstFootPosWorld" ,firstFootPosWorld)

        }
        
      }

    
      //UI.setUICenterDist(scene.distanceFromCenterLine)

      if(!player.completedRace ){
        //checkpoints
        if(this.closestSegmentID > raceData.checkpointSegmentId[player.currentCheckpointIndex] && this.closestSegmentID < raceData.checkpointSegmentId[player.currentCheckpointIndex]+10 ){
          
          log("CHECKPOINT: " + raceData.checkpointSegmentId[player.currentCheckpointIndex])
          player.currentCheckpointIndex += 1        
          if(player.currentCheckpointIndex >= raceData.checkpointSegmentId.length){
            player.currentCheckpointIndex = raceData.checkpointSegmentId.length
          }
          //TODO SEND UPDATE TO SERVER
          
        }

        if( updateLapTimeInterval.update(dt) ){
          Game_2DUI.updateLapTime(Game_2DUI.formatTime(this.lapTime),player.lap )
          Game_2DUI.updateTotalTime(Game_2DUI.formatTime(this.totalTime),player.lap )
          Game_2DUI.updateCarSpeed((player.currentSpeed * 10).toFixed(1) )
        }

        //Laps
        if(this.closestSegmentID == 0 && player.currentCheckpointIndex == raceData.checkpointSegmentId.length){
          log("LAP " + player.lap + "/",raceData.maxLaps," FINISHED in " + this.lapTime +" seconds!" )

          //TODO throttle this??
          Game_2DUI.updateLapTime(Game_2DUI.formatTime(this.lapTime),player.lap )
          if( player.lap < raceData.maxLaps){
            this.lapTime = 0
            //reset their stuff each lap
            //player.projectileCount = CONFIG.PROJECTILE_RELOAD_AMOUNT
            //player.boosterCount = CONFIG.BOOSTERS_MAX_RELOAD_AMOUNT
          }
          //reset checkpoint index so block does not fire in quick succession
          player.currentCheckpointIndex = 0
          player.forwardMostVisitedSegmentID = 0
          player.lap++
          Game_2DUI.updateLapCounter(player.lap , raceData.maxLaps)
          
        } 
      }
      
      //resetting data for next loop
      this.prevClosestPointID = this.closestPointID
      this.closestPointID = 0
      
      this.minDistance = 500
      this.currentDistance = 500
    }
  }
  //MOVED TO src/modules/scene/race.ts
  //engine.addSystem(new ClosestTrackSystem())

  