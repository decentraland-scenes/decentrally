import * as clientState from './connection/state/client-state-spec'
import { getUserData, UserData } from "@decentraland/Identity";
import { getAndSetUserData } from './userData';
import { CONFIG } from 'src/config';
import { MovingAverage } from './movingAverage';

const ParcelScale:number = 3

//@Component("worldState")
export class Scene {
  scale: number 
  sizeX: number
  sizeY: number
  sizeZ: number
  carWidth:number
  lobbyElevation:number
  raceGroundElevation: number
  //workaround to blooms showing up even in hideen areas, going to randomly place race game height to minimimze the issue
  //raceElevationStartRange is the lowest possible point it can spawn
  //raceElevationRange is the span for which it can spawn
  raceElevationStartRange: number
  raceElevationRange: number
  inCarPlayerGroundElevation: number
  movePlayerYPadding:number
  preventJumpColliderYPos:number
  startPlayerWayAboveRacePosYPad:number
  //groundElevation: number = 1
  maxObjectRadius:number 
  center: Vector3 
  sceneInnerRadius: number 
  
  playerHeight:number 

  worldMoveVector : Vector3
  
  
  
  worldTopSpeed : number 
  worldTopSpeedWithBoost : number 
  worldTopSpeedBackward : number   


  DRAG_MAX:number
  BOOST_MAX:number
  BOOST_DECEL:number

  

  groundTilingFactor: number 
  lastTrackPos:Vector3
  lastTrackIndex:number 
  lastTrackFraction: number 
  distanceFromStart:number
  distanceFromCenterLine:number //PLAYER DATA
  roadDir:Vector3
  menuPositions:TransformConstructorArgs[]
  
  constructor(){
    this.reset()

    let menuElevation = 4
    this.menuPositions = []
    this.menuPositions.push({
      position: new Vector3(this.center.x + 3.85,menuElevation, this.center.z + 3.85),
      rotation: Quaternion.Euler(-6.76, -135, 0)
    })    
    this.menuPositions.push({
      position: new Vector3(this.center.x + 3.85,menuElevation, this.center.z - 3.85),
      rotation: Quaternion.Euler(-6.76, 315, 0)
    })
    this.menuPositions.push({
      position: new Vector3(this.center.x - 3.85,menuElevation, this.center.z - 3.85),
      rotation: Quaternion.Euler(-6.76, 45, 0)
    })
    this.menuPositions.push({
      position: new Vector3(this.center.x - 3.85, menuElevation, this.center.z + 3.85),
      rotation: Quaternion.Euler(-6.76, 135, 0)
    })  
  }

  reset(){
    this.scale = ParcelScale
    this.sizeX = ParcelScale*16
    this.sizeZ = ParcelScale*16 
    this.sizeY = (Math.log((ParcelScale*ParcelScale) + 1) * Math.LOG2E) * 20// log2(n+1) x 20 //Math.log2( ParcelScale + 1 ) * 20
    this.movePlayerYPadding = .2//2 //how much more of the Y should we account for to "drop the player", to ensure they collid with ground
    this.startPlayerWayAboveRacePosYPad = 5//how much more of the Y should we account for to "drop the player", trying to hide bloom
    this.carWidth = 1
    this.lobbyElevation = 0
    //workaround to blooms showing up even in hidden areas, going to randomly place race game height to minimimze the issue
    //raceElevationStartRange is the lowest possible point it can spawn
    //3x3 has a max of ~66 meters  13+12 will be as high as 25 leaving room for 15 meter tall items at most
    //set raceElevationRange to 0 if you want a fixed race spawn location 
    //realized random placement will cause entire bodies / not just heads to appear leaving at 0 for now.
    //maybe we can spawn off to side, for a second, them move then in?
    this.raceElevationRange = 0 //how many meters it can span. between raceElevationStartRange - (raceElevationStartRange+raceElevationRange)
    this.raceElevationStartRange = 16//12
    //this is the height the player will stand at to be in the car
    this.inCarPlayerGroundElevation = this.raceElevationStartRange + Math.floor(Math.random()*this.raceElevationRange) //TODO RAISE THIS UP
    this.raceGroundElevation = this.inCarPlayerGroundElevation + 1.45
    this.preventJumpColliderYPos = this.inCarPlayerGroundElevation + 2

    log("scene.this.raceGroundElevation",this.raceGroundElevation,this.sizeY)

    //groundElevation = 1
    this.maxObjectRadius = 0.5
    this.center = new Vector3(this.sizeX/2,this.raceGroundElevation,this.sizeZ/2)
    this.sceneInnerRadius = Math.sqrt( Math.pow(this.sizeX/2, 2))   
    
    this.playerHeight = 1.8 //1.177 = camera position
    this.worldMoveVector  = new Vector3(0,0,0)  
    //this.worldMoveDirection = Quaternion.Euler(0,0,0)
    
    
    this.worldTopSpeed   = 12
    this.worldTopSpeedWithBoost = this.worldTopSpeed

    this.DRAG_MAX = .4
    this.BOOST_MAX = 1
    this.BOOST_DECEL = 2

    this.worldTopSpeedBackward   = -1   
    this.groundTilingFactor = 15  
    this.lastTrackPos = Vector3.Zero()
    this.lastTrackIndex = 0
    this.lastTrackFraction = 0
    this.distanceFromStart = 0
    this.distanceFromCenterLine = 0 //PLAYER DATA
    this.roadDir = Vector3.Forward()
    
  }
}



