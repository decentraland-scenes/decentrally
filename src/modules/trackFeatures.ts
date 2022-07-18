import * as utils from '@dcl/ecs-scene-utils'
import { CONFIG } from "src/config";
import { getOrCreateGLTFShape, getOrCreateMaterial } from 'src/resources/common';
import { Level, levelManager } from "../tracks/levelManager";
import * as serverSpec from './connection/state/server-state-spec';
import { player, scene } from "./scene";
import { SceneEntity, VisibleChangeType } from './scene/subScene';
import { AbstractMoveWithWorldSpawner, AbstractSpawner } from "./spawner";
import { GAME_STATE } from "./state";
import { themeControl, ThemeTrackFeature } from "./themeData";
import { distance, realDistance, ToDegrees } from "./utilities";



let trackRadius = 4

const trackSpacing = 2

export type TrackFeatureShapeConstructorArgs = {
  transform?: Transform//optional, if set its the exact transform
  model?: string
}

export class TrackFeatureShape {
  transform?: Transform//optional, if set its the exact transform
  model?: string
  //entity:Entity

  constructor(args: TrackFeatureShapeConstructorArgs) {
    this.transform = args.transform
    this.model = args.model
  }
}


/**
 * inert can be background imagery that does nothing
 **/

export type TrackFeatureConstructorArgs = serverSpec.TrackFeatureConstructorArgs & {
  triggerSize?: Vector3
  shape?: TrackFeatureShape
  activateTime?: number
}

//TODO move somewhere else? constants?
const Vector3Two = new Vector3(2, 2, 2)

export class TrackFeature {
  name: string
  position: serverSpec.TrackFeaturePosition
  triggerSize: Vector3
  //if we compute distance get half distance from center
  triggerSizeHalved: Vector3
  shape: TrackFeatureShape
  type: serverSpec.TrackFeatureType = 'inert'
  activateTime: number = 0

  constructor(args: TrackFeatureConstructorArgs) {
    this.name = args.name
    this.position = args.position
    this.shape = args.shape
    this.type = args.type
    //this.triggerSize = args.triggerSize
    this.setTriggerSize(args.triggerSize)
    this.activateTime = args.activateTime

  }

  setTriggerSize(size: Vector3) {
    this.triggerSize = size
    if (size) {
      this.triggerSizeHalved = size.divide(Vector3Two)
    } else {
      this.triggerSizeHalved
    }
  }
  clone() {
    const copy = new TrackFeature(this.getArgs())
    return copy
  }

  getArgs(): TrackFeatureConstructorArgs {
    return { name: this.name, type: this.type, shape: this.shape, position: this.position, triggerSize: this.triggerSize, activateTime: this.activateTime }
  }
}

//TODO move to a factory object
export function createTrackFeatureComponentFrom(trackFeat: TrackFeature): TrackFeatureComponent {
  return new TrackFeatureComponent(trackFeat.getArgs())
}

/**
 * inert can be background imagery that does nothing
 **/

@Component("trackFeatureComponent")
export class TrackFeatureComponent extends TrackFeature {
  //FIXME this is ugly. how can i make scene ents aviaible but not on the component?
  sceneEnts: SceneEntity[]//
  handler: SegmentChangeHandler

  //TEMP
  textShape: TextShape

  constructor(args: TrackFeatureConstructorArgs) {
    super(args)
  }
  addEntity(sceneEnt: SceneEntity) {
    if (!this.sceneEnts) this.sceneEnts = []
    this.sceneEnts.push(sceneEnt)
  }
  removeAllEntities() {
    this.sceneEnts = []
  }


}

@Component("FeatureTriggerComponent")
export class FeatureTriggerComponent {
  /**
   * Is the trigger enabled? If false, the associated functions aren't triggered.
   */
   enabled: boolean = true
   /**
    * shape of the collider
    */
   //shape: TriggerBoxShape | TriggerSphereShape
   /**
    * bit layer of the Tigger (usefull to discriminate between trigger events)
    */
   layer: number = 0
   /**
    * against which layer are we going to check trigger's collisions
    */
   triggeredByLayer: number = 0
   /**
    * callback when trigger is entered
    */
   //onTriggerEnter?: (entity: Entity) => void
   /**
    * callback when trigger is exit
    */
   //onTriggerExit?: (entity: Entity) => void
   /**
    * callback when trigger is entered
    */
   onCameraEnter?: () => void
   /**
    * callback when trigger is exit
    */
   onCameraExit?: () => void
   /**
    * get if debug is enabled
    */
   get debugEnabled(): boolean {
     return this._debugEnabled
   }
 
   private _debugEnabled: boolean = false
 
