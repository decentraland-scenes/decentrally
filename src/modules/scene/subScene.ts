import { movePlayerTo } from '@decentraland/RestrictedActions'
import * as utils from '@dcl/ecs-scene-utils'
import { POISelectorType, SpawnPoint } from './types'
//import { nftCollection, Painting } from './nfts'
import { scene, player } from "../scene";

/*
per nico
  adding/removing to engine can be slower
    "after running some tests measuring hiccups in different scenarios, turns out that making entities invisible rather than removing them from the engine is a lot more efficient"
  
    it causes less hiccups and also the entities show a lot faster like this
    and I suppose we’d also avoid the issue that you reported with entities not appearing (I wasn’t able to reproduce that w my tests, though)
      it implies slightly more loading at the very beginning, but not too significant


    trade off are SHAPE_SHOW_HIDE still has active colliders
  
*/
export enum VisibilityStrategyEnum {
  ENGINE_ADD_REMOVE ,
  SHAPE_SHOW_HIDE ,
  MOVE_TO_VAULT
}

const VAULT = new Transform({
  position:new Vector3(24,3,24), //where no one can walk
  scale: new Vector3(0,0,0) // not visible
})

/*
export class ShowActionHandlerSupport<T> implements ShowActionHandler<T>{
  name:string
  callbacks:OnProcessListener<ActionParams<T>>[]
  constructor(name:string,args:ShowActionSupportArgs<T>){
    if(args && args.matches) this.matches = args.matches 
    //if(args && args.execute) this.execute = args.execute 
    this.name = name
    if(args && args.name) this.name = args.name
    if(args && args.decodeAction) this.decodeAction = args.decodeAction
    if(args && args.process) this.process = args.process
  }
  getName(){ return this.name}
  addOnProcessListener(listener:OnProcessListener<ActionParams<T>>){
    if(!this.callbacks) this.callbacks = []
    this.callbacks.push(listener)
  }
*/

export type EntityWrapperArgs={
  //matches?(action: string,showActionMgr:ShowActionManager):boolean,

  //onShow?(scene:SubScene):void,
  //onHide?(scene:SubScene):void,
  //hide?():void,
  onChangeEntityVisibility?(entity:EntityWrapper,type:VisibleChangeType):void

  visibilityStrategy?:VisibilityStrategyEnum

  onInit?(entity:SceneEntity):void

}
export type SceneEntityArgs = EntityWrapperArgs & {
  onInit?(entity:SceneEntity,scene:SubScene):void,
}
export class EntityWrapper{
  visible:boolean
  entity:Entity
  entities:Entity[]
  visibilityStrategy?:VisibilityStrategyEnum
  name:string 
  visibleTransformInfo?:Transform //if vault hide/showing
  initAlready:boolean
  
  constructor(name:string,entity?:Entity|Entity[],args?:EntityWrapperArgs){
    this.name = name

    this.setEntity(entity)

    if(args && args.visibilityStrategy) this.visibilityStrategy = args.visibilityStrategy 
    if(args && args.onInit) this.onInit = args.onInit 
  }

  setEntity(entity?:Entity|Entity[]){
    if(Array.isArray(entity)){
      //const ent:Entity = entity as Entity
      this.entity = entity[0]
      this.entities = entity
    }else if(entity !== undefined){
      this.entity = entity
      this.entities = []
      this.entities.push( entity )
    }
  }

  init(){
    if(this.initAlready) return false;
  
    this.initAlready = true

    log("ent.checking onInit!!!",this.name)
 
    if(this.entity){
      this.visible = this.isEntityVisible( this.entity )
    }

    if(this.onInit !== undefined){ 
      log("calling onInit!!!",this.name)
      this.onInit(this)
    }  


    return true;
  }
   
 
  onInit(entity:EntityWrapper) {}

  onChangeEntityVisibility(entity:EntityWrapper,type:VisibleChangeType){ }
  
  
  show(force?:boolean){ 
    //log("called show on",this.name,this.entities.length,this.visible)

    const forceIt = (force !== undefined && force )
    if(!forceIt && this.visible){
      log("show() already visible",this.entity?.name)
      return;
    }

    this.visible = true

    const entity = this.entity

    //if(this.name == 'closestTrack.debugUI') debugger
    
    this.showEntity(entity)

    if(this.entities){
      for(const p in this.entities){
        this.showEntity(this.entities[p])
      }
    }

    this.onChangeEntityVisibility(this,'show')
  } 
 