export type PlayerBaseArg={
  id?:string
  sessionId?:string //mere with id??
  name?: string
  userId?:string
  carModelId?:string //MOVE ME SOMEWHERE BETTER!! make car state???
}
export class PlayerBase {
  id:string
  sessionId:string //mere with id??
  name: string
  userId:string
  isDriving:boolean
  isNearCar:boolean
  friction: number
  sideFriction: number
  driftFriction: number
  appliedSlowdownFriction: number
  appliedBoostFriction: number
  isDrifting: boolean
  currentSpeed : number
  MOVE_FORWARD: boolean
  MOVE_BACKWARD: boolean
  shoot_btn_down:boolean
  acceleration : number
  deceleration : number
  closestProjectedPoint:Vector3 //is world relative, not sure how much will help multi player
  closestSegmentID:number  //closest segment as a whole AKA track index (player is on this segment)
  forwardMostVisitedSegmentID:number  //closest segment as a whole AKA track index (player is on this segment)
  closestPointID:number //closest point on segment (could be behind or in front of player, its as a whole which they are closer to)

  closestSegmentPercent:number// relates to closestSegmentID.  what percent of this segement is player at
  closestSegmentDistance:number //how far player is from center, aka the segement

  
  projectileTimer:number
  //projectileCount:number
  boostReloadTimer:number
  //boosterCount:number

  wrongWay:boolean
  isOnSideRight:boolean
  worldMoveDirection: Quaternion
  cameraDirection: Quaternion
  carRotation: Quaternion
  shootDirection: Quaternion
  carModelId:string //MOVE ME SOMEWHERE BETTER!! make car state???

  raceEndTime:number
  completedRace:boolean //currently using raceEndTime !== undefined
  racePosition:number
  lap:number 
  currentCheckpointIndex:number 

  latencyAvgMv:MovingAverage
  latencyAvg:number
  latencyLast:number
  lastKnowServerTime:number
  lastKnownClientTime:number

  lastKnownWorldPosition:Vector3
  
  constructor(args?:PlayerBaseArg){
    this.reset()

    this.update(args)
  }

  update(args:PlayerBaseArg){
    if(args){
      if(args.id) this.id = args.id
      if(args.sessionId) this.sessionId = args.sessionId
      if(args.name) this.name = args.name
      if(args.carModelId) this.carModelId = args.carModelId
    }
  }

