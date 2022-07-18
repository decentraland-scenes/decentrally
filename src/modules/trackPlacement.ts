import * as utils from '@dcl/ecs-scene-utils'
import { MovesWithWorld } from 'src/components/moveWithWorld';
import { CONFIG } from "src/config";
import { getOrCreateGLTFShape, getOrCreateMaterial } from 'src/resources/common';
import { Level, levelManager } from "../tracks/levelManager";
import * as serverSpec from './connection/state/server-state-spec';
import { fullBoostTimer } from './itemRecharger';
import { Constants } from './resources/globals';
import {  SOUND_POOL_MGR } from './resources/sounds';
import { player, scene } from "./scene";
import { SceneEntity, VisibleChangeType } from './scene/subScene';
import { AbstractMoveWithWorldSpawner, AbstractSpawner } from "./spawner";
import { GAME_STATE } from "./state";
import { themeControl, ThemeTrackFeature } from "./themeData";
import { createTrackFeatureComponentFrom, FeatureTriggerComponent, TrackFeature, TrackFeatureComponent, TrackFeatureShape } from './trackFeatures';
import { distance, realDistance, ToDegrees } from "./utilities";


//let trackEdgeShape =  new GLTFShape('models/track_edge.glb')
//let trackEdgeShape =  new GLTFShape('models/track_edge_sand.glb')
//let trackEdgeShape =  new GLTFShape('models/track_edge_meta.glb')
let finishFlagShape =  new GLTFShape('models/finish_flag.glb')
//let treeShape =  new GLTFShape('models/tree.glb')
//let rockShape =  new GLTFShape('models/rock.glb')
//let metaLampShape =  new GLTFShape('models/meta_lamp.glb')
//let metaBuildingShape =  new GLTFShape('models/meta_building.glb')

let roadWidth = 3

type TrackSideDataType={
  nextIndex:number,
  origin:number,
  target:number,
  fraction:number,
  lastOrigin:number
  lastTarget:number,
  lastFraction:number,
  distance:number,
  offsetFromCenter:number
  lastPos:Vector3
  flip:boolean
}




let trackRadius = 4   

const trackSpacing = 2

/*
export class SegmentChangeListener{
  startSeg:number
  endSeg:number
  trackData:TrackData
  handler:SegmentChangeHandler
  
  constructor(trackData:TrackData,startSeg:number,endSeg:number,handler:SegmentChangeHandler){
    this.trackData = trackData
    this.startSeg = startSeg
    this.endSeg = endSeg
    this.handler = this.handler
  }
}*/
class EdgeContainer {
  alive:boolean = false
  pos:Vector3 = new Vector3(0,0,0)
  rot:Quaternion = Quaternion.Euler(0,0,0)  
}

export class TrackData{
  //[x: string]: any;

  pathWithNormals:Path3D
  normalArray:Vector3[]

  //TODO store level here? from levelManager.getCurrentLevel()??

  //Pre-calculate curve point distances
  trackPathDistances = [] 

  fullDistance = 0
  trackPathFullDistanceToID = []
  trackFeatures:Record<string,TrackFeatureComponent>

  trackPath:Vector3[]
  trackPathLenSub1 = 0 //trackPath.length - 1
  //trackPathReadOnly:Vector3[]
  leftEdges:EdgeContainer[] = []
  rightEdges:EdgeContainer[] = []


  trackDataLeft:TrackSideDataType
  trackDataRight:TrackSideDataType
  trackDataLeftReverse:TrackSideDataType
  trackDataRightReverse:TrackSideDataType

  trackFeaturesMapBySegId:Record<string,TrackFeatureComponent[]>={}

  canAddTrackFeature(feat:TrackFeature){
    return feat.position.startSegment < this.trackPath.length-2
  }

  addTrackFeature(trackFeature:TrackFeatureComponent){
    const key = Math.floor(trackFeature.position.startSegment)

    if( !this.canAddTrackFeature( trackFeature ) ){
      log("Level.trackFeatures out of bounds",trackFeature)
      return
    }

    let list:TrackFeatureComponent[] = this.trackFeaturesMapBySegId[key]
    if(!list){
      list = []
      this.trackFeaturesMapBySegId[key] = list
    }
    if(this.trackFeatures[trackFeature.name]){
      //TODO look into, it gets tripped if disconnected and reconnected
      //debugger
      log("WARNING already has track feature",trackFeature.name,this.trackFeatures[trackFeature.name],"vs",trackFeature)
    }else{
      list.push( trackFeature )
      this.trackFeatures[trackFeature.name] = trackFeature
    }
    
    
  }


  getTrackFeaturesForSegment(segment:number):TrackFeatureComponent[]{
    return this.trackFeaturesMapBySegId[segment]
  }
   
  setTrackPath(trackPath:Vector3[]){    
    //this.trackPathReadOnly = trackPath //keep track of original
    this.trackPath = this.deepCopy(trackPath) //cloning so original track stays in tact
  } 
  
  getNextSegmentId(segId:number){
    let segIdNext = segId +1
    if(segIdNext >= this.trackPath.length){
      segIdNext = 0
    }
    return segIdNext
  }
  getPrevSegmentId(segId:number){
    let segIdPrev = segId - 1
    if(segIdPrev < 0 ){
      segIdPrev = this.trackPath.length - 1
    }
    return segIdPrev
  }

  /**
   * TrackSpawnSystem mutates the track path, need deep copy so can keep original clean
   * @param trackPath 
   * @returns 
   */
  private deepCopy(trackPath:Vector3[]){
    const newArr:Vector3[] = []
    for(const p in trackPath){
      newArr.push(trackPath[p].clone())
    }
    //return JSON.parse(JSON.stringify(trackPath));
    return newArr
  }

