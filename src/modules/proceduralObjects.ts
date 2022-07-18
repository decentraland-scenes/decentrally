// import { scene as scene  } from "./scene";
// import {  movesWithWorld, RemovedAtBoundaries, MarkedForRemoval, myRemoverSystem } from "./worldMoveEngine";
// //import {  getNumberOfTracks, numberOfTracks } from "./track";


// //DESERT ENVIRONMENT RELATED OBJECTS

// let rockMediumShape1 =  new GLTFShape('models/rock_medium_1.glb')
// let rockFlatShape =     new GLTFShape('models/rock_flat.glb')
// let cactusShape1 =      new GLTFShape('models/cactus1.glb')

// @Component("ProceduralObject")
// export class ProceduralObject {  
// }

// export class ObjectSpawningSystem {
  
//     elapsedTimeZPlus = 0
//     elapsedTimeXPlus= 0
//     elapsedTimeZMinus = 0
//     elapsedTimeXMinus = 0
  
//     spawningFrequency = 0.2
  
//     side = 0
//     safeBoundarySize = 2
//     safeBoundaryTracks = 9
//     closeToMineEntrance = false
//     spawnPosX = scene.sizeX/2
//     spawnPosZ = scene.sizeZ/2
//     spawnObjectX = false
//     spawnObjectZ = false
//     numberOfTracks = 181
//     mineRadius = 10
  
//     update(dt: number){   
         
//      // let world = worldManager.getComponent(worldState)    
//       let trackPos = scene.lastTrackPos
//       let trackIndex = scene.lastTrackIndex
//       let trackFraction = scene.lastTrackFraction
      

//       this.spawnObjectX = false
//       this.spawnObjectZ = false


//         // dont generate objects near mine entrance
//       if((trackIndex > this.numberOfTracks - 10) || (trackIndex == 0 && trackFraction < 0.3) ){
//         //log("not object spawning zone")
//         this.closeToMineEntrance = true
//       }      
//       else {
//         this.closeToMineEntrance = false
//       }
        
//         if(scene.currentSpeed > 2)
//         {
//           if( scene.worldMoveVector.z < 0){            
//             this.elapsedTimeZPlus += dt * scene.currentSpeed * Math.abs(scene.worldMoveVector.z) 
//           }else if( scene.worldMoveVector.z > 0){            
//             this.elapsedTimeZMinus += dt * scene.currentSpeed * Math.abs(scene.worldMoveVector.z) 
//           }
    
//           if( scene.worldMoveVector.x < 0){            
//             this.elapsedTimeXPlus += dt * scene.currentSpeed * Math.abs(scene.worldMoveVector.x) 
//           }else if( scene.worldMoveVector.x > 0){            
//             this.elapsedTimeXMinus += dt * scene.currentSpeed * Math.abs(scene.worldMoveVector.x)
//           }
                    
        
//           //spawning random along Z=sizeZ edge
//           if(this.elapsedTimeZPlus > this.spawningFrequency){           
//             this.spawnPosX = this.safeBoundarySize + Math.random()*(scene.sizeX - this.safeBoundarySize*2) 
//             this.spawnPosZ = scene.sizeZ - this.safeBoundarySize          
//             this.elapsedTimeZPlus = 0
//             this.spawnObjectZ = true
//           }

//           //spawning random along Z=0 edge
//           if(this.elapsedTimeZMinus > this.spawningFrequency){    
//             this.spawnPosX = this.safeBoundarySize + Math.random()*(scene.sizeX - this.safeBoundarySize*2)    
//             this.spawnPosZ = this.safeBoundarySize           
//             this.elapsedTimeZMinus = 0
//             this.spawnObjectZ = true
//           }

//           if(this.spawnObjectZ){
//             //if generated coorinates are safe distance from train track -> SPAWN Object
//             if(Math.abs(this.spawnPosX - trackPos.x) > this.safeBoundaryTracks ){               
//                 rockSpawner.spawnEntity(this.spawnPosX, scene.groundElevation,  this.spawnPosZ)                          
//             }
//           }   
                 

//           //spawning random along X=sizeX edge
//           if(this.elapsedTimeXPlus > this.spawningFrequency){   
//             this.spawnPosX = scene.sizeX - this.safeBoundarySize
//             this.spawnPosZ = this.safeBoundarySize + Math.random()*(scene.sizeZ - this.safeBoundarySize*2)           
//             this.elapsedTimeXPlus = 0
//             this.spawnObjectX = true
//           }
          
//           //spawning random along X=0 edge
//           if(this.elapsedTimeXMinus > this.spawningFrequency){ 
//             this.spawnPosX = this.safeBoundarySize
//             this.spawnPosZ = this.safeBoundarySize + Math.random()*(scene.sizeZ - this.safeBoundarySize*2)              
//             this.elapsedTimeXMinus = 0
//             this.spawnObjectX = true
//           } 

//           if(this.spawnObjectX){
//             //if generated coorinates are safe distance from train track -> SPAWN Object
//             if(Math.abs(this.spawnPosZ - trackPos.z) > this.safeBoundaryTracks){ 
//               rockSpawner.spawnEntity(this.spawnPosX, scene.groundElevation,  this.spawnPosZ)              
//             }
//           }
//         }
    
        
    
       
    
    
//   } 
  
