import { Realm } from '@decentraland/EnvironmentAPI'
import {  UserData } from '@decentraland/Identity'
import { Room } from 'colyseus.js'
import { CONFIG } from 'src/config'
import { GetPlayerCombinedInfoResultPayload, LoginResult } from 'src/playfab_sdk/playfab.types'
import * as clientSpec from './connection/state/client-state-spec'
import { RaceData } from './race'
import { TrackData } from './trackPlacement'


export class PlayerState{
  
  playerCustomID:string|null=null
  playerDclId:string='not-set' //player DCL address
  playerPlayFabId:string='not-set' //player playfab address
  dclUserData: UserData|null=null
  //let userData: UserData
  dclUserRealm: Realm|null=null
  playFabLoginResult:LoginResult|null=null
  playFabUserInfo: GetPlayerCombinedInfoResultPayload|undefined|null
  loginSuccess:boolean=false // move to player


  loginFlowState: PlayerLoginState='undefined'

  playerStateListeners: ObservableComponentSubscription[] = []

  requestDoLoginFlow() {
    this.notifyOnChange("requestDoLoginFlow",null,null)
  }
  setPlayerCustomID(val:string|null){
    const oldVal = this.playerCustomID
    this.playerCustomID = val
    this.notifyOnChange("playerCustomID",val,oldVal)
  }
  setLoginFlowState(val:PlayerLoginState){
    const oldVal = this.loginFlowState
    this.loginFlowState = val
    this.notifyOnChange("loginFlowState",val,oldVal)
  }
  setLoginSuccess(val:boolean){
    const oldVal = this.loginSuccess
    this.loginSuccess = val
    this.notifyOnChange("loginSuccess",val,oldVal)
  }
  setPlayFabLoginResult(val:LoginResult|null){
    const oldVal = this.playFabLoginResult
    this.playFabLoginResult = val
    this.notifyOnChange("playFabLoginResult",val,oldVal)
  }
  setDclUserData(val:UserData){
    const oldVal = this.dclUserData
    this.dclUserData = val
    this.playerDclId = val.userId //sideaffect
    this.notifyOnChange("dclUserData",val,oldVal)
  }
  setDclUserRealm(val:Realm){
    const oldVal = this.dclUserRealm
    this.dclUserRealm = val
    this.notifyOnChange("dclUserRealm",val,oldVal)
  }
  
  setPlayFabUserInfoData(val:GetPlayerCombinedInfoResultPayload|undefined|null){
    const oldVal = this.playFabUserInfo
    //TODO parse it out and detect what changed
    this.playFabUserInfo = val
    this.notifyOnChange("playFabUserInfo",val,oldVal)
  }

  notifyOnChange(key:string,newVal:any,oldVal:any){
    for(let p in this.playerStateListeners){
      this.playerStateListeners[p](key,  newVal,  oldVal)
    }
  }
  addChangeListener( fn:ObservableComponentSubscription ){
    this.playerStateListeners.push(fn)
  }
}


//export type GameStateType='undefined'|'error'|'started'|'ended'
export type GameConnectedStateType='undefined'|'disconnected'|'error'|'connected'
export type PlayerLoginState='undefined'|'error'|'customid-success'|'customid-error'|'playfab-error'|'playfab-success'
//export type GamePlayStateType='undefined'|'started'|'ended'


export type GameLevelData = {
  id: string
  loadingHint: string
}
export class RaceState{
  trackPath:Vector3[]
}
export class GameState{
  gameEnabled:boolean=false
  gameStarted:boolean=false //if game started
  gameConnected:GameConnectedStateType='undefined' //if game connected
  gameErrorMsg:string=''
  gameStateListeners: ObservableComponentSubscription[] = []

  raceData:RaceData
  trackData:TrackData
  //https://docs.colyseus.io/colyseus/server/room/#table-of-websocket-close-codes
  gameConnectedCode:number=-1 //if game connected
  //gameConnectedMsg:string //if game connected
  
  playerState: PlayerState = new PlayerState();

  gameRoom:Room|null
  gameRoomInstId:number = new Date().getTime()
  gameRoomData:GameLevelData

  


  
  setLoginSuccess(val:boolean){
    this.playerState.setLoginSuccess(val)
  }
  //store full game object results here, using flags above to track changing them
  //wrap this in an additional observer pattern
  //playerCombinedInfoResult:GetPlayerCombinedInfoResult
  getRaceRoom():Room<clientSpec.RaceRoomState>{
    if(this.gameRoom && this.gameRoom.name == CONFIG.GAME_RACE_ROOM_NAME){
      return this.gameRoom as Room<clientSpec.RaceRoomState>
    }
    return undefined
  }
  getGameRoom<T>(){
    return this.gameRoom
  }
  setGameRoom(val:Room|null){
    const oldVal = this.gameRoom
    this.gameRoom = val
    this.notifyOnChange("gameRoom",val,oldVal)
  }
  setGameRoomData(val:GameLevelData){
    const oldVal = this.gameRoomData
    this.gameRoomData = val
    this.notifyOnChange("gameRoomData",val,oldVal)
  }
  

  setGameConnectedCode(val:number){
    const oldVal = this.gameConnectedCode
    this.gameConnectedCode = val
    this.notifyOnChange("gameConnectedCode",val,oldVal)
  }

  setGameStarted(val:boolean){
    const oldVal = this.gameStarted
    this.gameStarted = val
    this.notifyOnChange("gameStarted",val,oldVal)
  }
  setGameConnected(val:GameConnectedStateType){
    const oldVal = this.gameConnected
    this.gameConnected = val
    this.notifyOnChange("gameConnected",val,oldVal)
  }
  setGameErrorMsg(val:string){
    const oldVal = this.gameErrorMsg
    this.gameErrorMsg = val
    this.notifyOnChange("gameErrorMsg",val,oldVal)
  }
  
  notifyInGameMsg(newVal:any){
    this.notifyOnChange("inGameMsg",newVal,null)
  }

  notifyOnChange(key:string,newVal:any,oldVal:any){
    for(let p in this.gameStateListeners){
      this.gameStateListeners[p](key,  newVal,  oldVal)
    }
  }
  addChangeListener( fn:ObservableComponentSubscription ){
    this.gameStateListeners.push(fn)
  }
}

export const GAME_STATE = new GameState()

