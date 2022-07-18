/*

This wraps playfab api into promises for easier callback usage

*/
import {GetCatalogItemsRequest,GetCatalogItemsResult, ExecuteCloudScriptRequest, ExecuteCloudScriptResult, GetUserInventoryRequest, GetUserInventoryResult, LoginResult, LoginWithCustomIDRequest, UpdateUserDataRequest, UpdateUserDataResult, GetPlayerCombinedInfoRequest, GetPlayerCombinedInfoResult, GetPlayerStatisticsRequest, GetPlayerStatisticsResult, GetLeaderboardRequest, GetLeaderboardResult, UpdateUserTitleDisplayNameRequest, UpdateUserTitleDisplayNameResult, CatalogItem} from "./playfab.types";


//import * as PlayFabSDK from 'playfab-sdk'
import PlayFab from "./PlayFabClientApi";
//const PlayFabClient = PlayFabSDK.PlayFabClient;


//import * as PlayFabSDK from 'playfab-sdk'
//export const PlayFab = PlayFabSDK.PlayFab
//const PlayFabClient = PlayFabSDK.PlayFabClient;
const PlayFabClient = PlayFab.ClientApi;


let SpecificRevision = undefined;
const setSpecificRevision = (specificRevision) => {
    if(!specificRevision) return;
    SpecificRevision = specificRevision;
}
const c = (resolve, reject) => {
    return (result, error) => {
        if(error){
            log("PlayFab Error", error);
            reject(error)
        }else{
            resolve(result.data);
        }
    }
}
let catalog:CatalogItem[] | undefined = undefined;

const getCatalog = async () => {
    if(!catalog) {
        catalog = (await GetCatalogItems({})).Catalog;
    }
    return catalog;
};
/*
const getItemInfo = async ({ItemId}) => {
    const catalog = await getCatalog();
    return catalog!.find(i=>i.ItemId === ItemId)
}*/

const LoginWithCustomID = (request:LoginWithCustomIDRequest):Promise<LoginResult> => {
    PlayFab.settings.titleId = request.TitleId as string;
    log("PlayFabSDK.LoginWithCustomID " + PlayFab.settings.titleId)
    return new Promise((resolve, reject)=>{
        PlayFabClient.LoginWithCustomID(request, c(async (...args)=>{    
            //TODO REVIEW: if we get catalog, we should get also title info, etc. or nothing at all        
            catalog = (await GetCatalogItems({})).Catalog;
            resolve(...args);
        }, reject))
    });
};

const GetCatalogItems = (request:GetCatalogItemsRequest):Promise<GetCatalogItemsResult> => {
    return new Promise((resolve, reject)=>{
        PlayFabClient.GetCatalogItems(request, c(resolve, reject))
    });
}

const UpdateUserData = (request:UpdateUserDataRequest):Promise<UpdateUserDataResult> => {
    return new Promise((resolve, reject)=>{
        PlayFabClient.UpdateUserData(request, c(resolve, reject))
    });
};
const GetUserInventory = (request:GetUserInventoryRequest):Promise<GetUserInventoryResult> => {
    return new Promise((resolve, reject)=>{
        PlayFabClient.GetUserInventory(request, c(resolve, reject))
    });
};
const ExecuteCloudScript = (request:ExecuteCloudScriptRequest):Promise<ExecuteCloudScriptResult> => {
    return new Promise((resolve, reject)=>{
        PlayFabClient.ExecuteCloudScript({...request, SpecificRevision}, c(resolve, reject))
    });
}

const GetPlayerCombinedInfo = (request:GetPlayerCombinedInfoRequest):Promise<GetPlayerCombinedInfoResult> => {
    return new Promise((resolve, reject)=>{
        PlayFabClient.GetPlayerCombinedInfo(request, c(resolve, reject))
    });
};

const GetPlayerStatistics = (request:GetPlayerStatisticsRequest):Promise<GetPlayerStatisticsResult> => {
    return new Promise((resolve, reject)=>{
        PlayFabClient.GetPlayerStatistics(request, c(resolve, reject))
    })
}

const GetLeaderboard = (request:GetLeaderboardRequest):Promise<GetLeaderboardResult> => {
    return new Promise((resolve, reject)=>{
        PlayFabClient.GetLeaderboard(request, c(resolve, reject))
    })
}

const UpdateUserTitleDisplayName = (request:UpdateUserTitleDisplayNameRequest):Promise<UpdateUserTitleDisplayNameResult> => {
    return new Promise((resolve, reject)=>{
        PlayFabClient.UpdateUserTitleDisplayName(request, c(resolve, reject))
    });
}

export {
    LoginWithCustomID,
    UpdateUserData,
    GetUserInventory,
    ExecuteCloudScript,    
    GetPlayerCombinedInfo,
    GetPlayerStatistics,
    GetLeaderboard,
    UpdateUserTitleDisplayName,

    setSpecificRevision,
    getCatalog
    //getItemInfo,
}
