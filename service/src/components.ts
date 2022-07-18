import path from 'path'
//import { createDotEnvConfigComponent } from "@well-known-components/env-config-provider"
import { createServerComponent, createStatusCheckComponent, IHttpServerOptions } from "@well-known-components/http-server"
import { createLogComponent } from "@well-known-components/logger"
import { createFetchComponent } from "./ports/fetch"
import { createMetricsComponent } from "@well-known-components/metrics"
import { AppComponents, GlobalContext } from "./types"
import { metricDeclarations } from "./metrics"
import { createDotEnvConfigComponent } from "./config/custom-env-config-provider"
import { createFireStoreComponent } from "./firebase"

// Initialize all the components of the app
export async function initComponents(): Promise<AppComponents> {
  const envPort = process.env.PORT

  //process.env.HTTP_SERVER_PORT = process.env.PORT

  const config = await createDotEnvConfigComponent({ path: [".env.default", ".env"], debug:false })
  
  const serverOptions:Partial<IHttpServerOptions> = {}
  serverOptions.cors = {origin: await config.getString("cors.origin") === 'true'}
  
  //TODO add flag to dump
  //console.log("config",config,serverOptions)
  
  if(envPort){
    console.log("using process.env.PORT",envPort,"over",process.env.PORT)
    config.setString("HTTP_SERVER_PORT",envPort)
  }


  const dbConnString = await config.getString("PG_COMPONENT_PSQL_CONNECTION_STRING")
  //console.log("checking PG_COMPONENT_PSQL_CONNECTION_STRING")
  console.log("PG_COMPONENT_PSQL_CONNECTION_STRING...",dbConnString)

  
  const logs = createLogComponent()
  const server = await createServerComponent<GlobalContext>({ config, logs }, serverOptions)
  const statusChecks = await createStatusCheckComponent({ server, config })
  const fetch = await createFetchComponent()
  const metrics = await createMetricsComponent(metricDeclarations, { server, config })
    
  const firebase = await createFireStoreComponent({ config, logs, metrics })

  return {
    config,
    logs,
    server,
    statusChecks,
    fetch,
    metrics
    //,database
    ,firebase
  }
}
