import * as utils from '@dcl/ecs-scene-utils'
import { CONFIG } from 'src/config';
import { Constants } from './resources/globals';
import { VisibilityStrategyEnum } from './scene/subScene';
import { GAME_STATE } from "./state";
import { distance } from "./utilities";
import * as serverSpec from './connection/state/server-state-spec';
import { TrackFeatureComponent } from './trackFeatures';
import { MovesWithWorld } from 'src/components/moveWithWorld';

let fireClip = new AudioClip('sounds/rocket_fire.mp3')
let explosionClip = new AudioClip('sounds/explosion.mp3')


 let rocketShape = new GLTFShape('models/rocket_projectile.glb')
 let explosionShape = new GLTFShape('models/explosion.glb')

// let rocketShape = new CylinderShape()
// rocketShape.withCollisions = false
// rocketShape.radiusTop = 0.5

@Component("ProjectileInfo")
export class ProjectileInfo { 
    constructor(_direction:Vector3, _speed:number){
        this.dir = _direction
        this.speed = _speed
    }  
    dir:Vector3 = Vector3.Forward() 
    speed:number = 1
    lifetime:number = 1
}

@Component("ExplosionInfo")
export class ExplosionInfo { 

    explosion:Explosion
    confetti:Entity    
    lifetime:number = 1
    force:number = 200

    constructor(_lifeTime:number, _explosionRef:Explosion){
        this.lifetime = _lifeTime
        this.explosion = _explosionRef        
    }  
}


let projectileDummy = new Entity()
projectileDummy.addComponent(new Transform({
  position: new Vector3(8,-5,8)
}))
projectileDummy.addComponent(rocketShape)
engine.addEntity(projectileDummy)

let explosionDummy = new Entity()
explosionDummy.addComponent(new Transform({
  position: new Vector3(8,-10,8)
}))
explosionDummy.addComponent(explosionShape)
engine.addEntity(explosionDummy)


export class Projectile extends Entity {
    public dir: Vector3  
    
