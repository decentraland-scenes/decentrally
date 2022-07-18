//import PlayFab from "../playfab_sdk/PlayFabClientApi";
//import * as PlayFabSDK from  '../playfab_sdk/index'
//import { EntityTokenResponse, GetPlayerCombinedInfoResultPayload, LoginResult, TreatmentAssignment, UserSettings } from '../playfab_sdk/playfab.types'; 
import { PlayFab,PlayFabAuthentication, PlayFabServer } from "playfab-sdk";
import { CONFIG } from "../rooms/config";

//var PlayFab: PlayFab ;//= require("PlayFab-sdk/Scripts/PlayFab/PlayFab");
//var PlayFabClient: PlayFabClientModule.IPlayFabClient ;//= require("PlayFab-sdk/Scripts/PlayFab/PlayFabClient");

//2021-12-10T02:57:57.208Z
//want to match playfab format just for consistancy
//2021-12-09T22:53:34 GMT-0500

PlayFab.settings.titleId = CONFIG.PLAYFAB_TITLEID
PlayFab.settings.developerSecretKey = CONFIG.PLAYFAB_DEVELOPER_SECRET

function notNull(val:any){
  return val !== null && val !== undefined
}
function isNull(val:any){
  return val === null && val === undefined
}

const c = (resolve:any, reject:any) => {
  //return (result:any,error:any) => {
  return (error:any,result:any) => {
      if(error){
          console.log("PlayFab Error", error);
          console.log("PlayFab Result", result);
          reject(error)
      }else{
          resolve(result.data);
      }
  }
}
 
export const GetEntityToken = (request:PlayFabAuthenticationModels.GetEntityTokenRequest):Promise<PlayFabAuthenticationModels.ValidateEntityTokenResponse> => {
      return new Promise((resolve, reject)=>{
        PlayFabAuthentication.GetEntityToken( request, c(resolve, reject)) 
      })
};


export const AddCharacterVirtualCurrency = (request:PlayFabServerModels.AddUserVirtualCurrencyRequest):Promise<PlayFabServerModels.ModifyUserVirtualCurrencyResult> => {
    return new Promise((resolve, reject)=>{
      PlayFabServer.AddUserVirtualCurrency( request, c(resolve, reject)) 
    })
};


export const SubtractUserVirtualCurrency = (request:PlayFabServerModels.SubtractUserVirtualCurrencyRequest):Promise<PlayFabServerModels.ModifyUserVirtualCurrencyResult> => {
  return new Promise((resolve, reject)=>{
    PlayFabServer.SubtractUserVirtualCurrency( request, c(resolve, reject)) 
  })
};


export const AddUserVirtualCurrency = (request:PlayFabServerModels.AddUserVirtualCurrencyRequest):Promise<PlayFabServerModels.ModifyUserVirtualCurrencyResult> => {
  return new Promise((resolve, reject)=>{
    PlayFabServer.AddUserVirtualCurrency( request, c(resolve, reject)) 
  })
};


export const GetPlayerCombinedInfo = (request:PlayFabServerModels.GetPlayerCombinedInfoRequest):Promise<PlayFabServerModels.GetPlayerCombinedInfoResult> => {
  return new Promise((resolve, reject)=>{
    PlayFabServer.GetPlayerCombinedInfo( request, c(resolve, reject)) 
  })
};


export const UpdateUserReadOnlyData = (request:PlayFabServerModels.UpdateUserDataRequest):Promise<PlayFabServerModels.UpdateUserDataResult> => {
  return new Promise((resolve, reject)=>{
    PlayFabServer.UpdateUserReadOnlyData( request, c(resolve, reject)) 
  })
};


export const UpdatePlayerStatistics = (request:PlayFabServerModels.UpdatePlayerStatisticsRequest):Promise<PlayFabServerModels.UpdatePlayerStatisticsResult> => {
  return new Promise((resolve, reject)=>{
    PlayFabServer.UpdatePlayerStatistics( request, c(resolve, reject)) 
  })
};

export const AuthenticateSessionTicket = (request:PlayFabServerModels.AuthenticateSessionTicketRequest):Promise<PlayFabServerModels.AuthenticateSessionTicketResult> => {
  return new Promise((resolve, reject)=>{
    try{
    PlayFabServer.AuthenticateSessionTicket( request, c(resolve, reject)) 
    }catch(e){
      console.log("AuthenticateSessionTicket failed",e)
      reject(e)
    }
  })
};


// or re-usable `sleep` function:
const doSleep = (milliseconds:number) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

//const list = [1, 2, 3, 4, 5]
const sleep = async (val:number) => {
  //for (const item of list) {
    await doSleep(val);
    console.log('slept for ' + val );
  //}
}

const sleepLoop = (seconds:number)=>{
  var waitTill = new Date(new Date().getTime() + seconds * 1000);
  while(waitTill > new Date()){}
}