//     isOutOfBounds(pos: Vector3, radius: number): boolean{
//       // log("OOB Pos: " + pos)
      
//        if(pos.x > scene.sizeX- radius || pos.x < radius || pos.z > scene.sizeZ - radius || pos.z < radius){
        
//          return true
//        }   
//        return false
//      }
  
//   }

//   export let myObjectSpawningSystem =  new ObjectSpawningSystem()

//   engine.addSystem(myObjectSpawningSystem)
//   engine.addSystem(myRemoverSystem)

//   const rockSpawner = {
//     MAX_POOL_SIZE: 60,
//     pool: [] as Entity[],
  
//     spawnEntity(x:number, y:number, z:number) {
  
//       const object = rockSpawner.getEntityFromPool()
  
//       if (!object) return      
  
//       let randomRot = Quaternion.Euler(0,Math.random()*360,0)
//       let randomScaleY = Math.random()*0.5 + 0.1  
  
//       let randomScaleXZ = 0.1 + Math.random()*0.5          
      
//       let transform = object.getComponentOrCreate(Transform)
        
//       transform.position = new Vector3(x, y, z),      
//       transform.rotation = randomRot,
//       transform.scale = new Vector3(randomScaleXZ, randomScaleY, randomScaleXZ)
      
//       object.getComponentOrCreate(movesWithWorld)    
//       object.getComponentOrCreate(RemovedAtBoundaries)     
//       object.getComponentOrCreate(ProceduralObject)     
      
      
//       if(!object.hasComponent(GLTFShape)){
      
//         let objType = Math.floor(Math.random()*3)
  
//         switch(objType) { 
//            case 0: { 
//               object.addComponent(rockMediumShape1)
//               break; 
//            } 
//            case 1: { 
//               object.addComponent(cactusShape1)
//               break; 
//            } 
//            case 2: {
//               object.addComponent(rockFlatShape) 
//               break;    
//            }          
//            default: { 
//               object.addComponent(rockMediumShape1)
//               break;              
//            } 
//         }
//       }      
  
//       if(object.hasComponent(MarkedForRemoval))
//         object.removeComponent(MarkedForRemoval)
      
//       engine.addEntity(object)
      
//     },
    
  
//     getEntityFromPool(): Entity | null {
//       // Check if an existing entity can be used
//       for (let i = 0; i < rockSpawner.pool.length; i++) {
//         if (!rockSpawner.pool[i].alive) {
//           return rockSpawner.pool[i]
//         }
//       }
//       // If none of the existing are available, create a new one, unless the maximum pool size is reached
//       if (rockSpawner.pool.length < rockSpawner.MAX_POOL_SIZE) {
//         const instance = new Entity()
//         rockSpawner.pool.push(instance)
//         return instance
//       }
//       return null
//     }
  
//   }

  
// let ValidObjectLocationsMatrix = []

// ValidObjectLocationsMatrix.push(
//   0,0,0,0,0,0,0,0,0,0,
//   0,1,1,1,0,0,1,1,1,0,
//   0,1,1,1,0,0,1,1,1,0,
//   0,1,1,1,0,0,1,1,1,0,
//   0,1,0,0,0,0,1,1,1,0,
//   0,1,0,0,0,0,1,1,1,0,
//   0,1,1,1,0,0,1,1,1,0,
//   0,1,1,1,0,0,1,1,1,0,
//   0,1,1,1,0,0,1,1,1,0,
//   0,0,0,0,0,0,0,0,0,0 
//   )

//   let numberOfLocations = 0

//   for(let i= 0; i < ValidObjectLocationsMatrix.length ; i++){
//     numberOfLocations += ValidObjectLocationsMatrix[i]
//   }  
  

// export function AddInitialDesertObjects(){    

//     let objectGroup = engine.getComponentGroup(ProceduralObject)

//     if(objectGroup.entities.length == 0){
//       for(let i=0; i < rockSpawner.MAX_POOL_SIZE* 0.75; i++){
//         let count = 0
//         let j = 0
//         let randomObjectLocIndex = Math.floor( Math.random() * numberOfLocations)

//         while(count < randomObjectLocIndex){
//           count += ValidObjectLocationsMatrix[j]
//           if(count < randomObjectLocIndex){
//             j++
//           }
            
//         } 

//       let rowZ = Math.floor(j/10)
//       let columnX = j%10 

//       let objectPos = new Vector3((4 + columnX * 8) + (Math.random()*2-1)*4, scene.groundElevation, (4 + rowZ * 8) + (Math.random()*2-1)*4)
//       rockSpawner.spawnEntity(objectPos.x, objectPos.y, objectPos.z)
//          // rockSpawner.spawnEntity( worldState.maxObjectRadius + Math.random() * (worldState.sizeX - worldState.maxObjectRadius*2), worldState.groundElevation , worldState.maxObjectRadius + Math.random() * (worldState.sizeZ - worldState.maxObjectRadius*2) )   
//     }
//     }
// }

// AddInitialDesertObjects()