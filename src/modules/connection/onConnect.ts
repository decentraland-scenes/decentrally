import { DataChange, Room, RoomAvailable } from 'colyseus.js'
import { GAME_STATE } from '../state'
import * as clientState from './state/client-state-spec'
import * as serverState from './state/server-state-spec'
import * as SceneData from '../scene'
//import * as gameUI from "../ui/index";
import * as utils from '@dcl/ecs-scene-utils'
import { Enemy, ENEMY_MGR } from '../playerManager'
import { percentOfLine, realDistance } from '../utilities'
import { findCarModelById } from '../carData'
import { RaceData } from '../race'
import { Game_2DUI } from '../ui/index'
//import { SCENE_MGR } from '../scene/raceSceneManager'
import { PlayerRankingsType, sortPlayersByPosition } from './state-data-utils'
import { Projectile } from '../projectiles'
import { LevelDataState, TrackFeaturePosition } from './state/server-state-spec'
import { levelManager } from 'src/tracks/levelManager'
import { Constants } from '../resources/globals'
import { ColyseusCallbacksCollection, ColyseusCollection } from './state/client-colyseus-ext'
import { IntervalUtil } from '../interval-util'
import { CONFIG } from 'src/config'
import { TrackFeature, TrackFeatureConstructorArgs } from '../trackFeatures'
import { LeaderBoardManager } from '../scene/menu'
import { SOUND_POOL_MGR } from '../resources/sounds'
import { fetchRefreshPlayerCombinedInfo, refreshUserData } from 'src/login/login-flow'

//import { Schema, type, MapSchema } from "@colyseus/schema";

let allRooms:RoomAvailable[]=[]
//let allPlayers:PlayerState[]=[]

//tracer function
//i need a way to sync server and client time, for now using this to later revisit
function getSharedTimeNow(){
    return Date.now()
}

function updatePlayerRacingData(raceData: clientState.PlayerRaceDataState) {
    SceneData.player.raceEndTime = raceData.endTime
    //calculate it from lap + segment+percent?  easier if server calculates it
    SceneData.player.racePosition = raceData.racePosition ? raceData.racePosition : -1

    SceneData.player.updateLatency( raceData.lastKnownClientTime,raceData.serverTime )

    if(SceneData.player.raceEndTime){
        SceneData.player.markCompletedRace("server replied raceData.endTime " + raceData.endTime)
        //Game_2DUI.showRaceEnded
        Constants.SCENE_MGR.racingScene.playerFinishedRace()
    }else if(!GAME_STATE.raceData.started){
        //find better spot for this, as is only called before race start
        updateRacerStartPos()
    }

    //for now do not sync lap with server
    //scene.player.lap = (raceData.lap) ? raceData.lap : -1
}

let lastKnowServerTime = -1

