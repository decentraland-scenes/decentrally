import { v4 as uuidv4 } from 'uuid';
import * as dcl from 'decentraland-crypto-middleware'
import { AppComponents, HandlerContextWithPath } from "../../types"
import { IHttpServerComponent } from '@well-known-components/interfaces';


// handlers arguments only type what they need, to make unit testing easier
export async function verify
  //(ctx: any)  { //FIXME HAD TO use 'any' TO AVOID SYNTAX ERROR
  (ctx: { verification?: dcl.DecentralandSignatureData<{}> } ) { //FIXME HAD TO COMMENT OUT TO AVOID SYNTAX ERROR
  if(!ctx.verification){
    throw Error("ctx.verification is required")
  }
  const address: string = ctx.verification.auth
  const metadata: Record<string, any> = ctx.verification.authMetadata
  console.log('/user/required',address)
  //{ valid: true, message: 'Valid request' }
  return {
    status: 200,
    body: { valid: true, message: 'Valid request' }
  }
}

const STUDIO_ID = 'dcl-content-team'
const PG_TABLE_PLAYFAB_CUSTOM_ID = "playfab_customid"

type TablePlayfabCustomidType={
  id:any
  user_address:string
  original_custom_id:string
  custom_id:string
  created_at:any
  updated_at:any
}

export async function playerAuthHandler
  (ctx: {request: IHttpServerComponent.IRequest;url: URL,verification?: dcl.DecentralandSignatureData<{}>,components: Pick<AppComponents,"firebase"|"metrics"|"config">}) {
  const METHOD_NAME = "playerAuthHandler"
  const provider = ctx.url.searchParams.get("provider")
  const defaultProvider = await ctx.components.config.getString("DEFAULT_PERSISTENCE_PROVIDER")

  const providerToUse = provider ? provider : defaultProvider ? defaultProvider : "fs"


  console.log(METHOD_NAME,"using ",provider,defaultProvider,providerToUse)

  //if((providerToUse && (providerToUse.toLowerCase() == 'pg'||providerToUse.toLowerCase() == 'postgres'))){
  //  return playerAuthHandlerPG(ctx)
  //  console.log(METHOD_NAME,"using ","postgres",provider)
  //}else{
    console.log(METHOD_NAME,"using ","firestore",provider)
    return playerAuthHandlerFB(ctx)
  //}
  
}
// handlers arguments only type what they need, to make unit testing easier
export async function playerAuthHandlerFB
  (ctx: { request: IHttpServerComponent.IRequest;url: URL,verification?: dcl.DecentralandSignatureData<{}>,components: Pick<AppComponents,"firebase"|"metrics">} ) { //
    
  if(!ctx.verification){
    throw Error("ctx.verification is required")
  }
  const address: string = ctx.verification.auth
  const metadata: Record<string, any> = ctx.verification.authMetadata
  console.log('playerAuthHandlerFB',address)

  let uuid=undefined

  
  const db = ctx.components.firebase.getDb()

  const dbCollection = db.collection("user-custom-id")
  const userDocRef = dbCollection.where("userId","==",address.toLowerCase())
  
  
  
  try {
    await db.runTransaction( async (transaction) => {
      const queryResult = await transaction.get(userDocRef);
      console.log("found:",queryResult.size)

      //customId: crypto.randomUUID() was giving  "ReferenceError: crypto is not defined" on server only worked locally
      //switching to well known library
      const nextRandomUUID = uuidv4();

      if(queryResult.size > 0){
        const doc = queryResult.docs[0]
        console.log("found row",doc.data())
        uuid = doc.data().originalCustomId
        transaction.update(doc.ref, 
          { 
            customId: nextRandomUUID,
            lastUpdateDate: Date.now()  
          } );
      }else{
        uuid = nextRandomUUID
        const newDoc = {
          customId: uuid,
          originalCustomId: uuid,
          userId: address,
          createDate: Date.now()
        }
        console.log("inserting row",newDoc)
        db.collection("user-custom-id").add( newDoc ) 
      }
    });
    console.log("Transaction successfully committed!");
  } catch (e) {
    console.log("Transaction failed: ", e);
  }
  
  //{ valid: true, message: 'Valid request' }
  return {
    status: 200,
    body: { valid: true, message: 'Valid request', data: {uuid: uuid} }
  }
  
}



      /*
      //for(const sfDoc of queryResult.docs){
        if (!sfDoc.exists()) {
          throw "Document does not exist!";
        }
    
        //const newPopulation = sfDoc.data().population + 1;
        //transaction.update(sfDocRef, { population: newPopulation });
      }*/