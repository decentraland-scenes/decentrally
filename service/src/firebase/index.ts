import { IBaseComponent, IConfigComponent, ILoggerComponent, IDatabase } from "@well-known-components/interfaces"
//import { Client, Pool, PoolConfig } from "pg"
//import QueryStream from "pg-query-stream"
//import { SQLStatement } from "sql-template-strings"
//import { setTimeout } from "timers/promises"
import { runReportingQueryDurationMetric } from "./utils"
import { IFireStoreComponent, IMetricsComponent } from "./types"

import admin /*, { Request, Response }*/ from 'firebase-admin'

export * from "./types"
export * from "./metrics"

class FirestoreComponent implements IFireStoreComponent{
  serviceAccount:ServiceAccount
  db?:admin.firestore.Firestore
  started:boolean = false

  constructor(serviceAccount:ServiceAccount){
    this.serviceAccount = serviceAccount
  }
  


  async start(): Promise<void> {
    
    //console.log("FirestoreComponent start called with ",this.serviceAccount)
    
    console.log("FirestoreComponent start initializeApp...")
    admin.initializeApp({
      credential: admin.credential.cert( this.serviceAccount ) //firebase login credentials
    })
    console.log("FirestoreComponent start initializeApp...done")

    console.log("FirestoreComponent start firestore...",this.serviceAccount.project_id)
    this.db = admin.firestore()
    console.log("FirestoreComponent start firestore...done",this.serviceAccount.project_id)

    this.started = true
  }
  query<T>(sql: string): Promise<IDatabase.IQueryResult<T>>
  query<T>(sql: any, durationQueryNameLabel?: any): Promise<IDatabase.IQueryResult<T>> | Promise<IDatabase.IQueryResult<T>> {
    throw new Error("Method not implemented.")
  }
  getDb(): admin.firestore.Firestore {
    if(!this.db){ throw new Error("db not initialized")}
    return this.db
  }
  async stop(): Promise<void> {
    
  }
  
}

type ServiceAccount={
  projectId?:string
  privateKey?:string
  clientEmail?:string

  type?:string
  project_id?:string
  private_key_id?:string
  private_key?:string
  client_email?:string
  client_id?:string
  auth_uri?:string
  token_uri?:string
  auth_provider_x509_cert_url?:string
  client_x509_cert_url?:string

}
/**
 * Query a Firebase (https://www.postgresql.org) database with ease.
 * It uses a pool behind the scenes and will try to gracefully close it after finishing the connection.
 * @public
 */
export async function createFireStoreComponent(
  components: createFireStoreComponent.NeededComponents
  //,options?: PoolConfig
): Promise<IFireStoreComponent & IBaseComponent> {
  const { config, logs } = components
  const logger = logs.getLogger("firestore-component")

  console.log("createFireStoreComponent called")
  console.log("createFireStoreComponent called")
  console.log("createFireStoreComponent called")
  logger.log("createFireStoreComponent called")
  logger.log("createFireStoreComponent called")
  logger.log("createFireStoreComponent called")
  

  logger.log("createFireStoreComponent getting config...")
  // Environment
  const [jsonStr,type,projectId,privateKeyId,privateKey,clientEmail,clientId,authUri,tokenUri,authCertUrl,clientCertUrl] = await Promise.all([
    config.getString("FIREBASE_JSON"),
    config.getString("FIREBASE_TYPE"),
    config.getString("FIREBASE_PROJECT_ID"),
    config.getString("FIREBASE_PRIVATE_KEY_ID"),
    config.getString("FIREBASE_PRIVATE_KEY"),
    config.getString("FIREBASE_CLIENT_EMAIL"),
    
    config.getString("FIREBASE_CLIENT_ID"),
    config.getString("FIREBASE_AUTH_URI"),
    config.getString("FIREBASE_TOKEN_URI"),
    config.getString("FIREBASE_AUTH_PROVIDER_CERT_URL"),
    config.getString("FIREBASE_CLIENT_PROVIDER_CERT_URL"),
    
  ])   
  logger.log("createFireStoreComponent getting config...done")
  //logger.log("createFireStoreComponent getting config...jsonStr-"+jsonStr)

  let privateKeyParsed = privateKey
  
  
  /*
  console.log("parse key",privateKey && privateKey.indexOf("\\n") >= 0)
  console.log("parse key",privateKey && privateKey.indexOf("\\n") >= 0)
  console.log("parse key",privateKey && privateKey.indexOf("\\n") >= 0)
  console.log("parse key",privateKey && privateKey.indexOf("\\n") >= 0)
  */

  let json

  if(jsonStr){
    console.log("createFireStoreComponent using jsonString: ", jsonStr.substring(0,60))
    json = JSON.parse(jsonStr)
  }
  if(privateKey && privateKey.indexOf("\\n") >= 0){
    console.log("createFireStoreComponent using privateKeyParsed ")
    //to handle new lines so it is a propery formatted PEM
    privateKeyParsed = JSON.parse('"'+privateKey+'"')
  }

    
  const serviceAccount:ServiceAccount = json ? json : {
    type:type,
    project_id: projectId,
    private_key: privateKeyParsed,
    client_email: clientEmail,
    client_id:clientId,
    auth_uri:authUri,
    token_uri:tokenUri,
    auth_provider_x509_cert_url:authCertUrl,
    client_x509_cert_url:clientCertUrl
  }
  const comp = new FirestoreComponent( serviceAccount )
  
  return comp
}

/**
 * @public
 */
export namespace createFireStoreComponent {
  export type NeededComponents = {
    logs: ILoggerComponent
    config: IConfigComponent
    metrics: IMetricsComponent
  }
}
