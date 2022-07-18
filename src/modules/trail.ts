
import { scene, player } from "./scene";
import { realDistance, distance, ToDegrees} from "./utilities";
import { themeControl } from './themeData'
import { Hidden } from "./commonComponents";
import { levelManager } from "src/tracks/levelManager";
import { MovesWithWorld } from "src/components/moveWithWorld";
import { AbstractMoveWithWorldSpawner } from "./spawner";

let starTrailShape =  new GLTFShape('models/dust_trail.glb')
let smokeTrailShape =  new GLTFShape('models/white_smoke.glb')

@Component("particleTrail")
export class particleTrail {  
  lifetime = 4 
  age = 0 
}

const sleighTransform = new Transform({
    position: new Vector3(scene.center.x,scene.center.y,scene.center.z) 
})

export class StarTrailSystem {
 
    elapsedTime = 0
    spawnFrequency = 0.02
    lastSpawnPos = new Vector3(scene.center.x,scene.center.y,scene.center.z) 
    group = engine.getComponentGroup(particleTrail,MovesWithWorld)
  
    starSpawner:StarSpawner

    constructor(spawner:StarSpawner){
      this.starSpawner = spawner
    }
  
    update(dt: number){
      
  
      this.elapsedTime += dt       
  
      //this condition only activates star trail if sleigh is drifting (and enough time has passed since last spawn), can be removed for constant trailing, or changed to only work above a certain speed etc..
      //if(Quaternion.Angle(scene.worldMoveDirection,sleighTransform.rotation) > 2 && this.elapsedTime > this.spawnFrequency ){
      if(player.isDrifting && (player.currentSpeed > 4) && (this.elapsedTime > this.spawnFrequency) ){
  
        //ensure a certain distance between spawns (squared distance)
        if(distance(sleighTransform.position, this.lastSpawnPos) > 0.3){                 
          
          this.starSpawner.spawnEntity(sleighTransform.position.x , sleighTransform.position.y , sleighTransform.position.z, player.worldMoveDirection)
         
          this.elapsedTime = 0
          this.lastSpawnPos.copyFrom(sleighTransform.position)
        }
      }
      
      //this is needed only for infinity engine movement, otherwise lastSpawnPos does not need to move
      this.lastSpawnPos.addInPlace(scene.worldMoveVector)
  
      //handle each particle for OOB, lifetime and gravity movement
      for (let entity of this.group.entities) 
        {
          const transform = entity.getComponent(Transform)     
          const particleInfo = entity.getComponent(particleTrail)     
          const moveInfo = entity.getComponent(MovesWithWorld)           
          
          // if out of bounds -> hide it underground
          if(this.isOutOfBounds(transform.position))
          {
            transform.position.copyFrom(moveInfo.hidePos)
            moveInfo.active = false
            entity.addComponentOrReplace(new Hidden())          
          }
          //otherwise age the particle
          else{
            particleInfo.age += dt   
  
            //move it slowly upwards while alive          
            if(particleInfo.age < particleInfo.lifetime ){
              if(transform.position.y > scene.raceGroundElevation){
                transform.position.y += dt*0.2      
                transform.scale.y += dt*1      
                transform.scale.x += dt*1      
                transform.scale.z += dt*1      
              }
                   
            } 
            //hide particle at end of lifetime, reset age
            else{
              this.starSpawner.removeEntity(entity)
            }
          }        
        }
  
    }
  
    isOutOfBounds(pos: Vector3): boolean{
      let safetyBounds = 1.2
       if(pos.x > scene.sizeX - safetyBounds || pos.x < safetyBounds || pos.z > scene.sizeZ - safetyBounds || pos.z < safetyBounds){
         
         return true
       }   
       return false
     } 
  
  }
  
  
  
 //TODO consider making singleton?
 export class StarSpawner extends AbstractMoveWithWorldSpawner{
  spawnCount:number  =0

   spawnEntity(x:number, y:number, z:number, rot:Quaternion) {
      const particle = this.getEntityFromPool()

      if (!particle) return

      this.ensureCorrectModelUsed(particle,levelManager.getCurrentLevel().theme.carDust)

      let transform = particle.getComponentOrCreate(Transform)

      transform.position = new Vector3(x, y+Math.random()*0.2, z)        
      transform.rotation.copyFrom( rot )        
      transform.scale = new Vector3(0.3, 0.3, 0.3)

      transform.rotate(Vector3.Forward(),Math.random()*180)

      particle.getComponentOrCreate(MovesWithWorld).active = true     
      particle.getComponentOrCreate(particleTrail).age = 0

      if(particle.hasComponent(Hidden)){
        particle.removeComponent(Hidden) 
      }   
        
      engine.addEntity(particle) 

      //log("ADDED PARTICLE: " + this.spawnCount++, particle.name )

   }   

   removeEntity(entity: IEntity): void {
     super.removeEntity(entity)
     entity.getComponentOrCreate(particleTrail).age = 0
   }
 
   ensureCorrectModelUsed(subObject:IEntity,subShapeToUse:GLTFShape){
     if(!subObject.hasComponent(GLTFShape))
     {
       //replacing each time as dont know what it will hold
       subObject.addComponentOrReplace(subShapeToUse)    
     }else if(subObject.getComponent(GLTFShape) != subShapeToUse){
       log("track.spawnEntity.replacing mesh")
       subObject.addComponentOrReplace(subShapeToUse)    
     }
   }
 }