  //http://www.zrzahid.com/moving-average-of-last-n-numbers-in-a-stream/
  //https://shareablecode.com/snippets/moving-average-from-data-stream-c-solution-leetcode-Gmzm-7sjZ
  //https://www.toni-develops.com/2022/04/12/moving-average-from-data-stream/?utm_source=rss&utm_medium=rss&utm_campaign=moving-average-from-data-stream
  updateLatency(clientTime:number,serverTime:number){
    if(this.lastKnownClientTime > 0){
      //TODO take a weight average as seeing it cycle, 0 should not be possible
      /*
      index.js:83 kernel:scene: [-14, 76]    calculateWorldPosFromWorldPos latancey 0 0
      2index.js:83 kernel:scene: [-14, 76]    calculateWorldPosFromWorldPos latancey 0.3604 360.4
      2index.js:83 kernel:scene: [-14, 76]    calculateWorldPosFromWorldPos latancey 0.2125 212.5
      2index.js:83 kernel:scene: [-14, 76]    calculateWorldPosFromWorldPos latancey 0.13090000000000002 130.9
      2index.js:83 kernel:scene: [-14, 76]    calculateWorldPosFromWorldPos latancey 0.1751 175.1
      2index.js:83 kernel:scene: [-14, 76]    calculateWorldPosFromWorldPos latancey 0.1802 180.2
      2index.js:83 kernel:scene: [-14, 76]    calculateWorldPosFromWorldPos latancey 0 0
      */
      //should we add in + CONFIG.SEND_RACE_DATA_FREQ_MILLIS?

      this.latencyLast = Math.max((clientTime - this.lastKnownClientTime) + CONFIG.LATENCY_MISC_FACTOR, CONFIG.SEND_RACE_DATA_FREQ_MILLIS )//times 2 for round trip??
      this.latencyAvgMv.add( this.latencyLast )
      this.latencyAvg = this.latencyAvgMv.average
      
    }
    this.lastKnownClientTime =  clientTime
    this.lastKnowServerTime = serverTime
  }
  
  markCompletedRace(reason:string){
    log("player.","markCompletedRace",this.name,this.userId,"alreadyComplete",this.completedRace,reason)
    this.completedRace = true
  }

  reset(){
    this.id=undefined
    this.sessionId=undefined //mere with id??
    this.name = '_0'  
    this.userId = undefined
    this.isDriving = false
    this.isNearCar = false
    this.friction = 0
    this.appliedSlowdownFriction = 0
    this.appliedBoostFriction = 0
    this.sideFriction = 0
    this.driftFriction = 0
    this.isDrifting = false
    this.currentSpeed  = 0 
    this.MOVE_FORWARD = false
    this.MOVE_BACKWARD = false 
    this.shoot_btn_down = false
    this.acceleration  = 2
    this.deceleration  = 1.5
    this.closestProjectedPoint = new Vector3(0,0,0) //is world relative, not sure how much will help multi player
    this.closestSegmentID = 0 //closest segment as a whole AKA track index
    this.forwardMostVisitedSegmentID = 0
    this.closestPointID=0 //closest point on segment
    this.closestSegmentPercent=0// relates to closestSegmentID.  what percent of this segement is player at
    this.closestSegmentDistance=0 //how far player is from center, aka the segement
    //this.projectileCount=0
    //this.boosterCount=0
    this.boostReloadTimer=0
    this.projectileTimer=0
    this.wrongWay = false
    this.isOnSideRight = false
    this.worldMoveDirection = Quaternion.Euler(0,0,0)
    this.cameraDirection = Quaternion.Euler(0,0,0)
    this.carRotation = Quaternion.Euler(0,0,0)
    this.shootDirection = Quaternion.Euler(0,0,0)  
    this.carModelId = undefined
    this.raceEndTime = undefined
    this.completedRace = false
    this.racePosition = undefined
    this.lap = 1
    this.currentCheckpointIndex = 0   
    
    this.latencyLast = -1 
    this.latencyAvg = -1
    this.latencyAvgMv = new MovingAverage(CONFIG.LATENCY_AVERAGE_WINDOW_SIZE)
    this.lastKnowServerTime = -1

    this.lastKnownWorldPosition = new Vector3()
  }
}


export class PlayerState extends PlayerBase {
  camera: Camera = Camera.instance
  serverState: clientState.PlayerState
  avatarTexture?:AvatarTexture
}


// object to store world data
export const scene = new Scene()

export const player = new PlayerState()

export function ResetWorld()
{   
  scene.reset()
}