  generateTrackEdges(sideTrackData:TrackSideDataType, edgeContainer:EdgeContainer[] ){
    const trackData = GAME_STATE.trackData
    const trackPath = trackData.trackPath
    const normalArray = trackData.normalArray
    const trackPathDistances = trackData.trackPathDistances

    log("track curve points: " + trackPath.length)
    
    if(sideTrackData.origin < 0){
      sideTrackData.origin += trackPath.length
    }

    if(sideTrackData.target < 0){
      sideTrackData.origin += trackPath.length
    }
    if(sideTrackData.lastOrigin < 0){
      sideTrackData.origin += trackPath.length
    }

    if(sideTrackData.lastTarget < 0){
      sideTrackData.origin += trackPath.length
    }


    let trackPos = Vector3.Lerp(trackPath[sideTrackData.origin], trackPath[sideTrackData.target], sideTrackData.fraction).addInPlace(normalArray[sideTrackData.origin].multiplyByFloats(sideTrackData.offsetFromCenter, sideTrackData.offsetFromCenter, sideTrackData.offsetFromCenter)) 
     

    let counter = 0
    //store all edges positions in the level's arrays 
    for (let i=0; i < trackPath.length; i++)
    {     

      // if(i == 180){
      //   let edge = new Entity()
      //   edge.addComponent(new Transform({
      //     position: trackPos,
      //     rotation: Quaternion.Euler(0,0,0),
      //     scale: new Vector3(1,30,1)
      //   }))
      //   edge.addComponent(new BoxShape())
      //   edge.addComponent(new MovesWithWorld())
      //   engine.addEntity(edge)
      // }
      // if(i == 0){
      //   log("INDEX 0 0 0 0 0 00 0 0")
      //   let edge = new Entity()
      //   edge.addComponent(new Transform({
      //     position: trackPos,
      //     rotation: Quaternion.Euler(0,45,0),
      //     scale: new Vector3(1,50,1)
      //   }))
      //   edge.addComponent(new BoxShape())
      //   edge.addComponent(new MovesWithWorld())
      //   engine.addEntity(edge)
      // }
             
      while(sideTrackData.fraction <= 1){
       
        sideTrackData.fraction += 1/trackPathDistances[sideTrackData.origin]        

        trackPos = Vector3.Lerp(trackPath[sideTrackData.origin], trackPath[sideTrackData.target], sideTrackData.fraction).addInPlace(normalArray[sideTrackData.origin].multiplyByFloats(sideTrackData.offsetFromCenter, sideTrackData.offsetFromCenter, sideTrackData.offsetFromCenter))           
        sideTrackData.distance = distance(sideTrackData.lastPos, trackPos)
       // log("trackPos : " + trackPos)
        //log("distance : " + sideTrackData.distance)

        // if(sideTrackData.distance > 10){
        //   log("distance is way too sus: " + sideTrackData.distance)
        //   log("last pos: " + sideTrackData.lastPos)
        //   log("current pos: " + trackPos)
        //   log("segmentID: " + sideTrackData.origin)
        //   let edge = new Entity()
        //   edge.addComponent(new Transform({
        //     position: trackPos,
        //     rotation: Quaternion.Euler(0,0,0),
        //     scale: new Vector3(2,10,2)
        //   }))
        //   edge.addComponent(new BoxShape())
        //   edge.addComponent(new MovesWithWorld())
        //   engine.addEntity(edge)

        // }
        if (sideTrackData.distance > trackSpacing)         
        {             
         // log("placing by distance")
            const segId = sideTrackData.target            
            
            let rotAngle = ToDegrees( Vector3.GetAngleBetweenVectors(Vector3.Forward(),trackPath[sideTrackData.origin].subtract(trackPath[sideTrackData.target]),Vector3.Up()) )  
            
            if(sideTrackData.flip){
              rotAngle-=180
            }
           // log("rotAngle: " + rotAngle)

            edgeContainer.push({
              alive:false,
              pos: new Vector3(trackPos.x, trackPos.y, trackPos.z),
              rot: Quaternion.Euler(0,rotAngle,0),
            })

            
            //log("saved track edge: " + edgeContainer[edgeContainer.length-1].pos)
            //this.trackSpawner.spawnTrack(trackPos.x, trackPos.y, trackPos.z, rotAngle,segId)             
            sideTrackData.lastPos.copyFrom(trackPos)             
            sideTrackData.distance = 0  
        }
      }

      sideTrackData.fraction = sideTrackData.fraction -1
      sideTrackData.nextIndex += 1
      sideTrackData.origin = sideTrackData.target

      if(  sideTrackData.nextIndex >= trackPath.length)
      {
        sideTrackData.nextIndex = 0       
      }           
      sideTrackData.target = sideTrackData.nextIndex

         
      
    }

    log("number of edges: " + edgeContainer.length)
  }

