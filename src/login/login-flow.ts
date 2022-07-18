import * as utils from '@dcl/ecs-scene-utils';
import PlayFab from "../playfab_sdk/PlayFabClientApi";
import * as PlayFabSDKWrapper from  '../playfab_sdk/index'
import { EntityTokenResponse, GetLeaderboardResult, GetPlayerCombinedInfoResult, GetPlayerCombinedInfoResultPayload, LoginResult, TreatmentAssignment, UserSettings } from '../playfab_sdk/playfab.types'; 
import * as ui from '@dcl/ui-scene-utils'

//import * as PlayFabSDK from 'playfab-sdk'

import { GAME_STATE } from 'src/modules/state';
import { getAndSetUserDataIfNullNoWait, getUserDataFromLocal } from 'src/modules/userData';
import { isNull, notNull, preventConcurrentExecution } from 'src/modules/utilities';
import { CONFIG } from 'src/config';
import { signedFetch } from '@decentraland/SignedFetch';
import { LoginFlowCallback, LoginFlowResult } from './login-types';
import { Constants } from 'src/modules/resources/globals';
import { LeaderBoardManager } from 'src/modules/scene/menu';
import { UserData } from '@decentraland/Identity';


//const PlayFab = PlayFabSDK.PlayFab
//const PlayFabClient = PlayFabSDK.PlayFabClient;
PlayFab.settings.titleId=CONFIG.PLAYFAB_TITLEID

// play ambient music
//playLoop(ambienceSound, 0.4);


//
// Request login with MetaMask
//
// const dclAuthURL = 'http://localhost:3000/api/dcl/auth'
const dclAuthURL = CONFIG.LOGIN_ENDPOINT

//this is a active logout, will make calls
export function logout(){
    
    //TODO make logout calls
    resetLoginState()
}
export function resetLoginState(){
    GAME_STATE.playerState.setLoginFlowState('undefined')
    GAME_STATE.playerState.setPlayerCustomID(null)
    GAME_STATE.playerState.setPlayFabLoginResult(null)
    GAME_STATE.playerState.setPlayFabUserInfoData(null)
    GAME_STATE.playerState.setLoginSuccess(false)
    updatePlayerHudInfo("Logged Out",Color4.White())
    
}

export function doLoginFlow(callback?:LoginFlowCallback,resultInPlace?:LoginFlowResult):Promise<LoginFlowResult>{
    const promise:Promise<LoginFlowResult> = new Promise( async (resolve, reject)=>{
        try{
            let loginRes:LoginFlowResult
            loginRes = await doLoginFlowAsync()
            resolve( loginRes )
        }catch(e){
            log("doLoginFlow failed ",e)
            if(CONFIG.ENABLE_DEBUGGER_BREAK_POINTS) debugger
            reject(e)
        }
    })
    //if doLoginFlowAsync is preventConcurrentExecution wrapped
    //confirmed that if it returns the same promise or a new one
    //promise.then just adds more to the callback so all callers
    //will get their callbacks ran
    promise.then(()=>{
        if(callback && callback.onSuccess){
            log("doLoginFlow calling callback. onSuccess")
            callback.onSuccess()
        }else{
            log("doLoginFlow success,no callback. onSuccess")
        }
    })
    return promise
}
Constants.doLoginFlow = doLoginFlow
//prevent login action ran more than 1 at a time
const doLoginFlowAsync = preventConcurrentExecution("doLoginFlowAsync",async (resultInPlace?:LoginFlowResult) => {
    log("doLoginFlowAsync " + GAME_STATE.playerState.loginFlowState)
    log("preventConcurrentExecution.doLoginFlowAsync")
    const retVal:LoginFlowResult = resultInPlace !== undefined ? resultInPlace : {chain:[]}
    try{
    switch(GAME_STATE.playerState.loginFlowState){
        case 'error':
            //HANDLE??
        case 'customid-error':
        case 'undefined':  
            log("doLoginFlowAsync.calling.fetchCustomId")
            retVal.chain.push( GAME_STATE.playerState.loginFlowState )
            //TODO add catch? call do login flow aync again?
            const uuid = await fetchCustomId()
            GAME_STATE.playerState.playerCustomID = uuid
            retVal.customId = uuid
        case 'customid-success':
            retVal.chain.push( GAME_STATE.playerState.loginFlowState )
            //TODO add catch? call do login flow aync again?
            const result = await loginUser(GAME_STATE.playerState.playerCustomID)
            retVal.playfabResult = result
        case 'playfab-error':
            //HANDLE??
        case 'playfab-success':
            retVal.chain.push( GAME_STATE.playerState.loginFlowState )
            log("doLoginFlowAsync already logged in",retVal.chain)
            retVal.playfabResult = GAME_STATE.playerState.playFabLoginResult
    }
    }catch(e){
        retVal.chain.push( GAME_STATE.playerState.loginFlowState )
        retVal.chain.push( e.message )
        //debugger
        log("doLoginFlowAsync threw an error",retVal,e)   
    }
    return retVal
})

