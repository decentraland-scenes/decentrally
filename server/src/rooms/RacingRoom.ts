import { Room, Client, ServerError } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";
import { CONFIG } from "./config";
import { PlayerButtonState, PlayerServerSideData, PlayerState, RaceState, RacingRoomState, TrackFeatureState } from "../state/server-state";
import * as serverStateSpec from "../state/server-state-spec";
import * as PlayFabHelper from "../playfab/PlayFabWrapper";
import { LEVEL_MGR } from "../levelData/levelData";

function logEntry(classname:string,roomId:string,method:string,params?:any){
    console.log(classname,roomId,method," ENTRY",params)
}
function log(classname:string,roomId:string,method:string,msg?:string,...args:any[]){
    console.log(classname,roomId,method,msg,...args)
}

const CLASSNAME = "RacingRoom"
const ENTRY = " ENTRY"
export class RacingRoom extends Room<RacingRoomState> {
    
    maxClients = 8;
    roomCreateTime: number

    //globalOrientation:OrientationType = {alpha:0,beta:0,gamma:0,absolute:true}

    onCreate(options) {
        const METHOD_NAME = "onCreate"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME, options);

        this.roomCreateTime = Date.now()
        this.setSimulationInterval((deltaTime) => this.update(deltaTime));

        const state = new RacingRoomState()
        state.enrollment.maxPlayers = this.maxClients
        this.setState(state);

        //setup game
        
        
        this.onMessage("levelData.trackFeature.add", (client: Client, trackFeatUpdate: serverStateSpec.TrackFeatureConstructorArgs) => {
            const METHOD_NAME = "levelData.trackFeature.add"
            log(CLASSNAME,this.roomId,METHOD_NAME, "",[client.sessionId,trackFeatUpdate]);

            if(!trackFeatUpdate.name || !trackFeatUpdate.type || !trackFeatUpdate.position){
                log(CLASSNAME,this.roomId,METHOD_NAME, "missing required/invalid field",trackFeatUpdate)
                return
            }
            //find it and update it
            const trackToUpdate = this.state.levelData.trackFeatures.get( trackFeatUpdate.name )

            if(trackToUpdate){
                log(CLASSNAME,this.roomId,METHOD_NAME, "already exists???",trackToUpdate.activateTime,trackFeatUpdate.activateTime)
                //trackToUpdate.activateTime = trackFeatUpdate.activateTime
            }else{
                log(CLASSNAME,this.roomId,METHOD_NAME, "adding",trackFeatUpdate.name)
                const trackFeatState = new TrackFeatureState( trackFeatUpdate )
                //trackFeatState.copyFrom( trackFeatUpdate )
                this.state.levelData.trackFeatures.set(trackFeatUpdate.name, trackFeatState)
            }
        })
        this.onMessage("levelData.trackFeature.update", (client: Client, trackFeatUpdate: serverStateSpec.TrackFeatureConstructorArgs) => {
            const METHOD_NAME = "levelData.trackFeature.update"
            log(CLASSNAME,this.roomId,METHOD_NAME, "",[client.sessionId,trackFeatUpdate]);
            //find it and update it
            const trackToUpdate = this.state.levelData.trackFeatures.get( trackFeatUpdate.name )

            if(trackToUpdate){
                log(CLASSNAME,this.roomId,METHOD_NAME, "updating",trackToUpdate.activateTime,trackFeatUpdate.activateTime)
                trackToUpdate.activateTime = trackFeatUpdate.activateTime
            }else{
                log(CLASSNAME,this.roomId,METHOD_NAME, "could not find track to update",trackFeatUpdate.name)
            }
        })
        this.onMessage("player.racingData.update", (client: Client, racingData: serverStateSpec.PlayerRaceDataState) => {
            const METHOD_NAME = "player.racingData.update"
            //log(CLASSNAME,this.roomId,METHOD_NAME, "",[client.sessionId,racingData]);

            const player = this.state.players.get(client.sessionId)
            if(player){
                player.setRacingData(racingData) //replacing entire object as many things can be changing as a set
            }else{
                log(CLASSNAME,this.roomId,METHOD_NAME, "WARNING cound not find player",client.sessionId)
            }
            this.updatePlayerRanks()
            this.checkIsRaceOver()
          });
        