  renderAllEdges(){
    for (let i=0; i < this.leftEdges.length; i++){

      let edge = new Entity()
      edge.addComponent(new Transform({
        position: this.leftEdges[i].pos,
        rotation: this.leftEdges[i].rot
      }))
      edge.addComponent(new BoxShape())
      edge.addComponent(new MovesWithWorld())
      engine.addEntity(edge)

    }
    for (let i=0; i < this.rightEdges.length; i++){

      let edge = new Entity()
      edge.addComponent(new Transform({
        position: this.rightEdges[i].pos,
        rotation: this.rightEdges[i].rot
      }))
      edge.addComponent(new BoxShape())
      edge.addComponent(new MovesWithWorld())
      engine.addEntity(edge)

    }
  }
  init(level:Level){

    this.trackPath = this.deepCopy(level.trackPath)
    const trackPath = this.trackPath

    this.trackPathLenSub1 = trackPath.length - 1
    
    const pathWithNormals =  new Path3D(this.trackPath) 
    this.normalArray = pathWithNormals.getNormals()

    const startIndex = 0


    this.trackDataLeft= {
      nextIndex: startIndex + 1,
      origin: startIndex ,
      target: startIndex + 1,
      fraction: 0 ,
      lastOrigin: startIndex + 1,
      lastTarget: startIndex ,
      lastFraction: 0,
      distance: 0,
      offsetFromCenter: -roadWidth,
      lastPos: new Vector3(0,0,0),
      flip: false
    }
    
    this.trackDataRight= {
      nextIndex: startIndex + 1,
      origin: startIndex ,
      target: startIndex + 1,
      fraction: 0 ,
      lastOrigin: startIndex + 1,
      lastTarget: startIndex ,
      lastFraction: 0,
      distance: 0,
      offsetFromCenter: roadWidth,
      lastPos: new Vector3(0,0,0),
      flip:true
    }


    this.trackDataLeftReverse= {
      nextIndex: trackPath.length -1,
      origin: startIndex ,
      target: trackPath.length -1,
      fraction: 0 ,
      lastOrigin: startIndex ,
      lastTarget: trackPath.length -1 ,
      lastFraction: 0,
      distance: 0,
      offsetFromCenter: -roadWidth,
      lastPos: new Vector3(0,0,0),
      flip: true
    }

    this.trackDataRightReverse= {
      nextIndex: trackPath.length -1,
      origin: startIndex ,
      target: trackPath.length -1,
      fraction: 0 ,
      lastOrigin: startIndex ,
      lastTarget: trackPath.length -1 ,
      lastFraction: 0,
      distance: 0,
      offsetFromCenter: roadWidth,
      lastPos: new Vector3(0,0,0),  
      flip:false
    }

    
    //Pre-calculate curve point distances
    this.trackPathDistances = [] 

    //unique segment lengths stored
    for (let i = 0; i < this.trackPath.length; i++)
    {
      let nextIndex = i+1
      if(nextIndex >= this.trackPath.length){
        nextIndex = 0
      }
      this.trackPathDistances.push(realDistance(this.trackPath[i],this.trackPath[nextIndex]))
    }


    //storing the cumulative distance up to each curve point
    this.fullDistance = 0
    this.trackPathFullDistanceToID = []

    for (let i = 0; i < trackPath.length; i++)
    {  
      if(i==0){
        this.trackPathFullDistanceToID.push(0)
      } else{
        this.fullDistance += realDistance(trackPath[i-1],trackPath[i])
        this.trackPathFullDistanceToID.push(this.fullDistance)
      }
  
      //log("Distance to ID: " + i + " is " + trackPathFullDistanceToID[i])

    }
    
    //pre-calculate track edge positions
    this.generateTrackEdges(this.trackDataLeft, this.leftEdges)
    this.generateTrackEdges(this.trackDataRight, this.rightEdges)
   
    //debug viz
    // this.renderAllEdges()

    this.trackFeatures = {}
    this.trackFeaturesMapBySegId = {}
    
    for(const p in level.trackFeatures){
      const template = level.trackFeatures[p]  
      
      this.createAndAddTrackFeatureFromTemplate(template,level)
    }
  }
  
  createAndAddTrackFeatureFromTemplate(template:TrackFeature,level:Level):TrackFeatureComponent{
    const featCopy:TrackFeatureComponent = createTrackFeatureComponentFrom( template ) 
       
      if(!featCopy.shape){
        let themeTrackFeat:ThemeTrackFeature
        let featShape:TrackFeatureShape
        switch(featCopy.type){
          case "boost":
            themeTrackFeat = level.theme.trackFeature.boost
            break
          case "slow-down":
            themeTrackFeat = level.theme.trackFeature.trap
            break
        }
        if(themeTrackFeat){
          featShape = new TrackFeatureShape({model: themeTrackFeat.shape.src,transform:themeTrackFeat.transform})
          featCopy.shape = featShape
          if(!featCopy.triggerSize){
            featCopy.setTriggerSize( themeTrackFeat.triggerSize )
          }
          featCopy.activateTime = themeTrackFeat.activateTime
        }
      }

      this.addTrackFeature( featCopy )

      return featCopy
  }
}

//const trackData = new  TrackData()
//GAME_STATE.trackData = trackData
//trackData.trackPath = _trackPath
//trackData.reset() 

export function createFinishFlag(trackData:TrackData):Entity{
  let pathPosition = trackData.trackPath[0]

  let finishFlag = new Entity()
  finishFlag.addComponent(finishFlagShape)
  finishFlag.addComponent(new Transform({
    position: new Vector3(pathPosition.x, pathPosition.y, pathPosition.z)
  }))
  
  finishFlag.addComponent(new MovesWithWorld())
  engine.addEntity(finishFlag)

  return finishFlag
}