   //purposly mirroring https://github.com/decentraland/decentraland-ecs-utils/blob/master/src/triggers/triggerSystem.ts
   //only supporting a subset but want easy swap back ability in the code so keeping class signature matching
   /**
    * @param shape - shape of the triggering collider area
    * @param data - An object with additional parameters for the trigger component
    */
   constructor(shape: utils.TriggerBoxShape | utils.TriggerSphereShape, data?: utils.TriggerData) {
    TrackFeatureTriggerSystem.createAndAddToEngine()
     //this.shape = shape
     if (data) {
       //if (data.layer) this.layer = data.layer
       //if (data.triggeredByLayer) this.triggeredByLayer = data.triggeredByLayer
       //if (data.onTriggerEnter) this.onTriggerEnter = data.onTriggerEnter
       //if (data.onTriggerExit) this.onTriggerExit = data.onTriggerExit
       if (data.onCameraEnter) this.onCameraEnter = data.onCameraEnter
       if (data.onCameraExit) this.onCameraExit = data.onCameraExit
       if (data.enableDebug) this._debugEnabled = data.enableDebug
     }
   }
}

export type SegmentChangeHandler = (trackFeat: TrackFeatureComponent, type: VisibleChangeType, oldSeg: number, newSeg: number) => void

/**
 * utils.TriggerComponent works but might be a little heavy?  created a much simpler version of it for specific needs here 
 * purposly mirroring https://github.com/decentraland/decentraland-ecs-utils/blob/master/src/triggers/triggerSystem.ts
 */
export class TrackFeatureTriggerSystem implements ISystem {
  private static _instance: TrackFeatureTriggerSystem | null = null
  group = engine.getComponentGroup(TrackFeatureComponent,FeatureTriggerComponent)

  protected _collidingWith: Record<string, TrackFeatureComponent> = {}

  static createAndAddToEngine(): TrackFeatureTriggerSystem {
    if (this._instance == null) {
      this._instance = new TrackFeatureTriggerSystem()
      engine.addSystem(this._instance)
    }
    return this._instance
  }

  update(dt: number) {
    for (let entity of this.group.entities) {
      let transform = entity.getComponent(Transform)
      let trackFeatComp = entity.getComponent(TrackFeatureComponent)
      let trackFeatTriggerComp = entity.getComponent(FeatureTriggerComponent)
      
      if(!trackFeatTriggerComp.enabled){
        log("trackfeature","not enabled skipping",trackFeatComp.name)
      }
      if(!entity.alive){
        log("trackfeature","not alive skipping",trackFeatComp.name)
        continue
      }
      if(!entity.hasComponent(Transform)){
        log("trackfeature","missing transform skipping",trackFeatComp.name)
        continue
      }
      //if(trackFeatComp.type !='slow-down'){
        //not allowed to destory this type???
      //}
      
      const dist = distance( scene.center,transform.position )

      //log("trackfeature",trackFeatComp.name,"dist",dist,trackFeatComp.triggerSize,trackFeatComp.triggerSizeHalved)
      //FIXME hardcoding distance to 1.5 but need to use actual track feature size
      const width = trackFeatComp.triggerSizeHalved ? trackFeatComp.triggerSizeHalved.x : .5 //assume 1 as default size so half it
       
      let wereColliding = this.hasActiveCollision(trackFeatComp)
      let areColliding = dist < width
      if (wereColliding && !areColliding) {
        log("trackfeature","player.leave.feature",trackFeatComp.name,dist,width,trackFeatComp.triggerSize,trackFeatComp.triggerSizeHalved)
        //no longer collider
        this.disengageActiveCollision( trackFeatComp )

        if(trackFeatTriggerComp.onCameraExit) trackFeatTriggerComp.onCameraExit()
      }else if(!wereColliding && areColliding) {
        log("trackfeature","player.hit.feature",trackFeatComp.name,dist,width,trackFeatComp.triggerSize,trackFeatComp.triggerSizeHalved)
        //for now, to avoid called 2x just remove it.  long term need to track iscolliding
        this.engageCollision( trackFeatComp )

        if(trackFeatTriggerComp.onCameraEnter) trackFeatTriggerComp.onCameraEnter()
      }
    }
  }
  //TODO use TriggerWrapper, for now quick and dirty with camera only
  engageCollision(other: TrackFeatureComponent) {
    this._collidingWith[other.name] = other
  }
  disengageActiveCollision(other: TrackFeatureComponent) {
    delete this._collidingWith[other.name]
  }
  //FIXME need to move per object
  hasActiveCollision(other: TrackFeatureComponent): boolean {
    return (
      this._collidingWith[other.name] != undefined &&
      this._collidingWith[other.name] != null
    )
  }
  
}