function updateRaceData(raceData:clientState.RaceState){
    log("updateRaceData",raceData,SceneData.player.lap + " / " + raceData.maxLaps)
    switch( raceData.status ){
        case 'not-started':
            Game_2DUI.updateLapCounter(SceneData.player.lap , raceData.maxLaps)
            log("updateRaceData.GAME_STATE.raceData",GAME_STATE.raceData)
            break; 
        case 'starting':
            //GAME_STATE.raceData.maxLaps = raceData.maxLaps
            //GAME_STATE.raceData.name = raceData.name
            Game_2DUI.updateLapCounter(SceneData.player.lap, raceData.maxLaps)
            Game_2DUI.showRaceStartMsg(true)

            //SceneData.player.updateLatency( raceData.,raceData.serverTime )
            
            const offset = .9//add .9 seconds for server lag etc so countdown is clean and smooth
            const timeTillStartSeconds = ((raceData.startTime - raceData.serverTime))/1000
            Game_2DUI.updateRaceStarting( Math.floor( timeTillStartSeconds ) + 1 )
            GAME_STATE.raceData.startTime = Date.now() + (raceData.startTime - raceData.serverTime) 

            //incase its open, close it
            Constants.Game_2DUI.raceToStartHidePrompts()
            //start at 3 seconds
            /*if(timeTillStartSeconds == 3){
                SOUND_POOL_MGR.raceCountdown.playOnce()
            }else{
                //need to figure out how to start it
            }*/
            break;
        case 'started':
            //updateRaceStarting handles this ping, should be synced with server
            //but just in case call it here. its cool down should allow for 1 second tolerance of lag
            SOUND_POOL_MGR.raceStart.playOnce()//need better sound, or can stick with raceCountdown
            //FIXME let timer also call start race, to allow for server msg lag to officially start?
            //just like we are doing with 'SOUND_POOL_MGR.raceStart.playOnce()'??
            Constants.SCENE_MGR.racingScene.startRace()
            //sync with server?? but then cannot use start time to compute diffs locally?
            //GAME_STATE.raceData.startTime = raceData.startTime 
             
                break;
        case 'ended':
            if(GAME_STATE.getRaceRoom()){
                const pVal = GAME_STATE.getRaceRoom().state.players.get(SceneData.player.sessionId)
                if(pVal) updatePlayerRacingData( pVal.racingData as clientState.PlayerRaceDataState);
            }
            
            Constants.SCENE_MGR.racingScene.endRace()
            //sync with server?? but then cannot use start time to compute diffs locally?
            //GAME_STATE.raceData.endTime = raceData.endTime
        break;
    } 
}
function updateRacerStartPos(){
    if(!GAME_STATE.raceData.started && !GAME_STATE.raceData.ended){
        const playerRank = SceneData.player.racePosition !== undefined ? SceneData.player.racePosition : -1
        if(playerRank > 0){
            Constants.SCENE_MGR.racingScene.moveRacerToStartPosition( playerRank - 1 )
        }
    }
}
function updateEnrollment(enrollment:clientState.EnrollmentState){
    log("updateEnrollment",enrollment,Math.round( (enrollment.endTime - enrollment.serverTime)/1000 ))

    updateRacerStartPos()

    GAME_STATE.raceData.maxPlayers = enrollment.maxPlayers
    if( enrollment.open ){
        Game_2DUI.showRaceStartMsg(true)
        Game_2DUI.updateRaceStartWaiting( Math.round( (enrollment.endTime - enrollment.serverTime)/1000 ) )
    }else{
        Game_2DUI.showRaceStartMsg(false)
    }
}
export async function onConnect(room: Room) {
    GAME_STATE.setGameRoom( room )

    GAME_STATE.setGameConnected('connected')

   if(room.name.indexOf("lobby")>-1){
    onLobbyConnect(room)
   }else{
    onLevelConnect(room)
   }
}

export function onDisconnect(room: Room,code?:number) {
    ENEMY_MGR.removeAllPlayers()

    GAME_STATE.setGameConnected('disconnected')

    Game_2DUI.updateLeaderboard("Disconnected",[])
}

function updateLevelData(levelData:LevelDataState){
    //TODO level rules go here? like boost amounts ??? or make a updateCarData one?
    //TODO manipulate the level data
    const lvl = levelManager.getCurrentLevel()

    GAME_STATE.raceData.id = levelData.id
    
    lvl.maxLaps = levelData.maxLaps
    if(levelData.name){
        lvl.name = levelData.name
        GAME_STATE.raceData.name = levelData.name
    }

    //TODO FIXME move to lvl and then reset race track can read from there??
    //set values specific to this level
    //the challenge is i want raceData to override level data
    GAME_STATE.raceData.maxLaps = levelData.maxLaps
}
function initLevelData(data:LevelDataState){
    const lvl = levelManager.getCurrentLevel()   
 
    updateLevelData(data)
     //data.maxLaps
     
     //log("((data as any).trackFeatures",(data as any).trackFeatures.length,((data as any).trackFeatures.size))
     //FIXME this is ugly
    //data.localtrackFeatures = (data as any).trackFeatures
    //const colyseusCollection = ((data as any).trackFeatures as ColyseusCollection<TrackFeatureConstructorArgs>)
    //const colyseusCollection = ((data as any).trackFeatures as ColyseusCollection<TrackFeatureConstructorArgs>)
    const trackfeatures = data.trackFeatures// as Map<any,TrackFeatureConstructorArgs>//ColyseusCollection<TrackFeatureConstructorArgs>)

     
    //reset track features
    lvl.trackFeatures = []
    //for(let x=0;x<colyseusCollection.length;x++){
        
    //data.localtrackFeatures.forEach( (value, at) => {
   trackfeatures.forEach(
            (trackFeat:TrackFeatureConstructorArgs)=>{
        //const tf = data.localtrackFeatures[p]
        //debugger
        //const trackFeat = colyseusCollection.at(x)
        const tc:TrackFeatureConstructorArgs = {...trackFeat}
        tc.position = new TrackFeaturePosition( 
            serverState.createTrackFeaturePositionConstructorArgs(trackFeat.position)
        )
        
        
        lvl.addTrackFeature( new TrackFeature( tc ) )
        
    })

    log("initLevelData ","trackFeatures.length",lvl.trackFeatures.length)

    //SCENE_MGR.racingScene.removeAllTrackFeatures()
    Constants.SCENE_MGR.racingScene.resetRaceTrack()
    
    //TODO FIXME move to lvl and then reset race track can read from there??
    //set values specific to this level
    //the challenge is i want raceData to override level data
    GAME_STATE.raceData.maxLaps = data.maxLaps
    
    
    //
}

