export interface Vector3State{
  x:number
  y:number
  z:number
}
export interface Quaternion3State{
  x:number
  y:number
  z:number
  w:number
}


export interface ClockState{
  serverTime:number
}
export interface PlayerButtonState{
  forward:boolean
  backward:boolean
  left:boolean
  right:boolean
  shoot:boolean
}

export interface PlayerRaceDataState extends ClockState{
  //move this to player race specific data???
  carScenePosition:Vector3State //car location will scene center since it does not move
  closestProjectedPoint:Vector3State //is scene relative, but when used with closestSegmentID + track data can compute where
  worldPosition:Vector3State
  closestSegmentID:number
  closestPointID:number

  closestSegmentPercent:number// relates to closestSegmentID.  what percent of this segement is player at
  closestSegmentDistance:number //how far player is from center, aka the segement

  currentSpeed:number
  worldMoveDirection:Quaternion3State//world moving direction
  shootDirection:Quaternion3State //car forward direction
  cameraDirection:Quaternion3State //turn angle
  endTime:number //move this as wont change till the end
  carModelId:string //move this as wont change much if at all?
  lap:number //move this as wont change till the end //currently base 1 index   first lap is lap:1
  //lapTimes //TODO ADD DEFINITION HERE!!!
  racePosition:number 

  lastKnownServerTime:number
  lastKnownClientTime:number
  
  //isDrifting: boolean
  //currentSpeed : number
}

export type RaceStatus="unknown"|"not-started"|"starting"|"started"|"ended"
export type PlayerConnectionStatus="unknown"|"connected"|"reconnecting"|"disconnected"|"lost connection"

export interface PlayerState{
  id:string
  sessionId:string

  connStatus:PlayerConnectionStatus
  type:string

  userData:PlayerUserDataState
  racingData:PlayerRaceDataState
  buttons: PlayerButtonState
}



export interface PlayerUserDataState{
  name:string
  userId:string
  ///snapshotFace128:string snapshots deprecated use AvatarTexture
}

export interface RaceState extends ClockState{
  id:string
  name:string
  status:RaceStatus
  startTime:number
  endTime:number
  maxLaps:number //move to track data or is max laps race data?
}

//broadcast object instead of linking to state the level details
export interface LevelDataState{
  id:string
  name:string
  //status:RaceStatus

  //theme:Theme
  //FIXME cannot declare this
  trackFeatures:Map<any,ITrackFeatureState>//Map<any,TrackFeatureConstructorArgs>
  localTrackFeatures?:TrackFeatureConstructorArgs[] //for loading only, not for state sharing

  maxLaps:number //move to track data or is max laps race data?
  trackPath:Vector3State[]
  //other track info?
}


export type TrackFeatureType='boost'|'slow-down'|'inert'|'wall'

export function getTrackFeatureType(str:string){
  return str as TrackFeatureType
}

export interface TrackFeatureConstructorArgs{
    name:string
    position:ITrackFeaturePosition
    //triggerSize?:Vector3
    //shape:TrackFeatureShape
    type:TrackFeatureType
    activateTime?:number
}
export interface TrackFeatureUpdate extends TrackFeatureConstructorArgs{
  
}

//can we get rid of and replace with 'TrackFeatureConstructorArgs'?

export interface ITrackFeatureState{
  name:string
  position:ITrackFeaturePosition
  //triggerSize?:Vector3
  //shape:TrackFeatureShape
  type:string //ONLY DIFF???
  activateTime?:number
}

export interface TrackFeatureStateConstructorArgs extends ITrackFeatureState{
}

export type TrackFeaturePositionConstructorArgs={
  position?:Vector3State//optional, if set its the exact spot
  rotation?:Quaternion3State//optional, if set its the exact rotation
  startSegment:number
  endSegment:number
  offset?:Vector3State
  centerOffset?:number
}

export function createTrackFeaturePositionConstructorArgs(position:ITrackFeaturePosition){
  return { 
      startSegment: position.startSegment ,
      endSegment: position.endSegment ,
      offset: position.offset ,
      centerOffset: position.centerOffset
  } 
}

export interface ITrackFeaturePosition{
  position?:Vector3State//optional, if set its the exact spot
  rotation?:Quaternion3State//optional, if set its the exact rotation
  startSegment:number
  endSegment:number
  offset?:Vector3State
  centerOffset?:number
  //entity:Entity

}
export class TrackFeaturePosition implements ITrackFeaturePosition{
  position?:Vector3State//optional, if set its the exact spot
  rotation?:Quaternion3State//optional, if set its the exact rotation
  startSegment:number
  endSegment:number
  offset?:Vector3State
  centerOffset?:number
  //entity:Entity

  constructor(args:TrackFeaturePositionConstructorArgs){
    this.startSegment = args.startSegment
    this.endSegment = args.endSegment
    this.centerOffset = args.centerOffset
    this.position = args.position
    if(args.offset) this.offset = args.offset
  }
}

export interface RaceDataOptions{
  levelId:string
  name?:string
  maxLaps?:number
  maxPlayers?:number
  customRoomId?:string
}

export interface EnrollmentState extends ClockState{
  open:boolean
  startTime:number
  endTime:number
  maxPlayers:number
}


export interface RacingRoomState{
  players:Map<any,PlayerState>
  raceData:RaceState
  enrollment:EnrollmentState
  levelData:LevelDataState
}