export function setStartPositionEntity(startPos:Entity,trackData:TrackData,startPosition:number):Entity{
  let pathPosition = trackData.trackPath[0]

  const PADD_BACKWARD = .5
  const PADD_FORWARD_OFFSET = PADD_BACKWARD + .35
  startPos.addComponentOrReplace(new Transform({
    position: new Vector3(pathPosition.x, pathPosition.y, pathPosition.z + PADD_FORWARD_OFFSET)
    ,scale: new Vector3(.3,.5,.5)
  }))

 const maxPerRow = 4

 //if for some reason we compute by car position before race starts, make sure starting points are 
 //slightly adjusted so sort will work
 const smallDifForRank = startPosition * .0001

  for(let x=0;x<=Math.floor(startPosition/maxPerRow);x++){
    startPos.getComponent(Transform).position.addInPlace( Vector3.Backward().scale(1 + PADD_BACKWARD + smallDifForRank) )
  }

  switch(startPosition % maxPerRow){
    case 0:
      startPos.getComponent(Transform).position.addInPlace( Vector3.Left().scale(.5) )
      break;
    case 1:
      startPos.getComponent(Transform).position.addInPlace( Vector3.Right().scale(.5) )
      //startPos.getComponent(Transform).position.addInPlace( Vector3.Left() )
      break;
    case 2:
      startPos.getComponent(Transform).position.addInPlace( Vector3.Left().scale(1.5) )
      //startPos.getComponent(Transform).position.addInPlace( Vector3.Left() )
      break;
    case 3:
      startPos.getComponent(Transform).position.addInPlace( Vector3.Right().scale(1.5) )
      //startPos.getComponent(Transform).position.addInPlace( Vector3.Left() )
      break;
  }
  return startPos
}

export const TRACK_FEATURE_LAYER_1 = 1
const defaultTrackFeatureTriggerShape = 
  //new utils.TriggerSphereShape(1,Vector3.Zero())
  new utils.TriggerBoxShape(new Vector3(.75,1,.75),Vector3.Zero())
  
export function setTrackFeaturePosition(trackItemEnt:Entity,trackData:TrackData,trackFeature?:TrackFeatureComponent){
  if(!trackFeature){
    trackFeature = trackItemEnt.getComponent(TrackFeatureComponent)
  } 
  log("setting position for ",trackFeature.name)

  const segId = Math.floor(trackFeature.position.startSegment)
  const percent = trackFeature.position.startSegment - segId
  
  let pathPosition1 = trackData.trackPath[segId]
  let pathPosition2 = trackData.trackPath[segId+1]

  const hasExplicityPos = trackFeature.position.position !== undefined && trackFeature.position.position !== null
  const hasExplicitRot = trackFeature.position.rotation !== undefined && trackFeature.position.rotation !== null

  const vecPos = trackFeature.position.position
 
  try{
    const featurePosition = hasExplicityPos ? new Vector3(vecPos.x,vecPos.y,vecPos.z) : Vector3.Lerp(pathPosition1,pathPosition2,percent)

    if(!hasExplicityPos){
      featurePosition.addInPlace( trackData.normalArray[segId].scale( trackFeature.position.centerOffset ) ) 
      if(trackFeature.position.offset) featurePosition.addInPlace( trackFeature.position.offset )
    }

    if(!trackItemEnt.hasComponent(Transform)){
      trackItemEnt.addComponent(new Transform({}) )
    }
    trackItemEnt.getComponent(Transform).position = featurePosition
    
    
    if(hasExplicitRot){
      const rot = trackFeature.position.rotation
      trackItemEnt.getComponent(Transform).rotation = new Quaternion( rot.x,rot.y,rot.z,rot.w )
    }else{
      //let dist = realDistance(pathPosition,featurePos)
      let rotAngle = ToDegrees( Vector3.GetAngleBetweenVectors(Vector3.Forward(),pathPosition1.subtract(pathPosition2),Vector3.Up()) )  

      //line.getComponent(Transform).position = Vector3.Lerp(A,B,0.5)
      //line.getComponent(Transform).position.y += 0.02
      //line.getComponent(Transform).scale = new Vector3(dist,0.02,1)
      trackItemEnt.getComponent(Transform).rotation = Quaternion.Euler(0,90+rotAngle,0)
      trackItemEnt.getComponent(Transform).rotate(Vector3.Up(),90)        
    }
  }catch(e){
    log("setTrackFeaturePosition failed",e)
    if(CONFIG.ENABLE_DEBUGGER_BREAK_POINTS) debugger
  }

}

const debugTrackFeatureShape = new BoxShape()
debugTrackFeatureShape.withCollisions = false