export const EndLevelGivePlayerUpdatePlayerStats = async (updateStats:EndLevelUpdatePlayerStatsRequest):Promise<EndLevelUpdatePlayerStatsResult> => {

  console.log("EndLevelGivePlayerUpdatePlayerStats START ",updateStats)

  const results: EndLevelUpdatePlayerStatsResult = {}
  const promises:Promise<any>[] = [];

  const playFabId = updateStats.playFabId
  const now = new Date();

  var getPlayerCombinedInfoRequestParams: PlayFabServerModels.GetPlayerCombinedInfoRequestParams = {
    // Whether to get character inventories. Defaults to false.
    GetCharacterInventories: false,
    // Whether to get the list of characters. Defaults to false.
    GetCharacterList: false,
    // Whether to get player profile. Defaults to false. Has no effect for a new player.
    GetPlayerProfile: false,
    // Whether to get player statistics. Defaults to false.
    GetPlayerStatistics: false,
    // Whether to get title data. Defaults to false.
    GetTitleData: false,
    // Whether to get the player's account Info. Defaults to false
    GetUserAccountInfo: false,
    // Whether to get the player's custom data. Defaults to false
    GetUserData: false,
    // Whether to get the player's inventory. Defaults to false
    GetUserInventory: false,
    // Whether to get the player's read only data. Defaults to false
    GetUserReadOnlyData: true,
    // Whether to get the player's virtual currency balances. Defaults to false
    GetUserVirtualCurrency: true,
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
    UserReadOnlyDataKeys: []
  }
  var getPlayerCombinedInfoRequest: PlayFabServerModels.GetPlayerCombinedInfoRequest= {
    // The optional custom tags associated with the request (e.g. build number, external trace identifiers, etc.).
    //CustomTags?: { [key: string]: string | null };
    // Flags for which pieces of info to return for the user.
    InfoRequestParameters: getPlayerCombinedInfoRequestParams,
    // PlayFabId of the user whose data will be returned
    PlayFabId: playFabId,
  }
  
  const runningGuestGame = false

  let prefix = "lvl_"+updateStats.levelId.replace(/ /g, "_").toLocaleLowerCase();

  let userData:any = {}

  let gameEndResult:GameEndResultType={
    placed: updateStats.place,
    totalTime: updateStats.totalTime
  }
  

  var getPlayerCombinedInfo = new Promise((mainResolve, reject)=>{
    GetPlayerCombinedInfo(getPlayerCombinedInfoRequest).then(
      function(result:PlayFabServerModels.GetPlayerCombinedInfoResult){
        console.log("promise.EndLevelGivePlayerUpdatePlayerStats.GetPlayerCombinedInfoResult",result);
        console.log("promise.EndLevelGivePlayerUpdatePlayerStats.GetPlayerCombinedInfoResult.UserReadOnlyData",result.InfoResultPayload.UserReadOnlyData);
        //myRoom.authResult = result;
        results.playerCombinedInfo = result;
        
        
        //let newEpoch = null
        //let userData:any = {}
        //let resetEpoch = false;

        //TODO need to write to guest currency somehow!!!

        let subtractAmount = 0;
 
        const promisesInner:Promise<any>[] = [];

        
        /*const newEpochtime = new Date()

        //because we are doing 24 hour flooring it so it matches utc clock
        newEpochtime.setUTCHours(0,0,0,0);

        currentEpoch = newEpochtime
        newEpoch = date.format(newEpochtime, CONFIG.DATE_FORMAT_PATTERN,true);
        */

        userData["lastRaceData"] = JSON.stringify({id:updateStats.levelId,"name":updateStats.levelName,"time":Date.now(),placed:updateStats.place,"totalTime":updateStats.totalTime})
        
        //must write it
        const updateReadOnlyData = UpdateUserReadOnlyData(
          {
            // The optional custom tags associated with the request (e.g. build number, external trace identifiers, etc.).
            //CustomTags?: { [key: string]: string | null };
            // Key-value pairs to be written to the custom data. Note that keys are trimmed of whitespace, are limited in size, and may
            // not begin with a '!' character or be null.
            Data: userData,
            // Optional list of Data-keys to remove from UserData. Some SDKs cannot insert null-values into Data due to language
            // constraints. Use this to delete the keys directly.
            //KeysToRemove?: string[];
            // Permission to be applied to all user data keys written in this request. Defaults to "private" if not set.
            //Permission?: string;
            // Unique PlayFab assigned ID of the user on whom the operation will be performed.
            PlayFabId: playFabId
          }
        )
        promisesInner.push(updateReadOnlyData)

        const thisGameStats:PlayFabServerModels.StatisticUpdate[] = []

        //be aware stat name has a 50 char max len
        //totalTime, prefix with the level
        if(updateStats.place > 0 && Math.abs(updateStats.totalTime) < Math.abs(CONFIG.MAX_POSSIBLE_RACE_TIME)){
          const workaroundScalar = -1
          //https://community.playfab.com/questions/4254/leaderboard-ordering-with-min-aggregation.html
          addStat(thisGameStats,"totalTime_best",prefix,["hour","day","week"],updateStats.totalTime*workaroundScalar,[CONFIG.MAX_POSSIBLE_RACE_TIME*workaroundScalar + 1,1*workaroundScalar])
          addStat(thisGameStats,"lapTime_best",prefix,["hour","day","week"],Math.min.apply(Math,updateStats.lapTimes)*workaroundScalar,[CONFIG.MAX_POSSIBLE_RACE_TIME*workaroundScalar + 1,1*workaroundScalar])
          //addStat(thisGameStats,"placedTop3","level_any",["hourly","daily","weekly"],1,[0,1])//makes no sense when not filled with people
          addStat(thisGameStats,"completed","level_any",["week","epoch"],1,[0,1])
        }else{
          console.log("player did not complete race. finish required stats not added",thisGameStats)  
        }

        console.log("thisGameStats",thisGameStats)

        const updatePlayerStats = UpdatePlayerStatistics(
          {
            // The optional custom tags associated with the request (e.g. build number, external trace identifiers, etc.).
            //CustomTags?: { [key: string]: string | null };
            // Indicates whether the statistics provided should be set, regardless of the aggregation method set on the statistic.
            // Default is false.
            //ForceUpdate?: boolean;
            // Unique PlayFab assigned ID of the user on whom the operation will be performed.
            PlayFabId: playFabId,
            // Statistics to be updated with the provided values
            Statistics: thisGameStats
          }
        )
        console.log("updatePlayerStats",updatePlayerStats)
        
        promisesInner.push(updatePlayerStats)

        Promise.all( promisesInner ).then(()=>{
          console.log("promisesInner promised completed " , result)
          //console.log("start  " + 2, Date.now())
          //sleepLoop(2)
          //console.log("returned from " + 2, Date.now())


          results.endGameResult=gameEndResult

          mainResolve(results);
        })
        
    })
  })
  //promises.push( addCurrencyPromise )
  promises.push( getPlayerCombinedInfo );
  /*
  const allDonePromise = new Promise( function(resolve , reject ){

  }*/

  return Promise.all( promises ).then(function(result){
    console.log("all promised completed " , result)
    return results;
  })
};

