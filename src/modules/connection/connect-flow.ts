import { CONFIG } from 'src/config';
import { GAME_STATE } from '../state';
import { connect, disconnect, reconnect } from './connection';
import { onConnect } from './onConnect';


// play ambient music
//playLoop(ambienceSound, 0.4);

/*
//this is a active logout, will make calls
export function logout(){
    
    //TODO make logout calls
    resetLoginState()
}
export function resetLoginState(){
    GAME_STATE.playerState.setLoginFlowState('undefined')
    GAME_STATE.playerState.setLoginSuccess(false)
    GAME_STATE.playerState.playerDclId = undefined
    GAME_STATE.playerState.playFabLoginResult = undefined    
}
*/
export function joinLobby(){
    connect(CONFIG.GAME_LOBBY_ROOM_NAME).then((room) => {
        log("Connected!");
        
         onConnect(room)
    
    }).catch((err) => {
        error(err);
    
    });
}
export function leave(consent?:boolean){
    
    disconnect(consent) 
    
}  
export function joinNewRoom(){
    
}
export function joinOrCreateRoom(roomName:string,options: any = {}){
    log("connect-flow","joinOrCreateRoom",roomName,options)
    connect(roomName,options).then((room) => {
        log("connect-flow","joinOrCreateRoom",roomName,options,"Connected!")
        
         onConnect(room)
    
    }).catch((err) => {
        log("connect-flow","joinOrCreateRoom",roomName,options,"ERROR!",err)
        error(err);
    });
}

//START colyseusConnect//START colyseusConnect//START colyseusConnect
export const colyseusReConnect = () => {
    const oldRoom = GAME_STATE.gameRoom
    if(oldRoom !== null && oldRoom !== undefined){
        const oldRoomId = oldRoom.id
        const oldRoomName = oldRoom.name
        log("attempt to reconnect to ",oldRoomId,oldRoom)
        reconnect(oldRoom.id, oldRoom.sessionId,{}).then((room) => {
            log("ReConnected!");
            //GAME_STATE.setGameConnected('connected')
            
            //onJoinActions(room,"reconnect")
            onConnect(room)
             
        }).catch((err) => {
            log("connect-flow","colyseusReConnect",oldRoomId,oldRoomName,oldRoom,"ERROR!",err)
            error(err);
        });
    }else{
        log("was not connected")
    }
}//end colyseusConnect


//doLoginFlow()

//
// Connect to Colyseus server! 
// Set up the scene after connection has been established.
//
//let playerLoginResult:LoginResult;

/*
GAME_STATE.playerState.addChangeListener(
    (key: string, newVal: any, oldVal: any)=>{
      log("listener.playerState.login-flow.ts " + key + " " + newVal + " " + oldVal)
  
      switch(key){
        //common ones on top
        case "requestDoLoginFlow":
          //doLoginFlow()
          break;
      }
  })
*/