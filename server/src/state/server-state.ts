import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { CONFIG } from "../rooms/config";
import * as serverStateSpec from "./server-state-spec";


export class Quaternion3State extends Schema implements serverStateSpec.Quaternion3State {

  @type("number")
  x: number;
  @type("number")
  y: number;
  @type("number")
  z: number;
  @type("number")
  w: number;

  constructor(x: number, y: number, z: number, w: number) {
    super()
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }
  //this wont update entire object state but just the individual properties
  copyFrom(q: serverStateSpec.Quaternion3State) {
    this.x = q.x
    this.y = q.y
    this.z = q.z
    this.w = q.w
  }
}
export class Vector3State extends Schema implements serverStateSpec.Vector3State {

  @type("number")
  x: number;
  @type("number")
  y: number;
  @type("number")
  z: number;

  constructor(x: number, y: number, z: number) {
    super()
    this.x = x
    this.y = y
    this.z = z
  }
  //this wont update entire object state but just the individual properties
  copyFrom(vec3: serverStateSpec.Vector3State) {
    this.x = vec3.x
    this.y = vec3.y
    this.z = vec3.z
  }
}
export class PlayerButtonState extends Schema implements serverStateSpec.PlayerButtonState {
  @type("boolean")
  forward: boolean
  @type("boolean")
  backward: boolean
  @type("boolean")
  left: boolean
  @type("boolean")
  right: boolean
  @type("boolean")
  shoot: boolean

  copyFrom(buttons: serverStateSpec.PlayerButtonState) {
    if (!buttons) return

    if (buttons.forward !== undefined) this.forward = buttons.forward
    if (buttons.backward !== undefined) this.backward = buttons.backward
    if (buttons.shoot !== undefined) this.shoot = buttons.shoot
  }
}
export class PlayerRaceDataState extends Schema implements serverStateSpec.PlayerRaceDataState {

  @type(Vector3State)
  carScenePosition: Vector3State = new Vector3State(0, 0, 0)

  @type(Vector3State)
  closestProjectedPoint: Vector3State = new Vector3State(0, 0, 0)

  @type(Vector3State)
  worldPosition: Vector3State = new Vector3State(0, 0, 0)

  @type("number")
  closestPointID: number = -1

  @type("number")
  closestSegmentID: number = -1

  @type("number")
  closestSegmentPercent: number = 0

  @type("number")
  closestSegmentDistance: number

  @type("number")
  currentSpeed: number = 0

  @type(Quaternion3State)
  worldMoveDirection: Quaternion3State = new Quaternion3State(0, 0, 0, 0)

  @type(Quaternion3State)
  shootDirection: Quaternion3State = new Quaternion3State(0, 0, 0, 0)

  @type(Quaternion3State)
  cameraDirection: Quaternion3State = new Quaternion3State(0, 0, 0, 0)

  @type("number")
  endTime: number

  @type("string")
  carModelId: string

  @type("boolean")
  isDrifting: boolean

  @type("number")
  serverTime: number = -1

  @type("number")
  lap: number = 1

  @type("number")
  racePosition: number

  @type(["number"])
  lapTimes = new ArraySchema<number>();

  @type("number")
  lastKnownServerTime: number = -1

  @type("number")
  lastKnownClientTime: number = -1
  
  enrollTime: number //TODO put somewhere else?
  lastKnownLap: number = -1
  lastKnownSegment: number = -1
  //needed for start of race, racers start off behind 0, need to know when they cross the start line
  visitedSegment0: boolean = false
  lastLapStartTime: number

  constructor() {
    super()

    this.updateServerTime()
  }

  updateServerTime() {
    this.serverTime = Date.now()
  }