function handleCustomIdError(json:any|Error){
    log("handleCustomIdError",json)
    //TODO HANDLE ALL POSSIBLE ERROR STATES
    if(json instanceof Error){
        GAME_STATE.playerState.loginFlowState='customid-error'

        Constants.Game_2DUI.showLoginErrorPrompt( undefined,"There was a an error signing in\n" + json.message  )
    }else{
        GAME_STATE.playerState.loginFlowState='customid-error'
        //{ valid: true, msg: 'Valid request', data: {uuid: uuid},code:string }
    }
}
//TODO return value
async function fetchCustomId(){
    return executeTask<string>(async () => {
        log("fetchCustomId start ")

        if(!CONFIG.PLAYFAB_ENABLED){
            log("PlayFab disabled, not fetching custom id. stubbing one")
            GAME_STATE.playerState.loginFlowState='customid-success'
                
            //{ valid: true, msg: 'Valid request', data: {uuid: uuid} }
            log("calling PlayFabSDK.LoginWithCustomID")
            addLoginInfo(PlayFab.settings.titleId)
            const playerCustId='json.data.uuid'
            GAME_STATE.playerState.setPlayerCustomID(playerCustId) 

            return playerCustId
        }
        const callUrl = CONFIG.LOGIN_ENDPOINT

        try {
            let response = await signedFetch(callUrl + "&titleId="+CONFIG.PLAYFAB_TITLEID, {
            headers: { "Content-Type": "application/json" },
            method: "GET",
            //body: JSON.stringify({"titleId":CONFIG.PLAYFAB_TITLEID}),
            })
         
            if (!response.text) {
                throw new Error("Invalid response")
            }
        
            let json = await JSON.parse(response.text)
        
            log("Response received: ", json)
            if (json.valid || json.ok){ 
                GAME_STATE.playerState.loginFlowState='customid-success'
                
                //{ valid: true, msg: 'Valid request', data: {uuid: uuid} }
                log("calling PlayFabSDK.LoginWithCustomID")
                addLoginInfo(PlayFab.settings.titleId)
                const playerCustId=json.data.uuid
                GAME_STATE.playerState.setPlayerCustomID(playerCustId) 

                return playerCustId
            }else{
                handleCustomIdError(json)
                //return 'error'
                throw new Error( json.msg )
            }
        } catch (err){
            log("fetchCustomId failed to reach URL",err)
            handleCustomIdError(err)
            //return err.message 
            throw err
        }
    })

}

//doLoginFlow()


//
// Connect to Colyseus server! 
// Set up the scene after connection has been established.
//
//let playerLoginResult:LoginResult;

const canvas = ui.canvas

let message: UIText;
    message = new UIText(canvas)
    message.fontSize = 15
    message.width = 120
    message.height = 30
    message.hTextAlign = "right";
    message.hAlign = "right"
    message.vAlign = "bottom"
    message.positionX = -10
    message.positionY = 30

function addLoginInfo(title: string) {
    updatePlayerHudInfo(`**Logging in ${title}`, Color4.White());
}
 