        this.onMessage("player.buttons.update", (client: Client, buttons:serverStateSpec.PlayerButtonState) => {
            const METHOD_NAME = "player.buttons.update"
            //log(CLASSNAME,this.roomId,METHOD_NAME, "",[client.sessionId,buttons]);
    
            const player = this.state.players.get(client.sessionId)
            
            if(player) player.setButtons(buttons) //replacing entire object as many things can be changing as a set
        });
        this.onMessage("player.userData.name.update", (client: Client, name:string) => {
            const METHOD_NAME = "player.userData.name.update"
            log(CLASSNAME,this.roomId,METHOD_NAME, "",[client.sessionId,name]);

            const player = this.state.players.get(client.sessionId)
            player.userData.updateName(name)
            
          });
          //let them pass lots of stuff
        this.onMessage("player.userData.update", (client: Client, playerData:serverStateSpec.PlayerState) => {
            const METHOD_NAME = "player.update"
            log(CLASSNAME,this.roomId,METHOD_NAME, "",[client.sessionId,playerData]);

            const player = this.state.players.get(client.sessionId)
            //player.update(player)
        });
        this.onMessage("enrollment.extendTime", (client: Client, amount?: number) => {
            this.extendEnrollmentTime(amount)
        });
        this.onMessage("race.start", (client: Client) => {
            this.start()
        });

        const racingDataOptions:serverStateSpec.RaceDataOptions = options.raceDataOptions

