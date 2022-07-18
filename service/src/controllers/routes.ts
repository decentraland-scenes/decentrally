import { Router } from "@well-known-components/http-server"
import { AppComponents, BaseComponents, GlobalContext } from "../types"
import { pingHandler } from "./handlers/ping-handler"
import * as dcl from 'decentraland-crypto-middleware'
import * as crypto from "crypto";
import {   playerAuthHandler,  verify } from "./handlers/playerAuthHandler";
import { CustIConfigComponent } from "../config/custom-env-config-provider";
import { IHttpServerComponent } from "@well-known-components/interfaces";
//import admin /*, { Request, Response }*/ from 'firebase-admin'
//import { runTransaction } from "@firebase/firestore"//client

// We want all signatures to be "current". We consider "current" to be the current time,
// with a 10 minute tolerance to account for network delays and possibly unsynched clocks
export const VALID_SIGNATURE_TOLERANCE_INTERVAL_MS = 10 * 1000 * 60

// We return the entire router because it will be easier to test than a whole server
export async function setupRouter(globalContext: GlobalContext): Promise<Router<GlobalContext>> {
  console.log("setupRouter ENTRY")
  const router = new Router<GlobalContext>()

  router.use('/check-validity', dcl.wellKnownComponents( { expiration: VALID_SIGNATURE_TOLERANCE_INTERVAL_MS } ))
  router.use('/player/auth', dcl.wellKnownComponents( { expiration: VALID_SIGNATURE_TOLERANCE_INTERVAL_MS } ))
  
  router.get('/check-validity', verify)

  router.get('/player/auth', playerAuthHandler)

  router.get('/env', env)

  router.get('/request/info', requestInfo)

  router.get('/asd:userId', test)

  router.get("/ping", pingHandler)

  


  router.get("/hello", async ctx =>{
    return {  
      status:200,
      body:"hix"
    }
  })


  console.log("setupRouter EXIT")
  return router
}

// handlers arguments only type what they need, to make unit testing easier
export async function requestInfo(ctx: {request: IHttpServerComponent.IRequest;url: URL}) {
  return {
    body: {
      url: ctx.url,
      urlJson: JSON.stringify(ctx.url),
      urlSearchParams: ctx.url.searchParams,
      urlSearchParamsToString: ctx.url.searchParams.toString(),
      urlSearchParamsQ: ctx.url.searchParams.get('q'),
      urlSearchParamsQAll: ctx.url.searchParams.getAll('q')
    }
  }
}

export async function env
  (ctx: { components: Pick<AppComponents,"config"|"metrics">} ) { 
 
  const config:CustIConfigComponent = ctx.components.config as CustIConfigComponent
  
  const whiteList:Record<string,string> = {}
  whiteList["stackName"]="y"
  whiteList["environment"]="y"
  whiteList["ADMIN_ENABLED"]="y"
  whiteList["ADMIN_REQUIRE_SIGNED"]="y"
  whiteList["ADMIN_REQUIRE_SECRET_KEY"]="y"
  whiteList["cors.origin"]="y"
  

  const outputMap:Record<string,string> = {}

  for(const p in config.optionMap){
    const val = config.optionMap[p]
    outputMap[p] = val !== undefined ? "****" : ""
    
    if(whiteList[p] !== undefined && val !== undefined){
      outputMap[p] = val
    }
  }

  return {
    body: {
      config: outputMap
    }
  }
}

// handlers arguments only type what they need, to make unit testing easier
export async function test(ctx: {params: {userId:string}}) {
 
  return {
    body: "xxx",
  }
}