let lastStateChangeTime = Date.now()

const updateLoaderboardCounter = new IntervalUtil(CONFIG.RACE_RANK_SORT_FREQ_MILLIS,'abs-time')


export function updateLeaderboard(room: Room<clientState.RaceRoomState>){
    //log("updateLeaderboard") 
    //throttle this if written to fast, maybe shift it to a system?
    if(!updateLoaderboardCounter.update()){
        //log("updateLeaderboard. skipped") 
        return;
    }
    //debugger
    //room.state.players
    if(!room || !room.state){
        Game_2DUI.updateLeaderboard("Racers",[])
        return
    }
    
    const playerDataRanked = sortPlayersByPosition(room.state.players)

    const roomNames:string[] = []
    let counter = 1
    for(const p in playerDataRanked){
        const pd = playerDataRanked[p]
        roomNames.push( counter + ": " + pd.name )

        counter++
    }

    Game_2DUI.updateRacePosition( SceneData.player.racePosition, counter - 1)
    Game_2DUI.updateRaceCount( counter - 1, GAME_STATE.raceData.maxPlayers)
    
    if( Game_2DUI.isRaceResultsPromptVisible() ) Game_2DUI.updateGameResultRows( GAME_STATE.getRaceRoom()?.state ) //call after show

    //debugger
    Game_2DUI.updateLeaderboard("Racers",roomNames)
}

function getEnemySpawnCount(player: clientState.PlayerState){
    const addLagTestCarForAllPlayers = true
    const retVal = CONFIG.DEBUGGING_LAG_TESTING_ENABLED && (addLagTestCarForAllPlayers || player.sessionId === GAME_STATE.gameRoom.sessionId)  ? 2 : 1

    return retVal
}