  copyFrom(data: serverStateSpec.PlayerRaceDataState) {
    if (!data) return

    if (data.closestPointID !== undefined) this.closestPointID = data.closestPointID
    if (data.closestSegmentID !== undefined) this.closestSegmentID = data.closestSegmentID
    if (data.closestSegmentPercent !== undefined) this.closestSegmentPercent = data.closestSegmentPercent
    if (data.closestSegmentDistance !== undefined) this.closestSegmentDistance = data.closestSegmentDistance
    if (data.currentSpeed !== undefined) this.currentSpeed = data.currentSpeed
    if (data.carModelId !== undefined) this.carModelId = data.carModelId
    if (data.cameraDirection !== undefined) this.cameraDirection = new Quaternion3State(data.cameraDirection.x, data.cameraDirection.y, data.cameraDirection.z, data.cameraDirection.w)
    if (data.shootDirection !== undefined) this.shootDirection = new Quaternion3State(data.shootDirection.x, data.shootDirection.y, data.shootDirection.z, data.shootDirection.w)
    if (data.worldMoveDirection !== undefined) this.worldMoveDirection = new Quaternion3State(data.worldMoveDirection.x, data.worldMoveDirection.y, data.worldMoveDirection.z, data.worldMoveDirection.w)
    if (data.lastKnownServerTime !== undefined) this.lastKnownServerTime = data.lastKnownServerTime
    if (data.lastKnownClientTime !== undefined) this.lastKnownClientTime = data.lastKnownClientTime
    
    //console.log("copy from ",data.closestProjectedPoint)
    if (data.closestProjectedPoint !== undefined) this.closestProjectedPoint = new Vector3State(data.closestProjectedPoint.x, data.closestProjectedPoint.y, data.closestProjectedPoint.z)
    if (data.worldPosition !== undefined) this.worldPosition = new Vector3State(data.worldPosition.x, data.worldPosition.y, data.worldPosition.z)

    //TODO can these be inferred/calculated from player
    // closestSegmentID? keep track of last segment id when flips over its a lap?
    if (data.lap !== undefined) this.lap = data.lap
    //when lap flips over to race.maxLaps? 
    //computing server side if(data.endTime !== undefined) this.endTime = data.endTime
    //computing server side if(data.racePosition !== undefined) this.racePosition = data.racePosition

    this.updateServerTime()
    //console.log("copy from ",data.closestProjectedPoint,this.racingData.closestProjectedPoint.z)
  }

  hasFinishedRace() {
    return (this.endTime !== undefined && this.endTime > 0)
  }
}
function vector3CopyFrom(src: serverStateSpec.Vector3State, dest: serverStateSpec.Vector3State) {
  src.x = dest.x
  src.y = dest.y
  src.z = dest.z
}

//data we do not want visible client side
export type PlayerServerSideData = {
  playFabData: {
    id: string
    sessionTicket: string
  }
  //sessionId:string
  //endGameResult?: PlayFabHelper.GameEndResultType
}

export class PlayerUserDataState extends Schema implements serverStateSpec.PlayerUserDataState {

  @type("string")
  name: string = "Anonymous"

  @type("string")
  userId: string


  //@type("string")
  //snapshotFace128:string //use AvatarTexture

  //START non shared vars

  updateName(name: string) {
    this.name = name
  }
  updateUserId(id: string) {
    this.userId = id
  }
}
export class PlayerState extends Schema implements serverStateSpec.PlayerState {
  @type("string")
  id: string

  @type("string")
  type: string

  @type("string")
  connStatus: serverStateSpec.PlayerConnectionStatus = "unknown"

  @type(PlayerUserDataState)
  userData: PlayerUserDataState = new PlayerUserDataState()

  @type(PlayerRaceDataState)
  racingData: PlayerRaceDataState = new PlayerRaceDataState()

  @type(PlayerButtonState)
  buttons: PlayerButtonState = new PlayerButtonState()

  @type("string")
  sessionId: string //should be safe to share

  //START non shared vars

  userPrivateData?: PlayerServerSideData