function updatePlayerHudInfo(msg:string, color: Color4) {
    log("updatePlayerHudInfo ",msg)
    if(CONFIG.IN_PREVIEW && CONFIG.DEBUG_SHOW_PLAYER_LOGIN_INFO){
        message.value = msg;
        message.color = color;
    }
}
/*
need to do this to avoid naming collisions should a player connect to playfab with diff auth envs
eacn auth env will give diff login ids and we are not allowing u to share title names

name#L - for local
name#D - for dev
name#S - for stage
name - for prod
*/
function createUserTitleDispalyName(userData:UserData|undefined){
    //.io (development), .net (staging), and .org (production).
    const addNonProdSalt = !CONFIG.isAuthEnvProd()
    return userData.displayName + (addNonProdSalt ? "#" + CONFIG.getAuthEnvSingleLetter() : "")
}
function updateLoginInfoFromResult(result:LoginResult) {
    log("updateLoginInfoFromResult")
    
    if(notNull(result) && isNull(result.error)){
        GAME_STATE.playerState.loginFlowState='playfab-success'
        GAME_STATE.setLoginSuccess(true) // STORE WHOLE LoginResult? thinking no
        GAME_STATE.playerState.setPlayFabUserInfoData(result.InfoResultPayload)
        updatePlayerHudInfo(
                "Player Info\n"+"ID: " + result.PlayFabId + " \n(last login:" + result.LastLoginTime+")" +
                //"\nAccountInfo:" + JSON.stringify(result.InfoResultPayload?.AccountInfo != null ? result.InfoResultPayload.AccountInfo: '') +
                "\nVC:" + JSON.stringify(result.InfoResultPayload != null ? result.InfoResultPayload.UserVirtualCurrency: '') +
                "\nInventory:" + JSON.stringify(result.InfoResultPayload != null ? result.InfoResultPayload.UserInventory: '')
                ,Color4.Green())

        //make sure we have it
        //if(!getUserDataFromLocal()){
        //    await getAndSetUserData() // calling await, need it now
        //}


        const userData = getUserDataFromLocal()
        if(CONFIG.PLAYFAB_ENABLED && userData !== null ){
            PlayFabSDKWrapper.UpdateUserTitleDisplayName( {
                DisplayName: createUserTitleDispalyName(userData)
                }
            ).then(()=>{
                const userData:Record<string,string> = {}

                //this data is read/writable by client
                //TODO consider storing ethPublicKey/userId with our login service and into publisher data / internal data
                userData["ethPublicKey"] = userData.publicKey,
                userData["userId"] = userData.userId

                //start title specific things
                userData["lastLogin"] = JSON.stringify( {"time":Date.now()} )

                //dont do them at the same time as causes race condition errors writting too fast to player
                PlayFabSDKWrapper.UpdateUserData( {
                    Data: userData,
                    // Optional list of Data-keys to remove from UserData. Some SDKs cannot insert null-values into Data due to language
                    // constraints. Use this to delete the keys directly.
                    //KeysToRemove?: string[];
                    // Permission to be applied to all user data keys written in this request. Defaults to "private" if not set. This is used
                    // for requests by one player for information about another player; those requests will only return Public keys.
                    Permission: "private"
                    }
                )
            })
        }else if(!CONFIG.PLAYFAB_ENABLED){
            log("PlayFab disabled, not updating user data")
        }else{
            log("WARNING userdata existant. cannot set display title/user key")
        }

        fetchLeaderboardInfo()
    }else{   
        GAME_STATE.playerState.loginFlowState='playfab-error'
        GAME_STATE.setLoginSuccess(false)
        updatePlayerHudInfo(
            "Login Failed: " + result.errorCode + "\n" + result.error +  "\n" + result.errorMessage
            ,Color4.Red())
    }
} 