function onLevelConnect(room: Room<clientState.RaceRoomState>) {

    //initLevelData(room.state.levelData)

    room.onMessage("ended.roomAboutToDisconnect", (data) => {
        log("onMessage.ended.roomAboutToDisconnect",data)
        //allRooms = rooms;
        //update_full_list();
        //clear then out
        utils.setTimeout(CONFIG.GAME_LEADEBOARD_END_GAME_RELOAD_DELAY_MILLIS, () => { 
            log("onMessage.ended.roomAboutToDisconnect calling fetchRefreshPlayerCombinedInfo",)
            fetchRefreshPlayerCombinedInfo().then(()=>{
                log("onMessage.ended.roomAboutToDisconnect calling refreshLevelLeaderboardStats",)
                //TODO REFRESH USER DATA FIRST or at same time?
                Constants.SCENE_MGR.lobbyScene.refreshLevelLeaderboardStats({reloadSelected:true,defaultStat:LeaderBoardManager.DEFAULT_STAT_POSTFIX,levelId:GAME_STATE.raceData.id})
            })
        });

        log("Received ended.roomAboutToDisconnect");
    });

    room.onMessage("showError", (data) => {
        log("onMessage.showError",data)
        //allRooms = rooms;
        //update_full_list();
        //clear then out
        Constants.Game_2DUI.showErrorPrompt( data.title,data.message )
        log("Received onMessage.showError");
    });

    //NO LONGER A THING, USING STATE
    /*
    room.onMessage("setup.initLevelData", (data:LevelDataState) => {
        log("onMessage.setup.initLevelData",data)
        //allRooms = rooms;
        //update_full_list();

        log("Received ended.initLevelData",data);

        initLevelData(data) 

    });*/
    
    room.onStateChange((state:clientState.RaceRoomState) => {
        const now = Date.now()
        //reports when anything in state changes
        //log("level state.onStateChange:", (now-lastStateChangeTime),"ms");
        lastStateChangeTime = Date.now()
    })

    room.state.listen("raceData",(raceData:clientState.RaceState)=>{
        log("room.state.listen.raceData",raceData) 
        //RaceStatus="unknown"|"not-started"|"started"|"ended"
        updateRaceData(raceData)
    })
    room.state.raceData.onChange = (changes:DataChange<any>[])=>{
        log("room.state.raceData.onChange",changes) 
        //RaceStatus="unknown"|"not-started"|"started"|"ended"
        updateRaceData(room.state.raceData)
    }
    room.state.listen("levelData",(levelData:clientState.LevelDataState)=>{
        log("room.state.levelData.listen",levelData) 
        updateLevelData(room.state.levelData)  

        if(!levelData.trackFeatures.onAdd){
            //for some reason null at the beginning
            levelData.trackFeatures.onAdd = (trackFeat: clientState.ITrackFeatureState, sessionId: string) => {
                log("room.state.levelData.trackFeatures.onAdd",trackFeat.name,trackFeat)

                const trackFeature:TrackFeature = new TrackFeature({
                    name:trackFeat.name,
                    position: serverState.createTrackFeaturePositionConstructorArgs(trackFeat.position),
                    type: serverState.getTrackFeatureType(trackFeat.type),
                    activateTime:trackFeat.activateTime
                })
 
                if( !GAME_STATE.trackData.canAddTrackFeature( trackFeature) ){
                    log("Level.trackFeatures out of bounds",trackFeat)
                    return
                }

                //TODO add it here
                const trackComponent = GAME_STATE.trackData.createAndAddTrackFeatureFromTemplate(trackFeature,levelManager.getCurrentLevel())
                const trackSceneEnt = Constants.SCENE_MGR.racingScene.addTrackFeature(trackComponent)
                //FIXME, need to determine if show is allowed
                //right now internal to show it does the check

                //FIXME, HACKY
                if(Constants.SCENE_MGR.racingScene.trackSpawnSystem.isVisibleSegment( trackFeature.position.startSegment )){
                    log("room.state.levelData.trackFeatures.onAdd. calling show for ",trackFeature.name)
                    trackSceneEnt.show()
                }else{
                    log("not in a visible segement not showing",trackFeature.name)
                }
  

                /*room.state.levelData.trackFeatures.onChange = (trackFeat: clientState.ITrackFeatureState, sessionId: string) => {
                    log("room.state.levelData.trackFeatures.onChange",trackFeat)
                }*/
                trackFeat.onChange = (changes:DataChange<any>[])=>{
                    log("room.state.levelData.trackFeatures.trackFeat.onChange",trackFeat.name,trackFeat)
                    //gives me specific changes
                    const localTrackFeat = GAME_STATE.trackData.trackFeatures[ trackFeat.name ]
                    if(localTrackFeat){
                        //if(GAME_STATE.raceData.started) debugger
                        //FIXME this only works for non drawn ones, need a way to to handle with a system, hide/show regsiter needs to be shown in X time
                        //the change here wont trigger it to be visible later
                        localTrackFeat.activateTime = trackFeat.activateTime
                    }else{
                        log("room.state.levelData.trackFeatures.trackFeat.onChange","unable to find",trackFeat.name)
                    }

                }
            }
            
        }
    })
    room.state.levelData.onChange = (changes:DataChange<any>[])=>{
        log("room.state.levelData.onChange",changes) 
        //RaceStatus="unknown"|"not-started"|"started"|"ended"
        //debugger
        //prevent calling this twice trackFeatures.onAdd should handle all we need
        //initLevelData(room.state.levelData)

    }
    /*room.state.levelData.trackFeatures.onChange = (inst:any, sessionId: any)=>{
        log("room.state.levelData.trackFeatures.onChange",inst) 
    }*/
    //room.state.levelData.localtrackFeatures.onCh
    room.state.enrollment.onChange = (changes:DataChange<any>[])=>{
        log("room.state.enrollment.onChange",changes) 
        //RaceStatus="unknown"|"not-started"|"started"|"ended"
        updateEnrollment(room.state.enrollment)
    }
    room.state.listen("enrollment",(enrollment:clientState.EnrollmentState)=>{
        log("room.state.listen.enrollment",enrollment) 
        //RaceStatus="unknown"|"not-started"|"started"|"ended"
        updateEnrollment(enrollment)
    })
    room.state.players.onAdd = (player: clientState.PlayerState, sessionId: string) => {
        log("room.state.players.onAdd",player)
        //const playerCallbacks:PlayerInst = (player as PlayerInst)
        
        //player.racingData.carScenePosition

        //if full properties change
        player.onChange = (changes:DataChange<any>[])=>{
            //log("player.onChange",changes)
        }

        if(player.sessionId == GAME_STATE.gameRoom.sessionId){
            SceneData.player.serverState = player
            SceneData.player.sessionId = player.sessionId
        } 
        //not part of same if statement for lag testing, player gets an enemy version of themself
        if(player.sessionId != GAME_STATE.gameRoom.sessionId || CONFIG.DEBUGGING_LAG_TESTING_ENABLED){
            const enemySpawnCount = getEnemySpawnCount( player )
            for(let i = 0 ; i < enemySpawnCount; i ++){
                const sessionId = i == 0 ? player.sessionId : player.sessionId +"-" + i
                let closestPointId = player.racingData.closestPointID
                if(closestPointId === undefined || closestPointId < 0){
                    closestPointId = 0
                }
                //player.userId,player.publicKey,

                const playerState:SceneData.PlayerBase = new SceneData.PlayerBase() //TODO cache this? fly weight pattern?
                if(player.sessionId === GAME_STATE.gameRoom.sessionId){
                    playerState.name = i == 0 ? (player.userData.name) : player.userData.name +"-PREDICTION"
                }else{
                    playerState.name = i == 0 ? (player.userData.name) : player.userData.name +"-PREDICTION"
                }
                
                playerState.userId = player.userData.userId
                playerState.carModelId = player.racingData.carModelId
                playerState.racePosition = player.racingData.racePosition
                
                const playerRank = playerState.racePosition !== undefined ? playerState.racePosition : -1
                    
                let addPosition = GAME_STATE.trackData.trackPath[closestPointId]
                //debugger
                if(!GAME_STATE.raceData.started){
                    if(playerRank >= 0){
                        addPosition = Constants.SCENE_MGR.racingScene.startPositionSceneEnts[ playerRank ].entity.getComponent(Transform).position//.subtract( SceneData.center )
                        //SCENE_MGR.racingScene.moveRacerToStartPosition( playerRank )
                        ENEMY_MGR.addEnemy(sessionId,GAME_STATE.trackData.trackPath[closestPointId], Color3.Green(), playerState)    
                    }
                }
                ENEMY_MGR.addEnemy(sessionId,addPosition, Color3.Green(), playerState)    
            }
        }

        //const playerState:PlayerState = (player as PlayerInst)
        updateLeaderboard(room)

        /*
        player.buttons.listen("forward", (forward: boolean) => {
            log("player.listen.buttons.forward",player.userData.name,forward,scene.player.MOVE_FORWARD)
            
            if(player.sessionId == scene.player.sessionId){
                //scene.player.MOVE_FORWARD = forward
            }else{
                const enemy = ENEMY_MGR.getPlayerByID(player.sessionId)
                if(enemy ){
                    enemy.state.MOVE_FORWARD = forward
                }
            }
            //refreshLeaderboard();
        }); */

        player.listen("buttons", (buttons: clientState.PlayerButtonState) => {
            log("player.listen.buttons",buttons)
            
            if(player.sessionId == SceneData.player.sessionId){
                //scene.player.MOVE_FORWARD = forward
            }
            //not part of same if statement for lag testing, player gets an enemy version of themself
            if(player.sessionId != GAME_STATE.gameRoom.sessionId || CONFIG.DEBUGGING_LAG_TESTING_ENABLED){
                const enemySpawnCount = getEnemySpawnCount( player )
                for(let i = 0 ; i < enemySpawnCount; i ++){
                    const sessionId = i == 0 ? player.sessionId : player.sessionId +"-" + i
                    const enemy = ENEMY_MGR.getPlayerByID(sessionId)
                    if(enemy ){
                        log("enemy buttons",enemy.state.name,buttons)
                        enemy.state.MOVE_FORWARD = buttons.forward
                        enemy.state.MOVE_BACKWARD = buttons.backward
                        if(!enemy.state.shoot_btn_down && buttons.shoot){
                            const targetWorldPos = enemy.getEnemyData().targetWorldPos
                            //log("enemy shooting",enemy.state.name)
                            //TODO MOVE THIS TO A OBJECT FACTORY TO REUSE
                            let rocket = new Projectile({position: new Vector3(targetWorldPos.x, SceneData.scene.raceGroundElevation + 0.25,targetWorldPos.z), scale: new Vector3(1, 1, 1)}, Vector3.Forward().rotate(enemy.state.shootDirection).normalize(),20)
                        }
                        enemy.state.shoot_btn_down = buttons.shoot
                        //enemy.state. = buttons.shoot
                    }
                }
            }
            //refreshLeaderboard();
        }); 
        player.racingData.listen("carModelId", (carModelId: string) => {
            log("player.racingData.listen.carModelId",carModelId)
            
            if(player.sessionId != SceneData.player.sessionId){
                const enemy = ENEMY_MGR.getPlayerByID(player.sessionId)
                if(enemy ){
                    enemy.updateCarModelById( carModelId )
                }
            }
            //refreshLeaderboard();
        }); 

        player.listen("racingData", (raceData:clientState.PlayerRaceDataState) => {
            //scene.player.closestPointID
            if(player.sessionId == SceneData.player.sessionId){
                //scene.player.serverState = player
                updatePlayerRacingData(raceData);
            }
            if(player.sessionId != GAME_STATE.gameRoom.sessionId || CONFIG.DEBUGGING_LAG_TESTING_ENABLED){ 
                const enemySpawnCount = getEnemySpawnCount( player )
                for(let i = 0 ; i < enemySpawnCount; i ++){
                    const sessionId = i == 0 ? player.sessionId : player.sessionId +"-" + i
                    //not part of same if statement for lag testing, player gets an enemy version of themself
                    if( ENEMY_MGR.getPlayerByID(sessionId) ){ 
                        const enemy = ENEMY_MGR.getPlayerByID(sessionId)
                        //raceData.
                        if(enemy.state){
                            enemy.state.currentSpeed = raceData.currentSpeed
                            
                            enemy.state.closestPointID = raceData.closestPointID
                            enemy.state.carModelId = raceData.carModelId
                            enemy.state.raceEndTime = raceData.endTime
                            if(raceData.endTime !== undefined) enemy.state.markCompletedRace("enemy.has.raceData.endTime")
                            enemy.state.racePosition = raceData.racePosition
                            enemy.state.lap = raceData.lap
                            
                            enemy.state.updateLatency( raceData.lastKnownClientTime,raceData.serverTime )
                            
                            if(raceData.worldMoveDirection) enemy.state.worldMoveDirection.copyFrom(raceData.worldMoveDirection) //using it for wheel rotation
                            if(raceData.cameraDirection) enemy.state.cameraDirection.copyFrom(raceData.cameraDirection) //, will be direction next gas is hit?
                            //shootDirection being stored in enemyData = targetWorldRot. copy it here too for shooting??
                            if(raceData.shootDirection) enemy.state.shootDirection.copyFrom(raceData.shootDirection)
                            //playerState.shootDirection = player.racingData.shootDirection
                    
                        }
                        //calculateWorldPosFromClosestSegmentData(player,enemy)
                        const posS = calculateWorldPosFromWorldPos(player,enemy,i)
                        
                        //const posS = calculateWorldPosFromClosestSegmentData(player,enemy)
        
                        //log("vec",pos,posS)

                        //enemy.getEnemyData().worldPos.copyFrom(posS)

                        enemy.state.lastKnownWorldPosition.copyFrom(enemy.getEnemyData().targetWorldPos)
                        enemy.getEnemyData().targetWorldPos.copyFrom(posS)
                        //enemy.getEnemyData().targetWorldRot.copyFrom( raceData.shootDirection )

                        //enemy.getEnemyData().worldPos.copyFrom(a)

                        
                    }else{
                        log("WARNING player.listen.racingData unable to find player ",sessionId,raceData)
                    }
                }
            }
            updateLeaderboard(room)
        })
        player.userData.listen("name", (name: string) => {
            if(player.sessionId == SceneData.player.sessionId){
                //scene.player.serverState = player
            }
            //not part of same if statement for lag testing, player gets an enemy version of themself
            if(player.sessionId != GAME_STATE.gameRoom.sessionId || CONFIG.DEBUGGING_LAG_TESTING_ENABLED){
                const enemy = ENEMY_MGR.getPlayerByID(player.sessionId)
                enemy.setName(name)
            }
        })

        
        
    }

    // when a player leaves, remove it from the leaderboard.
    room.state.players.onRemove = (player:clientState.PlayerState,key:any) => {
        log("room.state.player.onRemove")
        //allPlayers = allPlayers.filter((player) => instance.id !== player.id); 

        if(player.sessionId == SceneData.player.sessionId){
            SceneData.player.serverState = undefined
        }
        //not part of same if statement for lag testing, player gets an enemy version of themself
        if(player.sessionId != GAME_STATE.gameRoom.sessionId || CONFIG.DEBUGGING_LAG_TESTING_ENABLED){
            const enemySpawnCount = getEnemySpawnCount( player )
            for(let i = 0 ; i < enemySpawnCount; i ++){
                const sessionId = i == 0 ? player.sessionId : player.sessionId +"-" + i
                ENEMY_MGR.removePlayer(sessionId)
            }
        }

        updateLeaderboard(room)
    }

    room.onLeave(() => {
        //allPlayers = [];
        //update_full_list();
        log("Bye, bye!");
    });
    
    room.onLeave((code) => {
        log("onLeave, code =>", code);
    });
}