  hide(force?:boolean,_strategy?:VisibilityStrategyEnum){
    log("called hide on",this.name,"force",force,"strategy",_strategy,"entity.length",this.entities.length)

    if((force === undefined || !force ) && !this.visible){
      log("hide() already hidden",this.entity?.name)
      return;
    }

    this.visible = false

    const entity = this.entity
    
    this.hideEntity(entity,_strategy)

    if(this.entities){
      for(const p in this.entities){
        this.hideEntity(this.entities[p],_strategy)
      }
    }

    this.onChangeEntityVisibility(this,'hide')
  }

  restoreVisibleTransformInfo(){
    const transform = this.visibleTransformInfo
    if (transform !== undefined) {
      this.entity.addComponentOrReplace(transform)
    }
  }
  
  private isEntityVisible(entity:Entity){
    let retVal = false
    if( this.visibilityStrategy == VisibilityStrategyEnum.SHAPE_SHOW_HIDE){
      if (entity.hasComponent('engine.shape')) {
        retVal = entity.getComponent('engine.shape').visible
      }
    }else{
      retVal = (entity && !entity.alive)
    }
    return retVal
  }
  private showEntity(entity:Entity,_strategy?:VisibilityStrategyEnum){
    if(!entity) return

    if( this.visibilityStrategy == VisibilityStrategyEnum.SHAPE_SHOW_HIDE){
      if (entity.hasComponent('engine.shape')) {
        entity.getComponent('engine.shape').visible = true
        entity.getComponent('engine.shape').withCollisions = true
      }
      const transform = this.visibleTransformInfo
      if (transform !== undefined) {
        entity.addComponentOrReplace(transform)
      } 
    }else{
      if (entity && !entity.alive) {
        engine.addEntity(entity)
      }
    }
  }
  private isTransformVaultLocation(tf:Transform){
    return tf !== VAULT 
      || 
      (tf.position.equals(VAULT.position) && tf.scale.equals(VAULT.scale)) //&& tf.position.equals(VAULT.position)
  }
  private vaultCopy(){
    return new Transform( {
      position: VAULT.position.clone(),
      scale: VAULT.scale.clone()
    } )
  }
  private hideEntity(entity:Entity,_strategy?:VisibilityStrategyEnum){
    if(!entity) return

    const strategy = _strategy !== undefined ? _strategy : this.visibilityStrategy

    if( strategy == VisibilityStrategyEnum.SHAPE_SHOW_HIDE){
      if (entity.hasComponent('engine.shape')) {
        log("hide.visible ",entity.name)
        entity.getComponent('engine.shape').visible = false
        entity.getComponent('engine.shape').withCollisions = false
      }
      if (entity.hasComponent(Transform)) {
        const tf = entity.getComponent(Transform);
        if( !this.isTransformVaultLocation(tf)){
          //FIXME this is a work around, if need to preserve position over time (moveUtils etc) this wont work
          this.visibleTransformInfo = entity.getComponent(Transform)
          entity.addComponentOrReplace( this.vaultCopy() )
        }
      }
    }else if( strategy == VisibilityStrategyEnum.MOVE_TO_VAULT){
      if (entity.hasComponent(Transform)) {
        const tf = entity.getComponent(Transform);
        if( !this.isTransformVaultLocation(tf) ){
          //FIXME this is a work around, if need to preserve position over time (moveUtils etc) this wont work
          this.visibleTransformInfo = entity.getComponent(Transform)
          entity.addComponentOrReplace( this.vaultCopy() )
        }
      }
    }else{
      if (entity && entity.alive) {
        log("hide.removing ",entity.name)
        engine.removeEntity(entity)
      }
    }
  }

}
export class SceneEntity extends EntityWrapper{
  //entity:Entity
  //visibilityStrategy?:VisibilityStrategyEnum
  //name:string 
  //visibleTransformInfo?:Transform //if vault hide/showing
  //initAlready:boolean
  
  constructor(name:string,entity:Entity|Entity[],args?:SceneEntityArgs){
    super(name,entity,args)

    if(args && args.onInit) this.onInit = args.onInit 
  }

  init(scene?:SubScene):boolean{
    if(this.initAlready) return false;
  
    this.initAlready = true

    log("ent.checking onInit!!!",this.name)
 
    if(this.onInit !== undefined){ 
      log("calling onInit!!!",this.name)
      this.onInit(this,scene)
    }  


    return true;
  }
  

  onInit(entity:SceneEntity,scene?:SubScene) {}
  //onShow() {}
  //onHide() {}

}

export type VisibleChangeType = 'show'|'hide'

//FIXME do not extend Entity
export class SubScene {
  public rootEntity: Entity //if hierarchical
  public initAlready:boolean = false
  public entities: SceneEntity[] // CONSIDER turn to record for instant lookup by name?
  public id: number
  public name: string
  public visible: boolean = false
  public spawnPoints:SpawnPoint[]=[]
  visibilityStrategy:VisibilityStrategyEnum = VisibilityStrategyEnum.SHAPE_SHOW_HIDE