export function refreshUserData(delay?:number){
    log("refreshUserData called")
    //quick and dirty - place holder. for now just will relogin 
    //FIXME long term should call fetch user data. want to track logins and resusing here muddles the login vs info fetching
    //wait 500 ms for playfab scores to sync
    utils.setTimeout(delay!== undefined ? delay : 1000,()=>{  
        fetchRefreshPlayerCombinedInfo()
    })
}
export function loginUser(uuid:any):Promise<LoginResult>{
    log("loginUser START")
    const promise = new Promise<LoginResult>((resolve, reject)=>{
        //make sure we have it
        getAndSetUserDataIfNullNoWait() //not calling await, hoping its fast

        if(CONFIG.PLAYFAB_ENABLED){
            PlayFabSDKWrapper.LoginWithCustomID({
                CreateAccount: true,
                // Custom unique identifier for the user, generated by the title.
                CustomId: uuid,
                // The optional custom tags associated with the request (e.g. build number, external trace identifiers, etc.).
                //CustomTags?: { [key: string]: string | null };
                // Base64 encoded body that is encrypted with the Title's public RSA key (Enterprise Only).
                //EncryptedRequest?: string;
                // Flags for which pieces of info to return for the user.
                InfoRequestParameters: 
                    {"GetUserReadOnlyData":true,"GetUserInventory":true,"GetUserVirtualCurrency":true
                    ,"GetPlayerStatistics":true,"GetCharacterInventories":false,"GetCharacterList":false
                    ,"GetPlayerProfile":false,"GetTitleData":true,"GetUserAccountInfo":true,"GetUserData":true},
                // Player secret that is used to verify API request signatures (Enterprise Only).
                //PlayerSecret?: string;
                // Unique identifier for the title, found in the Settings > Game Properties section of the PlayFab developer site when a
                // title has been selected.
                TitleId: PlayFab.settings.titleId
            }).then(function(result:LoginResult){
                log("promise.LoginWithCustomID",result);

                GAME_STATE.playerState.setPlayFabLoginResult( result )
                
                updateLoginInfoFromResult(result)

                resolve(result)
                
                //TODO update user wallet address (UpdateUserData) + displayname (UpdateUserTitleDisplayName)
            }).catch(function(error:LoginResult){
                log("promise.LoginWithCustomID failed",error);
                updateLoginInfoFromResult(error)

                reject(error)
            })
        }else{
            const result:LoginResult = 
            {
                "SessionTicket": "PLAYFAB_SESSION_TICKET",
                "PlayFabId": "PLAYFAB_ID",
                "NewlyCreated": true,
                "SettingsForUser": {
                    "NeedsAttribution": false,
                    "GatherDeviceInfo": true,
                    "GatherFocusInfo": true
                },
                "InfoResultPayload": {
                    "AccountInfo": {
                        "PlayFabId": "PLAYFAB_ID",
                        "Created": "2022-07-18T14:27:32.143Z",
                        "TitleInfo": {
                            "Origination": "CustomId",
                            "Created": "2022-07-18T14:27:32.143Z",
                            "LastLogin": "2022-07-18T14:27:32.143Z",
                            "FirstLogin": "2022-07-18T14:27:32.143Z",
                            "isBanned": false,
                            "TitlePlayerAccount": {
                                "Id": "PLAYFAB_ACCOUNT_ID",
                                "Type": "title_player_account"
                            }
                        },
                        "PrivateInfo": {},
                        "CustomIdInfo": {
                            "CustomId": "CUSTOM_ID"
                        }
                    },
                    "UserInventory": [],
                    "UserVirtualCurrency": {},
                    "UserVirtualCurrencyRechargeTimes": {},
                    "UserData": {},
                    "UserDataVersion": 0,
                    "UserReadOnlyData": {},
                    "UserReadOnlyDataVersion": 0,
                    "CharacterInventories": [],
                    "TitleData": {},
                    "PlayerStatistics": []
                },
                "EntityToken": {
                    "EntityToken": "EntityToken_VALUE",
                    "TokenExpiration": "2022-07-19T14:27:32.143Z",
                    "Entity": {
                        "Id": "PLAYFAB_ACCOUNT_ID",
                        "Type": "title_player_account"
                        //"TypeString": "title_player_account"
                    }
                },
                "TreatmentAssignment": {
                    "Variants": [],
                    "Variables": []
                }
            } as LoginResult

            log("PlayFab not enabled. Stubbing result")
            GAME_STATE.playerState.setPlayFabLoginResult( result )
            
            updateLoginInfoFromResult(result)

            resolve(result)
            
        }
    })
    return promise
}