  /**
   * update will do an inplace update and trigger individual updates under raceData
   * @param data 
   */
  updateRacingData(data: serverStateSpec.PlayerRaceDataState) {
    this.racingData.copyFrom(data)
  }
  /**
   * set will replace entire object with new one and trigger a single update on raceData object
   * @param data 
   * @returns 
   */
  setRacingData(data: serverStateSpec.PlayerRaceDataState) {
    if (!data) return

    const tmp = new PlayerRaceDataState()
    tmp.copyFrom(data)

    //preserve things that are server side only
    tmp.endTime = this.racingData.endTime
    tmp.racePosition = this.racingData.racePosition
    tmp.enrollTime = this.racingData.enrollTime
    tmp.lapTimes = this.racingData.lapTimes
    tmp.lastLapStartTime = this.racingData.lastLapStartTime
    tmp.lastKnownLap = this.racingData.lastKnownLap
    tmp.visitedSegment0 = this.racingData.visitedSegment0
    tmp.lastKnownSegment = this.racingData.lastKnownSegment

    this.racingData = tmp
  }

  /**
   * update will do an inplace update and trigger individual updates under buttons
   * @param buttons 
   */
  updateButtons(buttons: serverStateSpec.PlayerButtonState) {
    this.buttons.copyFrom(buttons)
  }
  /**
   * set will replace entire object with new one and trigger a single update on buttons object
   * @param buttons 
   * @returns 
   */
  setButtons(buttons: serverStateSpec.PlayerButtonState) {
    if (!buttons) return

    const tmp = new PlayerButtonState()
    tmp.copyFrom(buttons)

    this.buttons = tmp
  }
}

/*
export class ClockState extends Schema implements serverStateSpec.ClockState{
  @type("number")
  currentTime:number=-1
}*/


export class TrackFeaturePositionState extends Schema implements serverStateSpec.ITrackFeaturePosition {
  //position?:Vector3State//optional, if set its the exact spot
  //rotation?:Quaternion3State//optional, if set its the exact rotation
  @type("number")
  startSegment: number
  @type("number")
  endSegment: number
  
  @type(Vector3State)
  offset?: Vector3State
  @type("number")
  centerOffset?: number
  //entity:Entity

  constructor(){//(args: serverStateSpec.TrackFeaturePositionConstructorArgs) {
    super()

    //this.copyFrom(args)    
  }
  copyFrom(args: serverStateSpec.TrackFeaturePositionConstructorArgs) {
    if(!args) return
    
    this.startSegment = args.startSegment
    this.endSegment = args.endSegment
    this.centerOffset = args.centerOffset
    //this.position = args.position
    if (args.offset) this.offset = new Vector3State(args.offset.x, args.offset.y, args.offset.z)
  }
}
export class TrackFeatureState extends Schema implements serverStateSpec.ITrackFeatureState {
  @type("string")
  name: string

  @type(TrackFeaturePositionState)
  position: TrackFeaturePositionState = new TrackFeaturePositionState()
  //triggerSize?:Vector3
  //shape:TrackFeatureShape

  @type("string")
  type: string

  @type("number")
  activateTime?: number

  //FIXME need colyseus state version of this!
  constructor(args: serverStateSpec.TrackFeatureStateConstructorArgs) {
    super()

    this.name = args.name
    //this.position = args.position
    this.type = args.type
    this.activateTime = args.activateTime
    this.position.copyFrom(args.position)
    //if(args.offset) this.offset = args.offset
  }
}

export class LevelDataState extends Schema implements serverStateSpec.LevelDataState {

  @type("string")
  id: string
  @type("string")
  name: string
  //status:RaceStatus

  //theme:Theme
  //@type([ TrackFeatureState ])
  //trackFeatures = new ArraySchema<TrackFeatureState>();
  @type({ map: TrackFeatureState })
  trackFeatures = new MapSchema<serverStateSpec.ITrackFeatureState>();

  @type("number")
  maxLaps: number //move to track data or is max laps race data?