  onInit(scene:SubScene){}
  onShow(scene:SubScene){}
  onHide(scene:SubScene){}
  overrideHide(entity:SceneEntity,type:VisibleChangeType){}
  
  visibleTransformInfo:Record<string,Transform> = {}

  constructor(
    id: number,
    name: string,
    entities: SceneEntity[]/*,
    triggerPosition?: Vector3,
    triggerSize?: Vector3*/
    
  ) {
    //super(name)

    log("constructor",id,name,entities)

    //engine.addEntity(this)

    
    this.id = id
    this.entities = entities
  
    /*if(triggerPosition !== undefined){
      let triggerBox = new utils.TriggerBoxShape(triggerSize, triggerPosition)
      this.addComponent(
        new utils.TriggerComponent(triggerBox, {
          onCameraEnter: () => {
            this.show()
          },
          onCameraExit: () => {
            this.hide()
          },
          // uncomment the line below to see the areas covered by the trigger areas
          // enableDebug: true,
        }) 
      )
    }*/
  }
 
  addEntity(sceneEnt:SceneEntity|Entity){
    if(sceneEnt instanceof SceneEntity){
      this.entities.push(sceneEnt)
    }else{
      this.entities.push( new SceneEntity(sceneEnt.name,sceneEnt) )
    }
  }

  init():boolean{
    if(this.initAlready) return false;

    this.initAlready = true


    if(this.onInit !== undefined){ 
      log("calling onInit!!!",this.id,this.name)
      this.onInit(this)
    }  
 
    this.entities.forEach((entity) => {
      entity.init(this)
    })


    return true;
  }

  randomSpawnPoint(spawnPointFilter?:POISelectorType){

    let list = this.spawnPoints
    
    if(spawnPointFilter !== undefined){
      list = list.filter(function(item) {
        return item.type === spawnPointFilter.type;
      });
    }

    log("randomSpawnPoint ",spawnPointFilter,list)

    let spawnPoint = list[ Math.floor( Math.random() * list.length ) ]

    return spawnPoint
  }

  movePlayerHere(spawnPointFilter?:POISelectorType|SpawnPoint){
    return new Promise((resolve, reject) => {
      //log("(spawnPointFilter as POISelectorType).type",(spawnPointFilter as POISelectorType).type,spawnPointFilter)

      let position:Vector3
      let cameraLook:Vector3
      if((spawnPointFilter !== undefined && (spawnPointFilter as POISelectorType).type)){
        const spawnPoint = this.randomSpawnPoint(spawnPointFilter as POISelectorType)
 
        if(!spawnPoint){
          log(this.name+".movePlayerHere no spawnPoints. not moving player",this.spawnPoints)
          resolve()
          return
        }
        position = spawnPoint.position.toCenterVector3()
        cameraLook = spawnPoint.cameraLookAt
      }else if(spawnPointFilter !== undefined && spawnPointFilter instanceof SpawnPoint){
        position = spawnPointFilter.position.toCenterVector3()
        cameraLook = spawnPointFilter.cameraLookAt
      }else{
        log(this.name+".movePlayerHere type not recognized spawnPointFilter. not moving player",spawnPointFilter)
          resolve()
          return
      }

      movePlayerTo(position,cameraLook).then(
        ()=>{
          log("player move to scene " ,this.name , "@",position, " complete")
          resolve()
        }
      ).catch(
        (reason:any)=>{
          log("player move to scene " ,this.name , "@",position, " FAILED",reason)
          reject(reason)
        }
      )
    });
  }
  
  
  isVisible(){
    return this.visible
  }

  show(force?:boolean) {
    if(!this.initAlready) this.init()
    
    if((force === undefined || !force ) && this.visible){
      log("show() already hidden",this.name)
      return;
    }

    this.visible = true
    this.entities.forEach((entity) => {
      entity.show()
    })


    if(this.onShow !== undefined){ 
      log("calling onShow!!!",this.id,this.name)
      this.onShow(this)
    }  
  }

  hide(force?:boolean) {
    if((force === undefined || !force ) && !this.visible){
      log("hide() already hidden",this.name)
      return;
    } 

    this.visible = false
    this.entities.forEach((entity) => {

      const handled = false
      //if(this.overrideHide !== undefined){

      //}
      if(!handled){
        entity.hide(force)
      }
    })

    if(this.onHide !== undefined){ 
      log("calling onHide!!!",this.id,this.name)
      this.onHide(this)
    }  
  }
}