export function createTrackFeature(trackData:TrackData,trackFeature:TrackFeatureComponent):Entity{
  const trackItemEnt = new Entity("track-item-"+trackFeature.name + "")

  setTrackFeaturePosition(trackItemEnt,trackData,trackFeature)

  //not 100% sure this is a good idea
  //the idea is to match the trigger size but is that backwards?  should set trigger shape to item size
  //trackItemEnt.getComponent(Transform).scale = new Vector3(defaultTrackFeatureTriggerShape.size.x,1,defaultTrackFeatureTriggerShape.size.z)


  //START DEBUG UI

  //matching the trigger shape but a little smaller so can represent the trigger dimensions but not fully overlap the trigger when in debug

  
  //trackItemEnt.getComponent(Transform).scale = new Vector3(2,2,2)
  let triggerShape =   defaultTrackFeatureTriggerShape
  
  if(trackFeature.triggerSize ){//} && trackFeature.shape.transform){
    
    //trackItemEnt.getComponent(Transform).scale = trackFeature.shape.trigTransform.scale.clone()
    //TODO cache this!
    triggerShape = new utils.TriggerBoxShape(trackFeature.triggerSize,Vector3.Zero())
  } 

  if(CONFIG.DEBUGGING_ENABLED &&  CONFIG.DEBUGGING_UI_ENABLED){
    const width = triggerShape.size.x + .05
    const len = triggerShape.size.z + .05//.9//1
  
    const debugEnt = new Entity(trackItemEnt.name + "-debug")
    debugEnt.setParent(trackItemEnt)

    const debugEntShape = new Entity(trackItemEnt.name + "-shape")
    debugEntShape.setParent(debugEnt)
    debugEntShape.addComponent(new Transform({
      position: new Vector3(0, 0, 0),
      scale: new Vector3(width,.01,len)
    }))
 
    const shape = debugTrackFeatureShape//new BoxShape()
    shape.withCollisions = false
    debugEntShape.addComponent(shape)

    switch(trackFeature.type){ 
      case 'boost':
        debugEntShape.addComponent(getOrCreateMaterial(Color3.Green(),false) )
        break; 
      case 'slow-down':
        debugEntShape.addComponent(getOrCreateMaterial(Color3.Yellow(),false) )
        break;
      case 'wall':
        //player.appliedSlowdownFriction = Math.min(player.appliedSlowdownFriction+scene.DRAG_MAX,scene.DRAG_MAX)
        break;
      case 'inert':
        debugEntShape.addComponent(getOrCreateMaterial(Color3.Gray(),false) )
          break;
    }

    debugEntShape.addComponent(new OnPointerDown(()=>{
      log("trackItemEnt.trigger",trackItemEnt.name , "do debug stuff")//trackItemEnt.getComponent( utils.TriggerComponent ))
    },{
      hoverText:trackFeature.name
    }))

    const debugEntText = new Entity("track-item-"+trackFeature.name + "-text")
    debugEntText.setParent(debugEnt)
    const textShape = new TextShape(""+(trackFeature.name))
    textShape.fontSize = 2

    trackFeature.textShape = textShape

    debugEntText.addComponent(textShape)
    debugEntText.addComponent(new Transform({
      position: new Vector3(0, 1.2, 0)
    }))

    
  }
  //END DEBUG UI
 
  //TODO REPLACE ME WITH ACTUAL MODEL
  const shapeEntity = new Entity(trackItemEnt.name+".shape")
  shapeEntity.setParent(trackItemEnt)
  if(trackFeature.shape && trackFeature.shape.transform){
    const tf = trackFeature.shape.transform
    shapeEntity.addComponent( new Transform( { 
      scale: tf.scale ? tf.scale.clone() : Vector3.One(),
      position: tf.position ? tf.position.clone() : Vector3.Zero()
    } ) )
  }

  if(!trackFeature.shape || !trackFeature.shape.model){
    const shape = debugTrackFeatureShape//new BoxShape()
    shape.withCollisions = false
    shapeEntity.addComponent(shape)

    switch(trackFeature.type){
      case 'boost':
        shapeEntity.addComponent(getOrCreateMaterial(Color3.Green(),false) )
        break; 
      case 'slow-down':
        shapeEntity.addComponent(getOrCreateMaterial(Color3.Yellow(),false) )
        break;
      case 'wall':
        //player.appliedSlowdownFriction = Math.min(player.appliedSlowdownFriction+scene.DRAG_MAX,scene.DRAG_MAX)
        break;
      case 'inert':
        shapeEntity.addComponent(getOrCreateMaterial(Color3.Gray(),false) )
          break;
    }
  }else{
    const shape = getOrCreateGLTFShape(trackFeature.shape.model)
    //shape.withCollisions = false
    shapeEntity.addComponent(shape)
  }
  //TODO REPLACE ME WITH ACTUAL MODEL
  /*
  switch(trackFeature.type){
    case 'boost':
      trackItemEnt.addComponent(boostClipSource)
      break;
    case 'slow-down':
      trackItemEnt.addComponent(trapClipSource)
      break;
    case 'wall':
      //player.appliedSlowdownFriction = Math.min(player.appliedSlowdownFriction+scene.DRAG_MAX,scene.DRAG_MAX)
      break;
  }*/

  const triggerOnCameraEnter = ()=>{
    log("trigger.camera entered!!! ",trackFeature.name)
    switch(trackFeature.type){
      case 'boost':
        player.appliedBoostFriction = -1 * scene.BOOST_MAX 
        player.boostReloadTimer = Math.min( player.boostReloadTimer + CONFIG.BOOSTERS_RELOAD_TIME, fullBoostTimer )

        const amt = player.boostReloadTimer/fullBoostTimer
        //log("ItemRechargeSystem",player.boostReloadTimer,fullBoostTimer,cnt)
        Constants.Game_2DUI.setBoostBar(amt)

        SOUND_POOL_MGR.boost.playOnce()
        break;
      case 'slow-down':
        player.appliedSlowdownFriction = Math.min(player.appliedSlowdownFriction+scene.DRAG_MAX,scene.DRAG_MAX)
        SOUND_POOL_MGR.trap.playOnce()
        break;
      case 'wall':
        //player.appliedSlowdownFriction = Math.min(player.appliedSlowdownFriction+scene.DRAG_MAX,scene.DRAG_MAX)
        break;
    }
  }

  //change which class will be provider for feature triggers
  const TRIGGER_COMPONENT_CLASS = FeatureTriggerComponent //utils.TriggerComponent ( heavier?) //FeatureTriggerComponent custom lighter??
  const triggerComp = new TRIGGER_COMPONENT_CLASS(triggerShape,{
    layer:TRACK_FEATURE_LAYER_1,
    enableDebug:CONFIG.DEBUGGING_TRIGGERS_ENABLED,
    onCameraEnter: triggerOnCameraEnter,
    onTriggerExit:()=>{
      log("trigger.camera exited!!! "+trackFeature.name)
    }
  })
  //triggerComp.enabled = true
  
  const startSeg = trackFeature.position.startSegment
  const endSeg = trackFeature.position.startSegment
   
  
  trackFeature.handler =
    (trackFeature:TrackFeatureComponent,type:VisibleChangeType,oldSeg:number,newSeg:number)=>{
      //if(!listener.enabled) return

      if( trackFeature.position.startSegment == 2 ){
        //debugger
       }
      const activateTimeValid = (trackFeature.activateTime === undefined || trackFeature.activateTime <= Date.now())
      log("trackItemEnt.trigger",trackItemEnt.name,trackFeature.activateTime,Date.now(),"activateTimeValid",activateTimeValid , trackItemEnt.hasComponent( utils.TriggerComponent ),"triggerEnabled",triggerComp.enabled,type)
      
      switch(type){
        case "show":
          if(!activateTimeValid){
            log("trackItemEnt.trigger",trackItemEnt.name , "NOT READY TO SHOW YET",(trackFeature.activateTime - Date.now())," time left till activation")
            return
          }
          triggerComp.enabled = true
          trackItemEnt.addComponentOrReplace(
            triggerComp
          )
          if(trackFeature.sceneEnts){
            for(const p in trackFeature.sceneEnts){
              trackFeature.sceneEnts[p].show()
              //const entity = trackFeature.entity;
              //have to call this because if removed from engine, it wont be updates to position
              //so must force it back into position
              setTrackFeaturePosition(trackFeature.sceneEnts[p].entity,GAME_STATE.trackData)
            }
          }
        break;
        case "hide":
          triggerComp.enabled = false
          if(trackItemEnt.hasComponent(TRIGGER_COMPONENT_CLASS)){
            trackItemEnt.removeComponent( TRIGGER_COMPONENT_CLASS )
          }
          if(trackFeature.sceneEnts){
            for(const p in trackFeature.sceneEnts){
              trackFeature.sceneEnts[p].hide()
            }
          }
        break;
      }
    }


  //storing it as a component is easy. is it a good idea?  make copy instance?
  trackItemEnt.addComponent(trackFeature)

  trackItemEnt.addComponent(new MovesWithWorld()) 
  //dont add to engine. on when show is called do we want them added
  //engine.addEntity(trackItemEnt)

  return trackItemEnt
}
export function createStartPosition(trackData:TrackData,startPosition:number):Entity{
  
  let startPos = new Entity("start-pos-"+startPosition + "")
  //START DEBUG UI
  if(CONFIG.DEBUGGING_ENABLED && CONFIG.DEBUGGING_UI_ENABLED){
    const shape = new ConeShape()
    shape.withCollisions = false
    startPos.addComponent(shape)
    

    let startPosShape = new Entity("start-pos-"+startPosition + "-text")
    
    const textShape = new TextShape(""+(startPosition+1))
    startPosShape.addComponent( textShape )
    startPosShape.addComponent(new Transform({
      position: new Vector3(0, 2, 0)
    }))
    startPosShape.setParent(startPos)
  }
  //END DEBUG UI

  setStartPositionEntity(startPos,trackData,startPosition)
  //finishFlag.getComponent(Transform).position.addInPlace( WORLD_MOVE_DIR_BKWD )


  startPos.addComponent(new MovesWithWorld())
  engine.addEntity(startPos)

  return startPos
}