function onLobbyConnect(lobby: Room) {

    function update_full_list(){
        //debugger
        const roomNames:string[] = []
        for(const p in allRooms){
            roomNames.push( JSON.stringify({clients:allRooms[p].clients,roomId:allRooms[p].roomId}) )
        }
        //debugger
        Game_2DUI.updateLeaderboard("Rooms",roomNames)
    }
    
    lobby.onStateChange((state) => {
        log("Custom lobby state:", state);
    })

    lobby.onMessage("rooms", (rooms) => {
        log("onMessage.rooms",rooms)
        allRooms = rooms;
        update_full_list();

        log("Received full list of rooms:", allRooms);
    });

    lobby.onMessage("+", ([roomId, room]) => {
        log("onMessage.room.+",roomId,room)
        let roomIndex = -1
        let counter = 0
        for(const p in allRooms){
            if(allRooms[p].roomId == roomId){
                roomIndex = counter
                break;
            }
            counter++
        }
        if (roomIndex !== -1) {
            allRooms[roomIndex] = room;
        } else {
            allRooms.push(room);
        }
        update_full_list()
    });
 
    lobby.onMessage("-", (roomId) => {
        log("onMessage.room.-",roomId)
        allRooms = allRooms.filter((room) => room.roomId !== roomId); 

        update_full_list()
    }); 

    lobby.onLeave(() => {
        allRooms = [];
        //update_full_list();
        log("Bye, bye!");
    });
    
    lobby.onLeave((code) => {
        log("onLeave, code =>", code);
    });
}