    constructor(      
      transform: TranformConstructorArgs ,
      _dir: Vector3,   
      _speed: number   
    ) {
      super()      
  
      //log("new Projectile")
      this.addComponent(rocketShape)
      this.addComponent(new MovesWithWorld())
      this.addComponent(new ProjectileInfo(_dir, _speed))
      this.addComponent(new Transform(transform))  
      
      this.getComponent(Transform).rotation = Quaternion.FromToRotation(Vector3.Forward(), _dir)
      engine.addEntity(this)
    } 
    
  
    public shoot(): void {
      
    }  
    
  }

  class Explosion extends Entity{

    
    explosionSound:AudioSource
  
    constructor(_position:Vector3, _rotation:Quaternion){
      super()
      this.addComponent(new Transform({
        position: new Vector3(_position.x, _position.y, _position.z),
        rotation: _rotation,
        scale: new Vector3(0.5,0.5,0.5)
      }))
      this.addComponent(new GLTFShape('models/explosion.glb'))
      this.addComponent(new ExplosionInfo(21/30, this))
        
      this.explosionSound = new AudioSource(explosionClip)
      this.explosionSound.volume = 6
      this.addComponent(this.explosionSound)
      this.explosionSound.playOnce()
      this.addComponent(new MovesWithWorld())
      engine.addEntity(this)
  
      //spawn a crater on the ground
      // if(_position.y < 0.5){
      //   craterSpawner.spawnEntity(_position)
      // }
      
     
    }
  }

  export class ProjectileSystem {
    physicsCast: PhysicsCast
    group = engine.getComponentGroup(ProjectileInfo,Transform)
    featureGroup = engine.getComponentGroup(TrackFeatureComponent)
    explosionGroup = engine.getComponentGroup(ExplosionInfo, Transform)

    constructor(){
      this.physicsCast = PhysicsCast.instance
    }

    update(dt:number){

        //bullets
        for (let entity of this.group.entities) 
        {
          let transform = entity.getComponent(Transform)     
          let pInfo = entity.getComponent(ProjectileInfo)   

          if(pInfo.lifetime > 0){  
             pInfo.lifetime -= dt         

             
             //const prevPos = transform.position.clone()
             transform.position.addInPlace(pInfo.dir.multiplyByFloats(pInfo.speed*dt, pInfo.speed*dt, pInfo.speed*dt))
             const nextPos = transform.position//.clone()

             //check hitting colliders
              
             /*
              let moveVector = prevPos
                .subtract(nextPos)
                .multiplyByFloats(1, 0, 1)
              let moveDistance = moveVector.length()
              let rayCastDistance = moveDistance < 1 ? 1 : moveDistance
      
              log("raycast distance: " + rayCastDistance)
      
              let rayBallCollide: Ray = {
                origin: prevPos,
                direction: pInfo.dir,
                distance: rayCastDistance,
              }
       
              this.physicsCast.hitFirst(rayBallCollide, (e) => {
                if (e.didHit) {
                  log("raycast hit: " + e.entity.meshName)
                }
              })*/
              //check distances on visible objects
              
              //FIXME its computing all of them!!!
              //log("this.featureGroup.entities.length",this.featureGroup.entities.length)
              for (let entity of this.featureGroup.entities) 
              {
                const trackFeatComp = entity.getComponent(TrackFeatureComponent)
                if(!entity.alive){
                  log("projectile","not alive skipping",trackFeatComp.name)
                  return
                }
                if(!entity.hasComponent(Transform)){
                  log("projectile","missing transform skipping",trackFeatComp.name)
                  return
                }
                //if(trackFeatComp.type !='slow-down'){
                  //not allowed to destory this type???
                //}
                
                const transform = entity.getComponent(Transform)
                const dist = distance( nextPos,transform.position )

                //log("projectile",trackFeatComp.name,"dist",dist,trackFeatComp.triggerSize,trackFeatComp.triggerSizeHalved)
                //FIXME hardcoding distance to 1.5 but need to use actual track feature size
                const width = trackFeatComp.triggerSizeHalved ? trackFeatComp.triggerSizeHalved.x : .5 //assume 1 as default size so half it
                if(dist < width){
                  log("projectile","hit.feature",trackFeatComp.name,dist,width,trackFeatComp.triggerSize,trackFeatComp.triggerSizeHalved)

                  //debugger
                  
                  const hideTime = trackFeatComp.type == "slow-down" ? CONFIG.TRACK_FEATURE_SLOW_DOWN_RESPAWN : CONFIG.TRACK_FEATURE_DEFAULT_RESPAWN
                  const newActivateTime = Date.now() + hideTime

                  const updateData:serverSpec.TrackFeatureUpdate = {
                    name: trackFeatComp.name,
                    type: trackFeatComp.type,
                    activateTime: newActivateTime,
                    position: trackFeatComp.position
                  }
                  updateData.activateTime = newActivateTime

                  //propagate to server
                  GAME_STATE.gameRoom.send("levelData.trackFeature.update",updateData)

                  if(trackFeatComp.sceneEnts){
                    log("projectile","hit.feature",trackFeatComp.name,"new activate time",newActivateTime)
                    trackFeatComp.activateTime = newActivateTime
                    
                    for(const p in trackFeatComp.sceneEnts){
                      //log("projectile","hit.feature",trackFeatComp.name,"hiding",trackFeatComp.sceneEnts[p].entity.name)
                      trackFeatComp.sceneEnts[p].hide(true,VisibilityStrategyEnum.MOVE_TO_VAULT)
                      //was used to dedoup duplicates sitting exactly ontop of each other
                      //trackFeatComp.textShape.value = Math.random().toFixed(5) + ""
                    }

                    pInfo.lifetime = -1
                    this.showExplosion(entity,transform)

                    utils.setTimeout( hideTime, ()=>{
                      log("respawn",trackFeatComp.name)
                      //debugger
                      //FIXME doing vault instance copies for now
                      //for(const p in trackFeatComp.sceneEnts){
                      //  if(!trackFeatComp.sceneEnts[p].visible) trackFeatComp.sceneEnts[p].restoreVisibleTransformInfo()
                      //}
 
                      Constants.SCENE_MGR.racingScene.trackSpawnSystem.renderVisibleSegments(undefined,true)
                    } )
                  }
                }
              }
          }
          else{
            this.showExplosion(entity,transform)
          }
        }

        //explosions
        for (let explosion of this.explosionGroup.entities) 
        {
          let transform = explosion.getComponent(Transform)     
          let eInfo = explosion.getComponent(ExplosionInfo)   


          if(eInfo.lifetime > 0){  
             eInfo.lifetime -= dt             
          }
          else{
              engine.removeEntity(explosion)
          }
        }
    }
    showExplosion(entity:IEntity,transform:Transform){
      let explosion = new Explosion(
        transform.position, 
        Quaternion.Zero()
        )
        engine.removeEntity(entity)
    }
  }
//MOVED TO src/modules/scene/race.ts
  //engine.addSystem(new ProjectileSystem())