        // set-up the game!
        this.setup(racingDataOptions);
    }
    checkIsRaceOver(){
        const METHOD_NAME = "checkIsRaceOver"
        if(!this.state.raceData.hasRaceStarted() || this.state.raceData.isRaceOver()){
            //log(CLASSNAME,this.roomId,METHOD_NAME,"checkIsRaceOver race not started/over",this.state.raceData.status)
            return false
        }
        //(lap + 1) * closestSegId + percentOfSeg }

        let countPlayersDone = 0
        let playersConnected = 0
        //const playerData:PlayerRankingsType[] = []
        this.state.players.forEach(
            (val:PlayerState)=>{
                if(val.racingData.hasFinishedRace()){
                    countPlayersDone ++
                }
                if(val.connStatus == 'connected' && val.type == 'racer'){
                    playersConnected ++
                }
                playersConnected
            }
        )

        let raceOver = false

        //if greater than 0, it will end race when all but N person is finished
        const endWhenAllButNFinish = 0

        if(
            //if all but 1 player finished race is over
            (playersConnected > 1 && (countPlayersDone) >= playersConnected-endWhenAllButNFinish)
            //if only 1 player connected and all are done
            || (playersConnected == 1 && countPlayersDone == 1)){
            
            log(CLASSNAME,this.roomId,METHOD_NAME,"players done","countPlayersDone",countPlayersDone,"playersConnected",playersConnected
            ,"raceOver",raceOver,"raceData.status",this.state.raceData.status,"raceData.hasRaceStarted()",this.state.raceData.hasRaceStarted()
            ,"raceData.isRaceOver",this.state.raceData.isRaceOver())
                
            this.endRace()
            raceOver = true
        }
        //const playerDataRanked = playerData.sort((n1,n2) => (n1.totalProgress > n2.totalProgress) ? -1 : 1);

        //log(CLASSNAME,this.roomId,METHOD_NAME,"players done",countPlayersDone,playersConnected,raceOver,this.state.raceData.status,this.state.raceData.hasRaceStarted(),this.state.raceData.isRaceOver())
        return raceOver
    }
    updatePlayerRanks() {
        const METHOD_NAME = "updatePlayerRanks"

        
        //(lap + 1) * closestSegId + percentOfSeg }

        type PlayerRankingsType={
            totalProgress:number
            id:string
        }
        const now = Date.now()

        //FIXME consider caching somehow?
        const playerData:PlayerRankingsType[] = []
        
        this.state.players.forEach(
            (val:PlayerState)=>{
                
                const closestSegId = (val.racingData.closestSegmentID !== undefined) ? val.racingData.closestSegmentID: 0
                const percentOfSeg = (val.racingData.closestSegmentPercent !== undefined) ? val.racingData.closestSegmentPercent: 0
                //base 1
                const lap = (val.racingData.lap !== undefined) ? val.racingData.lap: 0

                let totalProg = 0
                
                if(!val.racingData.visitedSegment0 && closestSegId == 0){
                    val.racingData.visitedSegment0 = true
                }
                if(val.racingData.visitedSegment0){
                    val.racingData.lastKnownSegment = closestSegId
                }
                
                if(val.racingData.endTime === undefined || val.racingData.endTime <= 0){
                    //1000000(~16 minutes) must be bigger than the last person to join the race (30 second wait time?)
                    //as we compute start rankings based on that
                    totalProg = (lap*1000000) + closestSegId + percentOfSeg
                }else{
                    //if completed the race use their finish time
                    //so we get valid sorting best lap time (smallest)
                    //will subtrack max val - time.  smaller race time leaves you at a higher overall race time
                    totalProg = 9999999999999 - val.racingData.endTime
                }
                //prevent reranking based on progress when race not started
                if(!val.racingData.visitedSegment0 || (!this.state.raceData.isRaceOver() && !this.state.raceData.hasRaceStarted())){
                    totalProg = val.racingData.enrollTime - this.roomCreateTime
                }

                //build a short term array list to compute player ranks
                playerData.push( {id:val.sessionId,totalProgress: totalProg })

                if( lap > 1 && val.racingData.lastKnownLap != lap){
                    val.racingData.lapTimes.push( now - val.racingData.lastLapStartTime )
                    val.racingData.lastLapStartTime = now
                    val.racingData.lastKnownLap = lap
                }

                //log(CLASSNAME,this.roomId,METHOD_NAME,"",val.userData.name,totalProg,lap,"closestSegId",closestSegId,"val.racingData.visitedSegment0",val.racingData.visitedSegment0,"maxlaps" , this.state.raceData.maxLaps,val.racingData.hasFinishedRace(),val.racingData.endTime)
                if(lap > this.state.raceData.maxLaps && !val.racingData.hasFinishedRace()){
                    //mark race is over for player
                    val.racingData.endTime = now
                    log(CLASSNAME,this.roomId,METHOD_NAME,"player",val.userData.userId,val.userPrivateData.playFabData,"finished the race","lap",lap
                    ,"racingData.lastKnownLap",val.racingData.lastKnownLap
                    ,"val.racingData.lapTimes",val.racingData.lapTimes.toArray()) 
                }


                //log(CLASSNAME,this.roomId,METHOD_NAME,"","lap",lap,"lastKnownLap",val.racingData.lastKnownLap,"lastLapStartTime",val.racingData.lastLapStartTime,"now",now)
            }
        )

        const playerDataRanked = playerData.sort((n1,n2) => (n1.totalProgress > n2.totalProgress) ? -1 : 1);

        //TODO add tiebreaker?  will enforce order based on playerDataRanked array results. do we risk ties and unstable sort order?
        let counter = 1
        for(const p in playerDataRanked){
            const player = playerDataRanked[p]
            this.state.players.get( player.id ).racingData.racePosition = counter
            counter++
        }
        //log(CLASSNAME,this.roomId,METHOD_NAME,"new ranks",playerDataRanked)
    }

    addPlayer(client:Client, options:any) { 
        const METHOD_NAME = "addPlayer"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME, [client.sessionId,options]);

        client.send("hello", "world");
        const player = this.state.createPlayer(client.sessionId);

        //update enrollment status?? 
        //workaround, not sure can trust client time is update enrollment servertime
        if(this.state.enrollment.open){
            this.state.enrollment.serverTime = Date.now()
        }

        player.connStatus = "connected"
        player.type = 'racer'
        if(options.userData){
            log(CLASSNAME,this.roomId,METHOD_NAME, "snapshot", [client.sessionId,options.userData.avatar]);
            if(options.userData.displayName) player.userData.name = options.userData.displayName
            if(options.userData.userId) player.userData.userId = options.userData.userId
            /*if(options.userData.avatar && options.userData.avatar.snapshots){
                log(CLASSNAME,this.roomId,METHOD_NAME, "snapshot", [client.sessionId,options.userData.avatar.snapshots]);
                player.userData.snapshotFace128 = options.userData.avatar.snapshots.face128
            } */
        } 

        //TODO verify on map

        if(this.state.players.size > this.maxClients){
            this.preventNewPlayers()
        }

        return player
    }
    
    async onAuth(client:Client, options:any):Promise<any> { 
        const METHOD_NAME = "onAuth()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME, [client.sessionId,options]);

        const promises:Promise<any>[] = [];

        const retData:PlayerServerSideData = {playFabData:undefined}

        const userData = options.userData
        const playfabData = options.playFabData

        const userDataForDebug = 
        {
          displayName: userData ? userData.displayName : "",
          publicKey: userData ? userData.publicKey : "",
          hasConnectedWeb3: userData ? userData.hasConnectedWeb3 : "",
          userId: userData ? userData.userId : "",
          version: userData ? userData.version : ""
        }

        if(CONFIG.PLAYFAB_ENABLED){
            if(userData && playfabData && CONFIG.PLAYFAB_TITLEID !== playfabData.titleId){
                log(CLASSNAME,this.roomId,METHOD_NAME," joined with wrong titleId " , CONFIG.PLAYFAB_TITLEID , "vs",playfabData.titleId)
                //this.broadcast("showError",{title:"Error","message":"Joined with wrong title id " +playfabData.titleId + " Expected " + CONFIG.PLAYFAB_TITLEID});
                
                const playFabAuth = new Promise((resolve, reject) => {
                    reject(new ServerError(4401, "Failed to Authenticate Session:" + "Joined with wrong title id " +playfabData.titleId + " Expected " + CONFIG.PLAYFAB_TITLEID))
                    return false
                })
                
                promises.push(playFabAuth)
            }else if(CONFIG.ON_JOIN_REQUIRE_PLAYFAB_DATA_OPTIONS  && (!userData || !playfabData)){
                log(CLASSNAME,this.roomId,METHOD_NAME," joined with no playfab data " , playfabData)
                //this.broadcast("showError",{title:"Error","message":"Joined with wrong title id " +playfabData.titleId + " Expected " + CONFIG.PLAYFAB_TITLEID});
                
                const playFabAuth = new Promise((resolve, reject) => {
                    reject(new ServerError(4401, "Failed to Authenticate Session:" + "Playfab Options Data is required"))
                    return false
                })
                
                promises.push(playFabAuth)
            }else if(userData && playfabData){
                if(playfabData.sessionId){
                    throw new ServerError(4401, "Failed to Authenticate Session")
                }
                const playFabAuth = new Promise((resolve, reject) => {
                    PlayFabHelper.AuthenticateSessionTicket( {"SessionTicket":playfabData.sessionTicket} ).then(
                    (result:PlayFabServerModels.AuthenticateSessionTicketResult)=>{
                        log(CLASSNAME,this.roomId,METHOD_NAME,"PlayFabHelper.AuthenticateSessionTicket.result",result)
                        //TODO set player id to something? wallet? fab id does not seem safe  
                        
                
                
                        if(result && result.IsSessionTicketExpired !== undefined && result.IsSessionTicketExpired === false){
                            const player = this.addPlayer(client,options)
                                
                            //const data:PlayerServerSideData = retData// = {sessionId:client.sessionId,playFabData:options.playFabData}
                            //retData.sessionId = client.sessionId
                            retData.playFabData = playfabData
                
                            player.userPrivateData = {
                                playFabData:{id:playfabData.id,sessionTicket:playfabData.sessionTicket}
                                }
                            
                                log(CLASSNAME,this.roomId,METHOD_NAME,"client.sessionId " + client.sessionId)
                    
                            //not map it both ways sessionId and playfabId 
                            //only map session id, keep it secret? can just loop serverside data object
                            //this.playerServerSideData[client.sessionId] = retData
                            //this.playerServerSideData[options.playFabData] = data
                            
                            log(CLASSNAME,this.roomId,METHOD_NAME,player.userData.name, "authed! => ", options.realm,userDataForDebug,playfabData);
                    
                            log(CLASSNAME,this.roomId,METHOD_NAME,player.userData.name, "authed! returning => ", retData);
                    
                            resolve(retData)
                    
                        }else{
                            console.log( "failed to auth player, did not join => ", result, options.realm,userDataForDebug,options.playFabData);
                    
                            //when in onJoin it tells them to leave
                            //4000 range, 401 for unauthorized
                            //client.leave(4401,"Failed to Authenticate Session")
                    
                            reject(new ServerError(4401, "Failed to Authenticate Session"));
                            return false;
                
                        //dispose room?
                        }
                    }
                    ).catch( (reason:any) => {
                        log(CLASSNAME,roomId,METHOD_NAME,"playFabAuth promise FAILED " , reason)
                        //TODO tack on server errors
                        reject(new ServerError(4401, "Failed to Authenticate Session"));
                        return false;
                    })
                })//end promise


                promises.push(playFabAuth)
            }else{
                //add observer???
                log(CLASSNAME,this.roomId,METHOD_NAME,"playing joined but no playfab/dcl data???",CONFIG.PLAYFAB_ENABLED,options)    
                const player = this.addPlayer(client,options)
                player.userPrivateData = {
                    playFabData:{id:"playfabData.id",sessionTicket:"playfabData.sessionTicket"}
                    }
            }
        }else{
            log(CLASSNAME,this.roomId,METHOD_NAME,"PlayFab not enabled.  Not authenticating player",options)    
            const player = this.addPlayer(client,options)
            player.userPrivateData = {
                playFabData:{id:"playfabData.id",sessionTicket:"playfabData.sessionTicket"}
                }
        }
        
        const roomId = this.roomId
        return Promise.all( promises ).then(function(result){
            log(CLASSNAME,roomId,METHOD_NAME,"all promised completed " , result)
            return retData;
        }).catch( (reason:any) =>{
            log(CLASSNAME,roomId,METHOD_NAME,"all promised FAILED " , reason)
            if(reason instanceof Error){
                throw reason
            }
            return false;
        } )

        //options.userData.displayName ||
        //return true;
    }

    onJoin(client: Client) {
        const METHOD_NAME = "onJoin()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME, client.sessionId);


        //this.onJoinSendLevelData(client)
    }

    //not needed, promoted levelData to state
    /*onJoinSendLevelData(client: Client){
        const METHOD_NAME = "onJoinSendLevelData()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME, client.sessionId);


        const retval:serverStateSpec.LevelDataState = { 
            id: this.state.raceData.id,
            name: this.state.raceData.name,
            trackFeatures: [],
            maxLaps: this.state.raceData.maxLaps,
            trackPath: []
        }

        this.state.levelData.copyTo( retval )

        const initLevelData = retval//JSON.stringify(retval)
        log(CLASSNAME,this.roomId,METHOD_NAME,"sending initLevelData")//,initLevelData)
        client.send("setup.initLevelData",initLevelData)
    }*/

    preventNewPlayers(){
        const METHOD_NAME = "preventNewPlayers()"
        if(!this.state.enrollment.open){
            log(CLASSNAME,this.roomId,METHOD_NAME,"room already locked",this.roomId)    
            return
        }
        log(CLASSNAME,this.roomId,METHOD_NAME,"no more racers allowed",this.roomId)
        this.lock()
        //lock prevents anyone else from joining
        this.state.enrollment.open=false
        this.state.enrollment.endTime = Date.now()
        this.setPrivate(true) //will let you join if u know the room ID
    }


    async onLeave(client: Client, consented: boolean) {
        const METHOD_NAME = "onLeave()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME, [client.sessionId,consented]);
        
        const player = this.state.players.get(client.sessionId);

        const playerWasCreated = player !== undefined
        /*
        try {
        client.send("onLeave","consented:"+consented) 
        } catch (e) {
        console.log("failed sending onLeave event",player.name,client.sessionId,e)
        }*/
        let removePlayer = this.state.raceData.status == "not-started"

        const waitForReconnect = CONFIG.RECONNECT_WAIT_ENABLED && !consented

        log(CLASSNAME,this.roomId,METHOD_NAME,"waitForReconnect:"+waitForReconnect,"playerWasCreated:"+playerWasCreated)
    
        if (waitForReconnect) {
            if(playerWasCreated) player.connStatus = "reconnecting"
            try {
                log(CLASSNAME,this.roomId,METHOD_NAME, "try for a reconnect!!!", [player.userData.name,this.roomName,this.roomId])
                // allow disconnected client to reconnect into this room until 20 seconds
                await this.allowReconnection(client, CONFIG.RECONNECT_WAIT_TIME);
 
                log(CLASSNAME,this.roomId,METHOD_NAME,"reconnnected!!!", player.userData.name)
                // client returned! let's re-activate it.
                //this.state.players.get(client.sessionId).connected = true;
                removePlayer = false

                if(playerWasCreated) player.connStatus = "connected"
            } catch (e) {
                log(CLASSNAME,this.roomId,METHOD_NAME,"reconnect failed!!!", [player.userData.name, client.sessionId, e])

                if(playerWasCreated) player.connStatus = "lost connection"
            }
        }else{
            if(playerWasCreated) player.connStatus = "disconnected"
        }

        if (removePlayer) {
            // 20 seconds expired. let's remove the client.
            if (playerWasCreated) {
                this.state.removePlayer(client.sessionId);

                //not removing player because need to rank them at the end
            } else {
                log(CLASSNAME,this.roomId,METHOD_NAME,"already gone? / cound not find " + client.sessionId);
            }
            //this.state.players.delete(client.sessionId);
        }

    }

    onDispose() {
        const METHOD_NAME = "onDispose()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME);
    }
    doEnrollment(){
        const METHOD_NAME = "doEnrollment()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME);
        const now = Date.now()
        //i dont know why but seeing precision issues with clock checking.  8 ms off?? 
        //this.state.enrollment.endTime <= now
        const paddingMS = 15
        if(this.state.enrollment.endTime - now < paddingMS){
            log(CLASSNAME,this.roomId,METHOD_NAME,"starting race",this.state.enrollment.endTime , now,(this.state.enrollment.endTime - now),paddingMS)
            //start race
            this.start()
        }else{
            //race not started yet 1655999493364-1655999493356
            log(CLASSNAME,this.roomId,METHOD_NAME,"race not started yet",this.state.enrollment.endTime , now,(this.state.enrollment.endTime - now),paddingMS)
        }
    }
    extendEnrollmentTime(amount?:number){
        const METHOD_NAME = "extendEnrollment"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME,amount);

        if(!this.state.enrollment.open){
            console.log("enrollment is closed")
            return;
        }
        if(!this.state.enrollment.open || this.state.raceData.status != "not-started"){
            console.log("race started cannot extend enrollment")
            return;
        }
            
        this.state.enrollment.endTime += amount && amount > 0 ? amount : CONFIG.MAX_WAIT_TO_START_TIME_MILLIS

        this.startEnrollTimer()
    }
    //GAMELOOP
    update(dt:number){
        //trying without the game loop
        /*
        switch(this.state.raceData.status){
            case "not-started":
                this.doEnrollment()
                break;
            case "started":

                break;

        }*/
    }//END GAMELOOP
    
    endRace(){
        const METHOD_NAME = "endRace()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME);

        this.state.raceData.updateServerTime() 
        this.state.raceData.endTime = Date.now()
        this.state.raceData.status = "ended"
        //broadcast to players?

        //one last rank update
        this.updatePlayerRanks()

        this.updatePlayerStats().then((result)=>{
            log(CLASSNAME,this.roomId,METHOD_NAME,"XXXXX endRace all promised completed " , result)
            this.broadcast("ended.roomAboutToDisconnect");
        })
        //this.updatePlayerStats()

        //force terminate connection in X seconds
        
        this.clock.clear();
 
        const waitToCloseTime = 3*1000
        log(CLASSNAME,this.roomId,METHOD_NAME,"will close room in " +waitToCloseTime + " ms")
        //MOVE THIS INTO a game loop if need more than 1 timer?
        this.clock.setTimeout(
            ()=>{
                log(CLASSNAME,this.roomId,METHOD_NAME,"force closing room now ")
                this.disconnect()
            },waitToCloseTime
            )
            
    }
    async updatePlayerStats():Promise<any[]>{
        const METHOD_NAME = "updatePlayerStats()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME);

        const roomId = this.roomId

        const promises:Promise<any>[] = [];
    
        let loopCount = 0
    
        if(!CONFIG.PLAYFAB_ENABLED){
            log(CLASSNAME,this.roomId,METHOD_NAME,"PlayFab not enabled.  Not saving player stats")    
            return Promise.all( promises ).then(function(result){
                log(CLASSNAME,roomId,METHOD_NAME,"XXXXXX PlayFab not enabled.  Not saving player stats " , result)
                return result;
              })
        }
        this.state.players.forEach((player) => {
            log(CLASSNAME,this.roomId,METHOD_NAME," looping" + loopCount + this.state.players.size)
            //this.state.players.forEach((player) => {
      
            //player.id
            const playerData:PlayerState = player

            const playerDebugId =  loopCount + " " + (playerData.userData ? playerData.userData.name : "") + " " + playerData.sessionId
            
            if(!playerData.userPrivateData){
                //warn and continue
                log(CLASSNAME,this.roomId,METHOD_NAME," looping " + loopCount + " " + playerDebugId +  " was missing userPrivateData")
                return
            }
            const playFabId = playerData.userPrivateData.playFabData.id;
            //const player = playerData.clientSide
    
            log(CLASSNAME,this.roomId,METHOD_NAME," looping " + loopCount + " " + playerDebugId + "  "+ playerData)
            if(playerData === undefined){
                log(CLASSNAME,this.roomId,METHOD_NAME," looping " + loopCount + " " + playerDebugId + " was nulll")
              return
            }
      
            const updatePlayerStats: PlayFabHelper.EndLevelUpdatePlayerStatsRequest = {
              playFabId: playFabId,
              totalTime: (playerData.racingData.endTime > -1 && playerData.racingData.endTime !== undefined ) ? (playerData.racingData.endTime - this.state.raceData.startTime) : CONFIG.MAX_POSSIBLE_RACE_TIME,
              lapTimes: playerData.racingData.lapTimes.toArray(),
              place: playerData.racingData.racePosition,
              levelName: this.state.raceData.name,
              levelId: this.state.raceData.id
              //playerCombinedInfo: getPlayerCombinedInfo
            }
      
            const promise = PlayFabHelper.EndLevelGivePlayerUpdatePlayerStats(updatePlayerStats)
            
            promise.then(function(result:PlayFabHelper.EndLevelUpdatePlayerStatsResult){
                log(CLASSNAME,roomId,METHOD_NAME,"XXXXX updatePlayerStats promise.EndLevelGivePlayerUpdatePlayerStats " + playerDebugId + " " + playerData.sessionId,result);
                //myRoom.authResult = result;
    
                //where to put this?
                //playerData.serverSide.endGameResult = result.endGameResult
                //client.send("announce",'TODO show game finished stats')
            }).catch(function(error:PlayFabServerModels.ModifyUserVirtualCurrencyResult){
                log(CLASSNAME,roomId,METHOD_NAME,"promise.EndLevelGivePlayerUpdatePlayerStats failed",error);
            })
    
            promises.push(promise)
    
            loopCount++;
          })
    
          log(CLASSNAME,roomId,METHOD_NAME," loopCount" + loopCount )
          
          return Promise.all( promises ).then(function(result){
            log(CLASSNAME,roomId,METHOD_NAME,"XXXXXX all promised completed " , result)
            return result;
          })
    }
      
    start(){
        const METHOD_NAME = "start()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME)

        if(this.state.raceData.status == "started"){
            log(CLASSNAME,this.roomId,METHOD_NAME,"already started!!!!")
            return;
        }
        if(this.state.raceData.status == "ended"){
            log(CLASSNAME,this.roomId,METHOD_NAME,"race is over, cannot start again")
            return;
        }
        this.preventNewPlayers()

        this.clock.clear();
 
        this.state.raceData.status = "starting"
        this.state.raceData.updateServerTime()
        this.state.raceData.startTime = Date.now() + CONFIG.STARTING_COUNTDOWN_TIME_MILLIS

        log(CLASSNAME,this.roomId,METHOD_NAME,"setting new clock timeout to start")

        //init lap start times
        this.state.players.forEach(
            (val:PlayerState)=>{
                log(CLASSNAME,this.roomId,METHOD_NAME,"setting first lap start time",this.state.raceData.startTime)
                val.racingData.lastLapStartTime = this.state.raceData.startTime
            }
        )

        //MOVE THIS INTO a game loop if need more than 1 timer?
        this.clock.setTimeout(()=>{
            this.state.raceData.status = "started"

            //MOVE THIS INTO a game loop if need more than 1 timer?
            this.clock.setTimeout(()=>{
                this.endRace()
            },CONFIG.MAX_GAME_TIME_MILLIS)

        }, CONFIG.STARTING_COUNTDOWN_TIME_MILLIS)
        
        
    }
    startEnrollTimer(){
        const METHOD_NAME = "startEnrollTimer"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME)
    
        // make sure we clear previous interval
        this.clock.clear();

        this.clock.setTimeout(()=>{
            log(CLASSNAME,this.roomId,METHOD_NAME,"calling doEnrollment/start")
            this.doEnrollment()
        },this.state.enrollment.endTime - this.state.enrollment.startTime)
    }
    setup(raceDataOptions:serverStateSpec.RaceDataOptions){
        const METHOD_NAME = "setup()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME,raceDataOptions)

        // setup round countdown
        //this.state.countdown = this.levelDuration;
    
        // make sure we clear previous interval
        this.clock.clear();
    
        //log("pausing for a few seconds to give sdk time to place items")
        //set timer to start

        this.setupRaceTrack(raceDataOptions)
        

        this.state.enrollment.updateServerTime()
        this.state.enrollment.startTime = Date.now()

        this.state.enrollment.endTime = Date.now() + CONFIG.MAX_WAIT_TO_START_TIME_MILLIS

        this.startEnrollTimer()
    }

    setupRaceTrack(raceDataOptions:serverStateSpec.RaceDataOptions){
        const METHOD_NAME = "setupRaceTrack()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME,raceDataOptions)

        if(raceDataOptions){
            this.state.raceData.id = raceDataOptions.levelId
            this.state.levelData.id = raceDataOptions.levelId

            //TODO WIRE THIS INTO TRACK DATA TO BROADCAST BACK BEFORE START!
            if(raceDataOptions.levelId == 'custom'){
                if(raceDataOptions.name) this.state.raceData.name = raceDataOptions.name
                if(raceDataOptions.maxLaps) this.state.raceData.maxLaps = raceDataOptions.maxLaps
                //if(raceDataOptions.maxPlayers) this.state.raceData.m = raceDataOptions.maxPlayers
            }else{
                const level = LEVEL_MGR.getLevel( raceDataOptions.levelId )
                if(level !== undefined){
                    //loop up from table
                    if(level.name){
                        this.state.raceData.name = level.name
                    }else{
                        this.state.raceData.name = raceDataOptions.levelId + " name not set"
                    }
                }else{
                    log(CLASSNAME,this.roomId,METHOD_NAME,"WARNING level not found ",raceDataOptions.levelId,raceDataOptions)
                    //this.state.raceData.name = "TODO pull race config from server file"
                    this.state.raceData.name = "track id: " + raceDataOptions.levelId + " not recognized"
                }
            }
        }else{
            log(CLASSNAME,this.roomId,METHOD_NAME,"WARNING raceDataOptions not provided!!!! ",raceDataOptions)
            this.state.raceData.name = "Unnamed Track"
        }
        
        const trackFeatures = this.setupRaceTrackFeatures()


        const retval:serverStateSpec.LevelDataState = { 
            id: this.state.raceData.id,
            name: this.state.raceData.name,
            trackFeatures: new Map(),
            localTrackFeatures: trackFeatures,
            maxLaps: this.state.raceData.maxLaps,
            trackPath: []
        }

        this.state.levelData.copyFrom( retval )

        //this.state.levelData = retval

        //TODO higher level logging return 'retval' itself
        log(CLASSNAME,this.roomId,METHOD_NAME,"created level")
    }
    setupRaceTrackFeatures(){
        const METHOD_NAME = "setupRaceTrackFeatures()"
        logEntry(CLASSNAME,this.roomId,METHOD_NAME)
        
        //TODO FIXME pull data from track ID

        
        //by not passing triggersize and shape, it allows current theme to define them
        const numSegements = 200 //FIXME //level1.trackPath.length
        const keepStartClear = 1
        const featureTypes = 2
        const featureTrackDensity = 7 //bigger the number, less dense it will be, 1 will be 1 segement
        const spawnPercentage = .5
        const spawnAmount = 2 //1 for 1.  2 for more if reaches the value randomly
        const maxOffset = 2
        const maxCloseness = .3

        const _featureDensitiy = Math.max(featureTypes,featureTrackDensity)
        let totalSpawned = 0
        let attemptedSpawned = 0


        let lastSpawnedOffset = 99
        let lastCenterOffset = 99


        const trackFeatures:serverStateSpec.TrackFeatureConstructorArgs[] = []

        //for quick testing could spawn some at very beginning
        trackFeatures.push( {name:"test.1",type:"boost", position:new serverStateSpec.TrackFeaturePosition({startSegment:2,endSegment:1, centerOffset:1}) } )
        trackFeatures.push( {name:"test.2a",type:"slow-down", position:new serverStateSpec.TrackFeaturePosition({startSegment:2,endSegment:1, centerOffset:-1}) } )
        trackFeatures.push( {name:"test.2.5",type:"slow-down", position:new serverStateSpec.TrackFeaturePosition({startSegment:2.5,endSegment:1, centerOffset:-1}) } )
        trackFeatures.push( {name:"test.3",type:"slow-down", position:new serverStateSpec.TrackFeaturePosition({startSegment:3,endSegment:1, centerOffset:-1}) } )


        trackFeatures.push( {name:"test.-1",type:"boost", position:new serverStateSpec.TrackFeaturePosition({startSegment:175,endSegment:1, centerOffset:1}) } )
        trackFeatures.push( {name:"test.-2",type:"slow-down", position:new serverStateSpec.TrackFeaturePosition({startSegment:175,endSegment:1, centerOffset:-1}) } )

        for(let x = keepStartClear ; x< numSegements - keepStartClear ; x++){
            //dont put stuff in near beginning or end
            const randomType = Math.floor(Math.random() * _featureDensitiy)
            let type=undefined
            switch(randomType){
                case 0: //boost
                type = "boost"
                break;
                case 1: //slowdown
                type = "slow-down"
                break;
            }

            const spawnIt = Math.random() < spawnPercentage
            
            if(spawnIt && type !== undefined){

                attemptedSpawned++
                const spawnCount = Math.max(1,Math.round(Math.random() * spawnAmount))

                //must keep track of last spawned
                
                let spawnCnt = 0
                while(spawnCnt<spawnCount){
                //TODO prevent overlap
                //take full offset then subtract half to get somewhere in the middle
                const centerOffset = (Math.random() * maxOffset*2) - maxOffset
                const xOffset = x + Math.random()
                //too close, try again
                if(Math.abs(xOffset - lastSpawnedOffset) < maxCloseness && Math.abs(centerOffset - lastCenterOffset) < maxCloseness){
                    log(CLASSNAME,this.roomId,METHOD_NAME,"adding addTrackFeature  too close try again",type,x+"",spawnIt+"",xOffset , lastSpawnedOffset , centerOffset , lastCenterOffset)
                    continue;
                }
                
                //log(CLASSNAME,this.roomId,METHOD_NAME,"adding addTrackFeature ",type,x,spawnIt)
                //level1.addTrackFeature( new TrackFeature( {name:type+"-"+spawnCnt+"."+xOffset.toFixed(1),type:type,triggerSize:undefined,shape:undefined, position:new TrackFeaturePosition({startSegment:xOffset,endSegment:xOffset, centerOffset:centerOffset, offset: new Vector3(0,0,0)}) } ))

                trackFeatures.push( {name:type+"-"+spawnCnt+"."+xOffset.toFixed(1),type:type, position:new serverStateSpec.TrackFeaturePosition({startSegment:xOffset,endSegment:xOffset, centerOffset:centerOffset}) } )

                totalSpawned++
                spawnCnt++
                lastSpawnedOffset = xOffset
                lastCenterOffset = centerOffset
                }
            }else{
                //log("nospawn addTrackFeature ",type,x,spawnIt)
            }
            
        }
        log(CLASSNAME,this.roomId,METHOD_NAME,"results ",numSegements.toFixed(0),totalSpawned.toFixed(0),attemptedSpawned.toFixed(0))

        return trackFeatures
    }

}