@Component("raceTrackComponent")
export class RaceTrackComponent {   
}


@Component("raceTrackData")
export class RaceTrackData {  
  segId:number 
}


@Component("HasSubObject")
export class HasSubObject {   
}

    

type SpawnedTracker={segId:number,loadedFeatures:boolean,featureCount?:number}

export class TrackSpawnSystem {

    stepsPerFrame:number = 1
    group = engine.getComponentGroup(RaceTrackComponent,MovesWithWorld)     
   
    trackSpawner:TrackSpawner
    visibleSegments:Record<string,SpawnedTracker>={}//TODO move inside trackData object??
    segmentsToLoad:Record<string,SpawnedTracker>={}
    
    constructor(trackSpawner:TrackSpawner){
      this.trackSpawner = trackSpawner
      this.reset()
    }

    //TODO consider moving to trackData
    isVisibleSegment(segId:number|string){

      const key:string = Math.floor(typeof segId === 'string' ? parseInt(segId) : segId).toFixed(0)
      return this.visibleSegments[key] !== undefined
    }
    reset(){
      this.visibleSegments = {}
      this.segmentsToLoad = {}
    }

    

    updateTrack(sideTrackData:TrackSideDataType, forward:boolean){
      const trackData = GAME_STATE.trackData
      const trackPath = trackData.trackPath
      const normalArray = trackData.normalArray
      const trackPathDistances = trackData.trackPathDistances
      
      if(sideTrackData.origin < 0){
        sideTrackData.origin += trackPath.length
      }

      if(sideTrackData.target < 0){
        sideTrackData.origin += trackPath.length
      }
      if(sideTrackData.lastOrigin < 0){
        sideTrackData.origin += trackPath.length
      }

      if(sideTrackData.lastTarget < 0){
        sideTrackData.origin += trackPath.length
      }


      let trackPos = Vector3.Lerp(trackPath[sideTrackData.origin], trackPath[sideTrackData.target], sideTrackData.fraction).addInPlace(normalArray[sideTrackData.origin].multiplyByFloats(sideTrackData.offsetFromCenter, sideTrackData.offsetFromCenter, sideTrackData.offsetFromCenter)) 
      //let trackLastPos = Vector3.Lerp(trackPath[trackData.trackLastOrigin], trackPath[trackData.trackLastTarget], trackData.trackLastFraction).addInPlace(normalArray[trackData.trackLastOrigin].multiplyByFloats(roadWidth, roadWidth, roadWidth)) 

      //trackPosRight = Vector3.Lerp(trackPath[trackOriginRight], trackPath[trackTargetRight], trackFractionRight).addInPlace(normalArray[trackOriginRight].multiplyByFloats(roadWidth, roadWidth, roadWidth)) 
      //trackLastPosRight = Vector3.Lerp(trackPath[trackLastOriginRight], trackPath[trackLastTargetRight], trackLastFractionRight).addInPlace(normalArray[trackLastOriginRight].multiplyByFloats(roadWidth, roadWidth, roadWidth)) 
  
      //MOVE THIS OUT OF HERE??
      //scene.lastTrackPos.copyFrom(trackLastPos)
      scene.lastTrackIndex = sideTrackData.lastOrigin
      scene.lastTrackFraction = sideTrackData.lastFraction
      //MOVE THIS OUT OF HERE??

      //Forward
      if(forward){
      for (let i=0; i<this.stepsPerFrame; i++)
      {          
        if(!this.isOutOfBounds(trackPos,3))
        {      

          sideTrackData.fraction += 1/trackPathDistances[sideTrackData.origin]
        // trackData.fraction +=  0.25

          // log("distance: " + trackPathDistances[trackData.origin])
          // log("Origin: " + trackData.origin)
          // log("Target: " + trackData.target)
          // log("Fraction: " + trackData.fraction)
        
          if(sideTrackData.fraction > 1)
          {
            sideTrackData.fraction -= 1
            sideTrackData.nextIndex += 1

            sideTrackData.origin = sideTrackData.target

            if(  sideTrackData.nextIndex >= trackPath.length)
            {
              sideTrackData.nextIndex = 0
              //trackOrigin = 0
            }           
            sideTrackData.target = sideTrackData.nextIndex
          }       

          trackPos = Vector3.Lerp(trackPath[sideTrackData.origin], trackPath[sideTrackData.target], sideTrackData.fraction).addInPlace(normalArray[sideTrackData.origin].multiplyByFloats(sideTrackData.offsetFromCenter, sideTrackData.offsetFromCenter, sideTrackData.offsetFromCenter))           
          sideTrackData.distance = distance(sideTrackData.lastPos, trackPos)
          

          // log("trackDistance: " + trackDistance )
        // log("SPACING: " +  trackSpacing)        

          if (sideTrackData.distance > trackSpacing)         
          {        
            //log("PLACING BECAUSE DISTANCE")
            //log("distance is big enough") 
            if (!this.isOutOfBounds(trackPos, 3))        
            {
              
              const segId = sideTrackData.target
              log("track.Spawning track here: " , trackPos,"segId",segId,"for",sideTrackData,"visibleSegments",this.visibleSegments,"segmentsToLoad",this.segmentsToLoad)
              if(!trackPath[sideTrackData.origin]) log("trackPath[sideTrackData.origin] null!!!")
              if(!trackPath[sideTrackData.target]) log("trackPath[sideTrackData.target] null!!!")
              let rotAngle = ToDegrees( Vector3.GetAngleBetweenVectors(Vector3.Forward(),trackPath[sideTrackData.origin].subtract(trackPath[sideTrackData.target]),Vector3.Up()) )  
              if(sideTrackData.flip){
                rotAngle-=180
              }

              if(!this.visibleSegments[segId]){
                this.visibleSegments[segId]={segId:segId,loadedFeatures:false}
                this.segmentsToLoad[segId]=this.visibleSegments[segId]
              }
              
              this.trackSpawner.spawnTrack(trackPos.x, trackPos.y, trackPos.z, rotAngle,segId)           
              
              log("track.Spawned track here: " , trackPos,"segId",segId,"for",sideTrackData,"visibleSegments",this.visibleSegments,"segmentsToLoad",this.segmentsToLoad)

              sideTrackData.lastFraction = sideTrackData.fraction
              sideTrackData.lastOrigin = sideTrackData.origin
              sideTrackData.lastTarget = sideTrackData.target
              sideTrackData.lastPos.copyFrom(trackPos) 
              // log("PLACED at: " + trackPos)
              sideTrackData.distance = 0 
              
            }
            
            sideTrackData.origin = sideTrackData.lastOrigin
            sideTrackData.target = sideTrackData.lastTarget
            sideTrackData.fraction =  sideTrackData.lastFraction 
            sideTrackData.nextIndex =  sideTrackData.lastTarget  

          }  
        }  
      }
    }
    
    sideTrackData.lastPos.addInPlace(scene.worldMoveVector)  
  }