export type EndLevelUpdatePlayerStatsRequest= {
  playFabId: string
  totalTime: number
  lapTimes: number[]
  place: number
  levelName: string
  levelId:string
  //playerCombinedInfo?: PlayFabServerModels.GetPlayerCombinedInfoRequest
}

export type GameEndResultType={
  placed:number
  totalTime:number
}

export type EndLevelUpdatePlayerStatsResult= {
  playerCombinedInfo?: PlayFabServerModels.GetPlayerCombinedInfoResult
  endGameResult?: GameEndResultType
}
  
function DoExampleLoginWithCustomID(): void {
    var loginRequest: PlayFabAuthenticationModels.GetEntityTokenRequest= {
        // The optional custom tags associated with the request (e.g. build number, external trace identifiers, etc.).
        //CustomTags?: { [key: string]: string | null };
        // The entity to perform this action on.
        //Entity: {
        //  Id: PlayFab.settings.titleId
        //}
    };

    PlayFabAuthentication.GetEntityToken( loginRequest, LoginCallback  )
}

function LoginCallback(error: PlayFabModule.IPlayFabError, result: PlayFabModule.IPlayFabSuccessContainer<PlayFabAuthenticationModels.ValidateEntityTokenResponse>): void {
    if (result !== null) {
        console.log("Congratulations, you made your first successful API call!",result);
    } else if (error !== null) {
        console.log("Something went wrong with your first API call.");
        console.log("Here's some debug information:");
        console.log(CompileErrorReport(error));
    }
}

// This is a utility function we haven't put into the core SDK yet.  Feel free to use it.
function CompileErrorReport(error: PlayFabModule.IPlayFabError): string {
    if (error == null)
        return "";
    var fullErrors: string = error.errorMessage;
    for (var paramName in error.errorDetails)
        for (var msgIdx in error.errorDetails[paramName])
            fullErrors += "\n" + paramName + ": " + error.errorDetails[paramName][msgIdx];
    return fullErrors;
}

function addStat(thisGameStats:PlayFabServerModels.StatisticUpdate[],stat: string, prefix:string, statFrequency: string[], value: number,range:number[]) {
  if(value === undefined || value < range[0] || value > range[1]){
    console.log("addStat ",stat," out of range, not recording ",value,range);
    return
  }
  for(const p in statFrequency){
    const statName = prefix + "_" + stat + "_" + statFrequency[p]
    thisGameStats.push(
      {
        // unique name of the statistic
        StatisticName: statName,
        // statistic value for the player
        Value: value 
        // for updates to an existing statistic value for a player, the version of the statistic when it was loaded. Null when
        // setting the statistic value for the first time.
        //Version?: number;
      }
    )
  }
}