  trackPath: serverStateSpec.Vector3State[]

  copyFrom(retval: serverStateSpec.LevelDataState) {
    this.id = retval.id
    this.name = retval.name
    
    this.trackFeatures.clear()

    if(retval.trackFeatures){
      retval.trackFeatures.forEach( (value:serverStateSpec.ITrackFeatureState)=>{
        const trackFeat = value//retval.localtrackFeatures[p]
        const stateTrackFeat = new TrackFeatureState( trackFeat )
        
        console.log("stateTrackFeat.type",stateTrackFeat.type)
        
        stateTrackFeat.position.copyFrom( trackFeat.position )
        this.trackFeatures[stateTrackFeat.name] = stateTrackFeat
      } )
    }
    if(retval.localTrackFeatures){
      for(const p in retval.localTrackFeatures){
        const trackFeat = retval.localTrackFeatures[p]
        const stateTrackFeat = new TrackFeatureState( trackFeat )
        
        //console.log("stateTrackFeat.type",stateTrackFeat.type)
        
        stateTrackFeat.position.copyFrom( trackFeat.position )
        this.trackFeatures[stateTrackFeat.name] = stateTrackFeat
      } 
    }

    this.maxLaps = retval.maxLaps
    this.trackPath = retval.trackPath
  }

  copyTo(retval: serverStateSpec.LevelDataState) {
    retval.id = this.id
    retval.name = this.name
    //retval.trackFeatures = this.trackFeatures
    retval.maxLaps = this.maxLaps
    retval.trackPath = this.trackPath
  }
}

export class RaceState extends Schema implements serverStateSpec.RaceState {

  @type("string")
  id: string = ""


  @type("string")
  name: string = "Untitled Race"

  @type("string")
  status: serverStateSpec.RaceStatus = "not-started"

  @type("number")
  startTime: number = -1

  @type("number")
  endTime: number = -1

  @type("number")
  serverTime: number = -1

  @type("number")
  maxLaps: number = CONFIG.RACE_MAX_LAPS_DEFAULT//FIXME - HARDCODED FOR NOW 

  savedPlayerStats:boolean = false

  constructor() {
    super()

    this.updateServerTime()
  }

  updateServerTime() {
    this.serverTime = Date.now()
  }
  hasRaceStarted() {
    return this.status !== undefined && this.status === 'started' //(this.startTime !== undefined && this.startTime > 0 && this.startTime <= Date.now())
  }
  isRaceOver() {
    return this.status !== undefined && this.status === 'ended' //(this.startTime !== undefined && this.startTime > 0 && this.startTime <= Date.now())
  }
}

export class EnrollmentState extends Schema implements serverStateSpec.EnrollmentState {

  @type("boolean")
  open: boolean = true

  @type("number")
  startTime: number = -1

  @type("number")
  endTime: number = -1

  @type("number")
  serverTime: number = -1

  @type("number")
  maxPlayers: number = -1

  constructor() {
    super()

    this.updateServerTime()
  }

  updateServerTime() {
    this.serverTime = Date.now()
  }
}


export class RacingRoomState extends Schema implements serverStateSpec.RacingRoomState {
  @type({ map: PlayerState })
  players = new MapSchema<PlayerState>();

  @type(RaceState)
  raceData = new RaceState()

  @type(LevelDataState)
  levelData = new LevelDataState()

  @type(EnrollmentState)
  enrollment = new EnrollmentState()

  something = "This attribute won't be sent to the client-side";

  createPlayer(sessionId: string): PlayerState {
    const player = new PlayerState()
    player.sessionId = sessionId
    this.players.set(sessionId, player);

    //FIXME not thread safe, good enough??
    player.racingData.racePosition = this.players.size
    player.racingData.enrollTime = Date.now()

    return player
  }

  removePlayer(sessionId: string) {
    this.players.delete(sessionId);
  }

}