    update(dt: number){       
      const trackData = GAME_STATE.trackData
      const trackPath = trackData.trackPath
      
      //let world = worldManager.getComponent(worldState)    
      //move track path with the world
      for(let i=0; i< trackPath.length; i++){
        trackPath[i].addInPlace(scene.worldMoveVector)
      }

      
      this.updateTrack(trackData.trackDataLeft, true)
      this.updateTrack(trackData.trackDataRight, true)
    //  this.updateTrack(trackDataLeftReverse, false)
     // this.updateTrack(trackDataRightReverse, false)
      
  
      for (let entity of this.group.entities) 
      {
        let transform = entity.getComponent(Transform)     
        
        //TODO encapsulate track into class
        // TRACK REMOVE
        if(this.isOutOfBounds(transform.position, 0))
        {

          const segId=entity.getComponent(RaceTrackData).segId
  
          this.trackSpawner.removeEntity(entity)
          if(this.visibleSegments[segId]){
            this.visibleSegments[segId].loadedFeatures=false
            const trackFeatures = trackData.getTrackFeaturesForSegment(segId)
            if(trackFeatures){
              for(const p in trackFeatures){
                if(trackFeatures[p].handler) trackFeatures[p].handler(trackFeatures[p],'hide',segId,segId)
              }
            }
            delete this.segmentsToLoad[segId]
            delete this.visibleSegments[segId]
          }
          log("track.remove track here: " + segId,"visibleSegments",this.visibleSegments,"segmentsToLoad",this.segmentsToLoad)
          //engine.removeEntity(entity)
        }
        
      }

      this.renderVisibleSegments(trackData)
      
      
      
      //log("tracks Update ENDS")
    }