export function fetchLeaderboardInfo(prefix:string = '') {
    Constants.SCENE_MGR.lobbyScene.refreshLevelLeaderboardStats({reloadSelected:true,defaultStat:LeaderBoardManager.DEFAULT_STAT_POSTFIX})
}
//Wake is Thursday, The funeral is this Friday. I already have a vacation day scheduled for that.  If I do get bereavement but I already called off vacation can I ethically cancel the vacation for bereavement?

export function fetchRefreshPlayerCombinedInfo():Promise<GetPlayerCombinedInfoResult> {
    log("fetchRefreshPlayerCombinedInfo called")
    var getPlayerCombinedInfoRequestParams: PlayFabServerModels.GetPlayerCombinedInfoRequestParams = {
        "GetUserReadOnlyData":true,"GetUserInventory":true,"GetUserVirtualCurrency":true
        ,"GetPlayerStatistics":true,"GetCharacterInventories":false,"GetCharacterList":false
        ,"GetPlayerProfile":true,"GetTitleData":true,"GetUserAccountInfo":true,"GetUserData":true,
        // Specific statistics to retrieve. Leave null to get all keys. Has no effect if GetPlayerStatistics is false
        //PlayerStatisticNames?: string[];
        // Specifies the properties to return from the player profile. Defaults to returning the player's display name.
        //ProfileConstraints?: PlayerProfileViewConstraints;
        // Specific keys to search for in the custom data. Leave null to get all keys. Has no effect if GetTitleData is false
        //TitleDataKeys?: string[];
        // Specific keys to search for in the custom data. Leave null to get all keys. Has no effect if GetUserData is false
        //UserDataKeys?: string[];
        // Specific keys to search for in the custom data. Leave null to get all keys. Has no effect if GetUserReadOnlyData is
        // false
        UserReadOnlyDataKeys: ['testReadOnly']
    }
    var getPlayerCombinedInfoRequest: PlayFabClientModels.GetPlayerCombinedInfoRequest= {
        // The optional custom tags associated with the request (e.g. build number, external trace identifiers, etc.).
        //CustomTags?: { [key: string]: string | null };
        // Flags for which pieces of info to return for the user.
        InfoRequestParameters: getPlayerCombinedInfoRequestParams
        // PlayFabId of the user whose data will be returned
        //PlayFabId: playFabId,
    }
    const promise = PlayFabSDKWrapper.GetPlayerCombinedInfo( 
        getPlayerCombinedInfoRequest
    )
    promise.then( (result:GetPlayerCombinedInfoResult) => {
        GAME_STATE.playerState.setPlayFabUserInfoData(result.InfoResultPayload)
        updatePlayerHudInfo(
            "** Player Info\n"+"ID: " + result.PlayFabId + " \n(last login:" + result.InfoResultPayload?.PlayerProfile?.LastLogin+")" +
            //"\nAccountInfo:" + JSON.stringify(result.InfoResultPayload?.AccountInfo != null ? result.InfoResultPayload.AccountInfo: '') +
            "\nVC:" + JSON.stringify(result.InfoResultPayload != null ? result.InfoResultPayload.UserVirtualCurrency: '') +
            "\nInventory:" + JSON.stringify(result.InfoResultPayload != null ? result.InfoResultPayload.UserInventory: '')
            ,Color4.Green())
    })
    return promise
}
 
GAME_STATE.playerState.addChangeListener(
    (key: string, newVal: any, oldVal: any)=>{
      log("listener.playerState.login-flow.ts " + key + " " + newVal + " " + oldVal)
  
      switch(key){
        //common ones on top
        case "requestDoLoginFlow":
          doLoginFlow()
          break;
      }
  })