const ZERO_Q = new Quaternion(0,0,0,0)

function calculateWorldPosFromWorldPos(player:clientState.PlayerState,enemy:Enemy,inst:number):Vector3 {
    const vec = new Vector3().copyFrom(player.racingData.worldPosition)
    //FIXME, need to solve this, it keeps placing them infront of the player
    //vec.addInPlace( SceneData.scene.center )//.subtract(GAME_STATE.trackData.trackPath[0])
    vec.addInPlace(GAME_STATE.trackData.trackPath[0])
    
    //need it in seconds so subtract 1000
    const latancey = ((enemy.state.latencyAvg * CONFIG.LATENCY_LEADING_FACTOR) / 1000)//((SceneData.player.lastKnowServerTime - player.racingData.lastKnownServerTime)/1000)*2

    const calcCache = ENEMY_MGR.calculationCache[player.sessionId]
    
    const cameraDirection =  enemy.state.cameraDirection
    const shootDirection = enemy.state.shootDirection

    let horizontalForward = Vector3.Forward().rotate(cameraDirection);
    horizontalForward.y = 0;
    horizontalForward.normalize();

    let vehicleHorizontalRotation = Quaternion.FromToRotation(Vector3.Forward(),horizontalForward) 
 
    const carRotation = shootDirection
    const carTransformRotation = Quaternion.Slerp(carRotation, vehicleHorizontalRotation,latancey * player.racingData.currentSpeed)
    //const slerpDt=(latancey*1.5*(player.racingData.currentSpeed))// * .00001
    //const worldMoveDirectionLagDiff = Quaternion.Slerp(player.racingData.worldMoveDirection, carRotation, slerpDt)          

    //log("calculateWorldPosFromWorldPos","latancey",latancey,enemy.state.latencyAvgMv.queue,enemy.state.latencyAvg,enemy.state.lastKnownClientTime)

    let vecLag 
    if(true){
        //this tries to rotate forward
        const sceneMoveVector = calcCache.sceneMoveVector//new Vector3()
        sceneMoveVector.x = 0
        sceneMoveVector.y = 0
        sceneMoveVector.z = player.racingData.currentSpeed * latancey
        sceneMoveVector.rotate(enemy.state.worldMoveDirection)
        sceneMoveVector.y = 0

        const transform = calcCache.sceneMoveTransform;//new Transform( {position:vec.clone()} )
        transform.position.copyFrom(vec)
        transform.rotation.copyFrom(ZERO_Q)
        transform.translate(sceneMoveVector)
        
        vecLag = transform.position//vec.rotate(worldMoveDirectionLagDiff)//.addInPlace(new Vector3(0,1,0))
    }else{
        //THIS WAS TO JUST TRY A DIFF BETWEEN LAST KNOWN AND NEW KNOW - getting a wierd bouncing effect
        //want to move from last known to new known
        const direction = vec.subtract(enemy.state.lastKnownWorldPosition) //direction = destination - source
        //direction.normalize()
        //direction.scaleInPlace(.5) 
        if(enemy.state.lastKnownWorldPosition.x != 0 && enemy.state.lastKnownWorldPosition.x != enemy.state.lastKnownWorldPosition.z && enemy.state.lastKnownWorldPosition.x != enemy.state.lastKnownWorldPosition.y){
            const dist = realDistance( vec,enemy.state.lastKnownWorldPosition )
            //direction.scaleInPlace(dist * 1) //move up an extra distance
            log("calculateWorldPosFromWorldPos",direction,"dist",dist)
            vecLag =vec.add(direction)
        }else{
            vecLag = vec
        }
    }

    //const vecLag = transform.position//vec.rotate(worldMoveDirectionLagDiff)//.addInPlace(new Vector3(0,1,0))
    
    const addLatency = inst == 1 || !CONFIG.DEBUGGING_LAG_TESTING_ENABLED
    //log("calculateWorldPosFromWorldPos",inst,"player",player.userData.name,"addLatency",addLatency,"direction",direction,"cameraDirection",cameraDirection,worldMoveDirectionLagDiff,"vec",vec,"vecLag",vecLag)//,"GAME_STATE.trackData.trackPath[0]",GAME_STATE.trackData.trackPath[0],"player.racingData.worldPosition",player.racingData.worldPosition,"SceneData.scene.center",SceneData.scene.center)


    if(addLatency){
        enemy.getEnemyData().targetWorldRot.copyFrom( carTransformRotation )
    }else{
        enemy.getEnemyData().targetWorldRot.copyFrom( player.racingData.shootDirection )
    }

    return addLatency ? vecLag : vec
}
function calculateWorldPosFromClosestSegmentData(player:clientState.PlayerState,enemy:Enemy):Vector3 {
    let closestSegmentID = player.racingData.closestSegmentID
    
    if(closestSegmentID === undefined || closestSegmentID < 0){
        closestSegmentID = 0
    }
    let closestSegmentIDNext = GAME_STATE.trackData.getNextSegmentId(closestSegmentID)
    
    
    const a = GAME_STATE.trackData.trackPath[closestSegmentID]
    const b = GAME_STATE.trackData.trackPath[closestSegmentIDNext]
    //TODO create vector pool

    if(!a) log("calculateWorldPosFromClosestSegmentData a is null!!!")
    if(!b) log("calculateWorldPosFromClosestSegmentData b is null!!!")
    const moveDir = b.subtract(a).normalize()

    //enemy.closestProjectedPointCache.copyFrom(player.racingData.closestProjectedPoint)
    const percent = player.racingData.closestSegmentPercent//percentOfLine(a,b,enemy.closestProjectedPointCache )
    //log(player.userData.name,"closestSegmentID",closestSegmentID,percent,player.racingData.closestProjectedPoint,player.racingData.closestSegmentDistance,Vector3.Cross(moveDir,Vector3.Up()).normalize().scale(player.racingData.closestSegmentDistance))
    const positionOnSegement = Vector3.Lerp( a,b, percent )

    //log("returning xx",positionOnSegement,player.racingData.closestSegmentDistance)

    const closestSegmentDist = (player.racingData.closestSegmentDistance !== undefined ) ? player.racingData.closestSegmentDistance : 0

    positionOnSegement.addInPlace( Vector3.Cross(moveDir,Vector3.Up()).normalize().scale(closestSegmentDist) )// )

    
    //log("returning",positionOnSegement)
    
    //TODO lerp this
    return positionOnSegement

    //enemy.entities.main.getComponent(Transform).rotation.copyFrom( player.racingData.shootDirection)
}