    renderVisibleSegments(_trackData?:TrackData,force?:boolean){
      const forceLoad = (force !== undefined && force )
      let trackData = _trackData !== undefined ? _trackData : GAME_STATE.trackData

      const objToUse = forceLoad ? this.visibleSegments : this.segmentsToLoad 

      for(const p in objToUse){
        const visSeg = objToUse[p]
        if(!visSeg.loadedFeatures || forceLoad){
          
          const trackFeatures = trackData.getTrackFeaturesForSegment(visSeg.segId)
          
          if(!trackFeatures){
            //log("renderVisibleSegments","segid",visSeg.segId,"items","-1 (none)")
            continue
          }
          log("renderVisibleSegments","segid",visSeg.segId,"items",trackFeatures.length)
          for(const p in trackFeatures){
            if(trackFeatures[p].handler){
              log("renderVisibleSegments","segid",visSeg.segId,"items",trackFeatures.length,"calling show for",trackFeatures[p].name)
              trackFeatures[p].handler(trackFeatures[p],'show',visSeg.segId,visSeg.segId)
            } 
          }
          visSeg.featureCount = trackFeatures ? trackFeatures.length : 0
          visSeg.loadedFeatures = true

          delete this.segmentsToLoad[p]
        }
      }
    }
  
    isOutOfBounds(pos: Vector3, radius:number): boolean{
      if(!pos) log("tracePlacement.isOutOfBounds pos is null!!!",pos)
      let safetyBounds = radius
       if(pos.x > scene.sizeX - safetyBounds || pos.x < safetyBounds || pos.z > scene.sizeZ - safetyBounds || pos.z < safetyBounds){
         
         return true
       }   
       return false
     }  

  
  }

 //MOVED TO src/modules/scene/race.ts
 //export let myTrackSpawnSystem = new TrackSpawnSystem()
 //engine.addSystem(myTrackSpawnSystem)



 //TODO consider making singleton?
 export class TrackSpawner extends AbstractMoveWithWorldSpawner{
   spawnCount:number  =0

   spawnTrack(x:number, y:number, z:number, rot:number,segId:number):Entity {
      const ent =  this.spawnEntity(x,y,z,rot)

      if(!ent){
        log("TrackSpawner.spawnTrack() WARNING spawnTrack returned null entity. pool exhausted",ent,x,y,z,rot)
        return
      }
      //add track data!!! like side, segment etc???

      if(!ent.hasComponent(RaceTrackData)) {
        ent.addComponent(new RaceTrackData())    
      }
      ent.getComponent(RaceTrackData).segId = segId

      return ent;
   }
    spawnEntity(x:number, y:number, z:number, rot:number):Entity {
      const track = this.getEntityFromPool()
  
      if (!track) return
  

      this.ensureCorrectModelUsed(track,levelManager.getCurrentLevel().theme.trackEdgeMesh)

      let transform = track.getComponentOrCreate(Transform)
      
      transform.position = new Vector3(x, y, z),        
      transform.rotation = Quaternion.Euler(0,rot,0),        
      transform.scale = new Vector3(1,1,1)
    
  
      if(!track.hasComponent(RaceTrackComponent))
      {
        track.addComponent(new RaceTrackComponent())    
      }  
      track.getComponentOrCreate(MovesWithWorld).active = true
      //this.entityPool[i].getComponent(MovesWithWorld).active = true

      if( !track.hasComponent(HasSubObject) && Math.random() > 0.5){
        
        let subObject = new Entity()
        let randScaleY = 1.1 - Math.random()*0.3
        let randScaleX = 1 + Math.random()*0.1
          
        this.ensureCorrectModelUsed(subObject,levelManager.getCurrentLevel().getRandomDecoration())
        
        subObject.addComponent(new Transform({
          position: new Vector3(0,0,0),
        scale: new Vector3(randScaleX,randScaleY,1  )}))
        //tree.addComponent(new Billboard(false,true,false))
        subObject.setParent(track)

      }else if(track.hasComponent(HasSubObject)){
        for(const p in track.children){
          const subObject = track.children[p]
          
          this.ensureCorrectModelUsed(subObject,levelManager.getCurrentLevel().getRandomDecoration())
        }
      }
      track.addComponentOrReplace(new HasSubObject())
      
  
      //object.addComponent(new popInObject())    
      engine.addEntity(track)    
      log("ADDED TRACK: " + this.spawnCount++ )

      return track;
    }   
  
    ensureCorrectModelUsed(subObject:IEntity,subShapeToUse:GLTFShape){
      if(!subObject.hasComponent(GLTFShape))
      {
        //replacing each time as dont know what it will hold
        subObject.addComponentOrReplace(subShapeToUse)    
      }else if(subObject.getComponent(GLTFShape) != subShapeToUse){
        log("track.spawnEntity.replacing mesh")
        subObject.addComponentOrReplace(subShapeToUse)    
      }
    }
  }
