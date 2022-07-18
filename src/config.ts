import { isPreviewMode } from '@decentraland/EnvironmentAPI'

//using search service 
//https://github.com/decentraland/decentrally-service

const DEFAULT_ENV = "local"

const PLAYFAB_ENABLED = false
const PLAYFAB_TITLE_ID: Record<string, string> = {
  local: "TODO",
  dev: "TODO",
  stg: "TODO",
  prd: "TODO",
};

const COLYSEUS_ENDPOINT_URL: Record<string, string> = {
  local: "ws://127.0.0.1:2567",
  dev: "TODO",
  stg: "TODO",
  prd: "TODO",
};

const AUTH_URL: Record<string, string> = {
  local: "http://localhost:5001",//only used if PLAYFAB_ENABLED
  localColyseus: "TODO",//TODO get io
  dev: "TODO",//TODO get io
  stg: "TODO",
  prd: "TODO",
};
 
//const SERVICES_DOMAIN = AUTH_URL[DEFAULT_ENV]
  //"http://localhost:5001"
 // "https://decentrally-service.decentraland.net"

export class Config{
  ENV = DEFAULT_ENV
  
  IN_PREVIEW = false // can be used for more debugging of things, not meant to be enabled in prod
 
  DEBUG_SHOW_CONNECTION_INFO = false
  DEBUG_SHOW_PLAYER_LOGIN_INFO = false
  TEST_CONTROLS_ENABLE = false
  TEST_CONTROLS_DEFAULT_EXPANDED = false //if test controls expanded by default

  COLYSEUS_ENDPOINT_LOCAL = "see #initForEnv"
  COLYSEUS_ENDPOINT_NON_LOCAL = "see #initForEnv"; // prod environment
  //COLYSEUS_ENDPOINT = "wss://TODO"; // production environment

  GAME_LOBBY_ROOM_NAME="custom_lobby"
  GAME_RACE_ROOM_NAME="racing_room"

  SEND_RACE_DATA_FREQ_MILLIS = 1000 /10 // doing 13 times a second or 76ms (100 or less is considered acceptable for gaming). best i could get locally was ~60ms
  ENTER_CAR_CHECK_FREQ_MILLIS = 1000 /6 //x times a second, not sure that is needed, but incase they jump out
  RACE_RANK_SORT_FREQ_MILLIS = 1000 /6 //6 times a second


  GROUND_THICKNESS = .3
  showInivisibleGroundColliders = false
      
  ENABLE_BLOOM_VISIBLE_WORKAROUNDS = true
  
  LOAD_MODELS_DURING_SCENE_LOAD_ENABLED = true

  DEBUGGING_ENABLED = true
  DEBUGGING_LOGS_ENABLED = true
  DEBUGGING_UI_ENABLED = false
  DEBUGGING_TRIGGERS_ENABLED = false
  DEBUGGING_LAG_TESTING_ENABLED = false //will create a ghost image of the player to test lag correction
  DEBUG_SMALLER_AVATAR_HIDE_AREA = false //how big will hide area to be, if true will be only around car so can see player otherwise

  LOGIN_ENDPOINT = "see #initForEnv"

  TRACK_FEATURE_SLOW_DOWN_RESPAWN = 30000 //long time
  TRACK_FEATURE_DEFAULT_RESPAWN = 3000 //short

  ITEM_RECHARGE_CHECK_FREQ_MILLIS = 1000 /6 //6 times a second

  PROJECTILE_SHOOT_COOLDOWN_MS = 100
  PROJECTILE_RELOAD_TIME = 2 //unit in seconds
  PROJECTILE_MAX_RELOAD_AMOUNT = 3

  BOOSTERS_COOLDOWN_MS = 100
  BOOSTERS_RELOAD_TIME = 3  //unit in seconds
  BOOSTERS_MAX_RELOAD_AMOUNT = 3

  //with how we compute latency do we need to fudge it anymore?
  //with avg latancey of ~160ms a value of 50 was about 1.5 car lengths behind real so trying 99
  //curious if it relates to how frequent we update server though that should be accounted for in the 
  //end to end calculation
  //will be a fuge value added onto latancey calculated to account for other drift
  //maybe better name LATENCY_MISC_FACTOR
  LATENCY_MISC_FACTOR = 99//millis
  //how many latency datapoints to keep and average them
  LATENCY_AVERAGE_WINDOW_SIZE = 20//try to keep 1 second.  assume latency is ~100ms 20 would be 2 seconds
  //works with how we lerp.  since we lerp fast when far, slow when near target pos. maybe we assume latency a little higher so it 
  //pushes a little closer to player better
  LATENCY_LEADING_FACTOR = 1.2 //knowing there is lag + we lerp. consider lerping ahead of likely position
 
  SKID_SOUND_FREQ_MILLIS = 200

  //how far back u can drive form the furthest forward direct
  MAX_DRIVE_BACKWARDS_DIST_SQRED = Math.pow(8,2)
  

  ENABLE_DEBUGGER_BREAK_POINTS = true //change to false to force all debugger break points to off
 
  PLAYFAB_ENABLED:boolean //see #initForEnv
  PLAYFAB_TITLEID = "see #initForEnv"
  
  GAME_LEADEBOARD_MAX_RESULTS = 10 
  //need to give playfab time to get updated before calling
  GAME_LEADEBOARD_END_GAME_RELOAD_DELAY_MILLIS = 1000

  initForEnv(){

    const env = DEFAULT_ENV

    this.COLYSEUS_ENDPOINT_LOCAL = COLYSEUS_ENDPOINT_URL[env]
    this.COLYSEUS_ENDPOINT_NON_LOCAL = COLYSEUS_ENDPOINT_URL[env]; // prod environment
    this.PLAYFAB_ENABLED = PLAYFAB_ENABLED
    this.PLAYFAB_TITLEID = PLAYFAB_TITLE_ID[env]
    this.LOGIN_ENDPOINT = AUTH_URL[env] + '/player/auth'
    
  }

  ////.io (development), .net (staging), and .org (production).
  getAuthEnv(){
    if(this.LOGIN_ENDPOINT.indexOf("localhost")>-1 || this.LOGIN_ENDPOINT.indexOf("127.0.0.1")){
      return "LOCAL"
    }
    if(this.LOGIN_ENDPOINT.indexOf(".io")>-1){
      return "DEV"
    }
    if(this.LOGIN_ENDPOINT.indexOf(".net")>-1){
      return "STG"
    }
    if(this.isAuthEnvProd()){
      return "PROD"
    }
    log("getAuthEnv unrecognized env",this.LOGIN_ENDPOINT)
  }
 
  isAuthEnvProd(){
    if(this.LOGIN_ENDPOINT.indexOf(".org")>-1){ //org is the external facing cloudflare end point
      return true
    }
    return false
  }

  getAuthEnvSingleLetter(){
    return this.getAuthEnv().substr(0,1)
  }
}

export const CONFIG = new Config()
CONFIG.initForEnv()

//set in preview mode from env, local == preview
isPreviewMode().then(function(val:boolean){
  setInPreview(val);
})

export function setInPreview(val: boolean) {
  log("setInPreview " + val)
  CONFIG.IN_PREVIEW = val

  //var console: any
}


