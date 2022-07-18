import { MarkedForRemoval, MovesWithWorld, RemovedAtBoundaries, shapeManager, VehicleObject } from "src/components/moveWithWorld";
import { CONFIG } from "src/config";
import { scene, player } from "./scene";
import { GAME_STATE } from "./state";
import { distance, realDistance } from "./utilities";
//import { updateCarUISpeed } from "./car";
 




//engine.addSystem(new groundTiltSystem())
/* const cube = new Entity()

cube.addComponent(new BoxShape())
cube.addComponent(new Transform({
  position: new Vector3(worldState.sceneSizeX/2,worldState.groundElevation,worldState.sceneSizeZ/2),
scale: new Vector3(0.4,0.4,0.4)}))

cube.addComponent(new movesWithWorld())
engine.addEntity(cube) */


export class VehicleMoveSystem {
  
  group = engine.getComponentGroup(VehicleObject)
  hitAngle:number = 0
  speedReduceRatio = 1
  preventingReverse = false;

  update(dt: number) {
   // log("cam Rot: " + camera.rotation.eulerAngles)  
    
    for (let entity of this.group.entities) {
      const carTransform = entity.getComponent(Transform)

      let horizontalForward = Vector3.Forward().rotate(player.camera.rotation);
      horizontalForward.y = 0;
      horizontalForward.normalize();

      player.carRotation.copyFrom(carTransform.rotation)

      let vehicleHorizontalRotation = Quaternion.FromToRotation(Vector3.Forward(),horizontalForward) 
      player.cameraDirection.copyFrom(vehicleHorizontalRotation)     
      
      this.hitAngle = Vector3.GetAngleBetweenVectors(Vector3.Forward().rotate(carTransform.rotation), scene.roadDir, Vector3.Up())         
      
     // if(scene.MOVE_BACKWARD || scene.MOVE_FORWARD){
      if(player.currentSpeed > 0 || player.currentSpeed < 0){
       // log("cam Rot: " + vehicleHorizontalRotation)

        let preventingReverseDetected = false
        carTransform.rotation = Quaternion.Slerp(carTransform.rotation, vehicleHorizontalRotation,dt * player.currentSpeed)


        //log("stop driving backwards!!!",player.wrongWay , player.forwardMostProgressSegmentID , player.closestSegmentID,realDistance(GAME_STATE.trackData.trackPath[player.forwardMostProgressSegmentID],scene.center) )
        
        if(player.wrongWay 
          && player.forwardMostVisitedSegmentID >=0 //index out of bounds check
          && distance(GAME_STATE.trackData.trackPath[player.forwardMostVisitedSegmentID],scene.center) > CONFIG.MAX_DRIVE_BACKWARDS_DIST_SQRED ){//player.forwardMostProgressSegmentID - 2 > player.closestSegmentID){
          //log("stop driving backwards!!!",)
          //log("stop driving backwards!!!",player.wrongWay , player.forwardMostProgressSegmentID , player.closestSegmentID,realDistance(GAME_STATE.trackData.trackPath[player.forwardMostProgressSegmentID],scene.center),distance(GAME_STATE.trackData.trackPath[player.forwardMostProgressSegmentID],scene.center),CONFIG.MAX_DRIVE_BACKWARDS_DIST_SQRED,"shoot dir",Vector3.Dot(scene.roadDir, Vector3.Forward().rotate(player.shootDirection)),"cam direction",Vector3.Dot(scene.roadDir, Vector3.Forward().rotate(player.cameraDirection)) )
          preventingReverseDetected = true
          //player.shootDirection.copyFrom(carTransform.rotation)
        } 

        if(true){
          //this.preventingReverse = false
          //collide with side barriers
          if(scene.distanceFromCenterLine > 12.5  ){             

          if(!player.wrongWay){
            if(!player.isOnSideRight){
              carTransform.rotation = Quaternion.FromToRotation(Vector3.Forward(), scene.roadDir.add( Vector3.Cross(scene.roadDir,Vector3.Down()).scale(0.1) ) )  
            }
            else{
              carTransform.rotation = Quaternion.FromToRotation(Vector3.Forward(), scene.roadDir.add( Vector3.Cross(scene.roadDir,Vector3.Up()).scale(0.1) ))   
            }            
          }
          else{
            if(player.isOnSideRight){
              carTransform.rotation = Quaternion.FromToRotation(Vector3.Forward(), scene.roadDir.add( Vector3.Cross(scene.roadDir,Vector3.Down()).scale(0.1) ).negate() )  
            }
            else{
              carTransform.rotation = Quaternion.FromToRotation(Vector3.Forward(), scene.roadDir.add( Vector3.Cross(scene.roadDir,Vector3.Up()).scale(0.1) ).negate() )   
            }
          }
          
          player.shootDirection.copyFrom(carTransform.rotation)
          

          if(Math.abs(player.currentSpeed) > 0.1){

            player.worldMoveDirection.copyFrom(carTransform.rotation)
            //player.currentSpeed *= 0.8
          }

        }else{ 

            player.shootDirection.copyFrom(carTransform.rotation)

            if(Math.abs(player.currentSpeed) >0.1){
              const slerpDt = (dt*1.5*(scene.worldTopSpeedWithBoost/player.currentSpeed))// * .00001
              //log("slerpDt",slerpDt,dt)
              player.worldMoveDirection = Quaternion.Slerp(player.worldMoveDirection, carTransform.rotation, slerpDt)          
            }
          }
        }

        if(preventingReverseDetected){ //prevent driving
          //player.worldMoveDirection.copyFrom(player.worldMoveDirection)
          //const origDir = player.worldMoveDirection
          //facing correct dir < 0
          if(Vector3.Dot(scene.roadDir, Vector3.Forward().rotate(player.cameraDirection)) < 0){
            //player.shootDirection.copyFrom(carTransform.rotation)
            //log("stop driving backwards!!! zero out")
            player.worldMoveDirection.copyFrom(Quaternion.Zero())
            this.preventingReverse = true
          }else{
            this.preventingReverse = false
          }
          //player.worldMoveDirection =  Quaternion.Zero()// INVERT not working as expected Quaternion.Inverse( origDir )//Quaternion.Zero())
          

          
          
          //player.worldMoveDirection = Quaternion.Slerp(origDir.normalize(), Quaternion.Inverse( carTransform.rotation ), 1)          
        }else{
          this.preventingReverse = false
        }

        
        
    }
    //hitting grass sidelines
    if(scene.distanceFromCenterLine > 6){
      player.sideFriction = 0.02     
    }else{
      player.sideFriction = 0   
    }

    
    

    //check if drifting
    if(Quaternion.Angle(player.worldMoveDirection,carTransform.rotation) > 10){
      player.isDrifting = true
      player.driftFriction = 0.009 
    }
    else{
      player.isDrifting = false
      player.driftFriction = 0
    }

    let aboutToStart = false


    //let startBoostQualify = false
    if(!GAME_STATE.raceData.started && !GAME_STATE.raceData.ended){
      aboutToStart = GAME_STATE.raceData.startTime > 0 && (GAME_STATE.raceData.startTime - Date.now() < 1000)
      
      if(!aboutToStart){
        if(player.MOVE_FORWARD){
          player.appliedSlowdownFriction = Math.min(scene.DRAG_MAX*2, player.appliedSlowdownFriction+1*dt)
        }else{
          player.appliedSlowdownFriction = Math.max(0, player.appliedSlowdownFriction -1*dt )
        }
      }else{
        if(player.appliedSlowdownFriction > 0){
          if(!player.MOVE_FORWARD ){
            player.appliedSlowdownFriction = Math.max(0, player.appliedSlowdownFriction -1*dt )
          }
        }else{
          if(player.MOVE_FORWARD){
            player.appliedBoostFriction = Math.max(-1*scene.BOOST_MAX, player.appliedBoostFriction-1*dt)
          }else{
            player.appliedBoostFriction = Math.min(0, player.appliedBoostFriction +1*dt )
          }
        }
      }
      //log("GAME_STATE.raceData.started",GAME_STATE.raceData.started,"player.falseStartFriction",player.gasBeforeStartFriction,"aboutToStart",aboutToStart,(GAME_STATE.raceData.startTime - Date.now() ),"currentSpeed",player.currentSpeed,"worldTopSpeed",scene.worldTopSpeed)
    }else if(GAME_STATE.raceData.started && !GAME_STATE.raceData.ended){
      if(player.appliedSlowdownFriction != 0){
        if(player.appliedSlowdownFriction > 0){
          player.appliedSlowdownFriction = Math.max(0, (player.appliedSlowdownFriction-.4*dt))
        }else if(player.appliedSlowdownFriction < 0){
          player.appliedSlowdownFriction = Math.min(0, (player.appliedSlowdownFriction+ scene.BOOST_DECEL*dt))
        }
      }
      if(player.appliedBoostFriction != 0){
        if(player.appliedBoostFriction > 0){
          player.appliedBoostFriction = Math.max(0, (player.appliedBoostFriction-.4*dt))
        }else if(player.appliedBoostFriction < 0){
          player.appliedBoostFriction = Math.min(0, (player.appliedBoostFriction+ scene.BOOST_DECEL*dt))
        }
      }
      //log("GAME_STATE.raceData.started",GAME_STATE.raceData.started,"player.falseStartFriction",player.gasBeforeStartFriction,"aboutToStart",aboutToStart,(GAME_STATE.raceData.startTime - Date.now() ),"currentSpeed",player.currentSpeed,"worldTopSpeed",scene.worldTopSpeed)
    }else if(GAME_STATE.raceData.ended){
      player.appliedBoostFriction = 0
      player.appliedSlowdownFriction = 0
    }



    //log("GAME_STATE.raceData.started",GAME_STATE.raceData.started,"appliedFrictions",player.appliedSlowdownFriction.toFixed(4),player.appliedBoostFriction.toFixed(4),"aboutToStart",aboutToStart,(GAME_STATE.raceData.startTime - Date.now() ),"currentSpeed",player.currentSpeed,"worldTopSpeed",scene.worldTopSpeed,scene.worldTopSpeedWithBoost)
    

    scene.worldTopSpeedWithBoost = scene.worldTopSpeed + 10*(-1*player.appliedSlowdownFriction + -1*player.appliedBoostFriction)
    player.friction = player.sideFriction + player.driftFriction +  player.appliedBoostFriction

  }

  }
}

//MOVED TO src/modules/scene/race.ts
//engine.addSystem(new VehicleMoveSystem())

//reusing to avoid creating new one each time
const sceneMoveVector = new Vector3(0,0,0)

export class WorldMoveSystem {
  // this group will contain every entity that has a Transform component
  group = engine.getComponentGroup(MovesWithWorld, Transform)
  worldTopSpeed = 20
  worldTopSpeedBackward = -20
  currentSpeed = 0
  moveDir = -1
  //acceleration = 4
  playerCameraControl = false
  //worldMoveDirection = new Quaternion(0,0,0,0) 
  friction = 0

  resetAll(){
    for (let entity of this.group.entities) {
      // get the Transform component of the entity
      entity.getComponent(MovesWithWorld).reset()
    }
  }
  update(dt: number) {
   // log("cam Rot: " + camera.rotation.eulerAngles)
   
    this.friction = player.currentSpeed * player.friction 

    if(player.MOVE_FORWARD && GAME_STATE.raceData.started){ 
      player.currentSpeed = player.currentSpeed + (player.acceleration * dt) - this.friction 

      //to prevent appliedSlowdownFriction to move it negative
      player.currentSpeed = Math.max( 0, player.currentSpeed - player.appliedSlowdownFriction )

      if(player.currentSpeed > scene.worldTopSpeedWithBoost ){        
        player.currentSpeed = scene.worldTopSpeedWithBoost
      }
    }

    if (player.MOVE_BACKWARD){
      
      if(player.currentSpeed > scene.worldTopSpeedBackward ){
        player.currentSpeed -=  player.acceleration * dt
      }     
    }

    if(!player.MOVE_FORWARD && !player.MOVE_BACKWARD || GAME_STATE.raceData.ended || player.completedRace){      
      
     // IN_MOVEMENT = false
      if (player.currentSpeed < 0) {
        player.currentSpeed = player.currentSpeed/2*player.deceleration * dt
      }
      if (player.currentSpeed > 0) {
        player.currentSpeed -= player.currentSpeed/2*player.deceleration * dt + player.appliedSlowdownFriction +  player.appliedBoostFriction
      }
      if(Math.abs(player.currentSpeed) < 0.5){
        player.currentSpeed = 0
        scene.worldMoveVector.setAll(0)
      }
    } else {
      //IN_MOVEMENT = true
      this.playerCameraControl = true
    }

    /*
    if(this.playerCameraControl){
      this.worldMoveDirection.copyFrom(player.worldMoveDirection)
    }  */    

    if(player.currentSpeed != 0){   
      //dont assign till done to avoid jitters   
      sceneMoveVector.x = 0
      sceneMoveVector.y = 0
      sceneMoveVector.z = -1*player.currentSpeed * dt
      sceneMoveVector.rotate(player.worldMoveDirection)
      sceneMoveVector.y = 0

      scene.worldMoveVector.copyFrom(sceneMoveVector)
      //scene.worldMoveVector = new Vector3(0,0,-1*player.currentSpeed * dt).rotate(player.worldMoveDirection)
      //scene.worldMoveVector.y = 0 // = scene.worldMoveVector.multiplyByFloats( 1, 0, 1)//zero out Y
    } 
    
    this.updateEntityPositions(scene.worldMoveVector)  
    
      //update attached UI
      //updateCarUISpeed(scene.currentSpeed)
    
  }
  updateEntityPositions(moveDir:Vector3){
    // log("World Move Vector: " + worldMoveVector)
    for (let entity of this.group.entities) {
      // get the Transform component of the entity
      if(entity.getComponent(MovesWithWorld).active){
        const transform = entity.getComponent(Transform)      
        transform.translate(moveDir)
      }
    }
  } 
}


//MOVED TO src/modules/scene/race.ts
//engine.addSystem(new WorldMoveSystem())

//TODO unused remove
export class ShapeManagerSystem {
  
    group = engine.getComponentGroup(shapeManager)
  
    update(dt: number) {
  
     // let world = worldManager.getComponent(worldState)
    
      for (let entity of this.group.entities) 
      {
        const managerData = entity.getComponent(shapeManager)
        managerData.worldPosition.addInPlace(scene.worldMoveVector)
  
        if(managerData.entity.alive){
          if( this.isOutOfBounds(managerData.worldPosition)){
            engine.removeEntity(managerData.entity)
          } else {
            managerData.entity.getComponent(Transform).position = managerData.worldPosition
          }
  
        }
  
        if(!managerData.entity.alive){
          if( !this.isOutOfBounds(managerData.worldPosition)){
            engine.addEntity(managerData.entity)
          }
        }
  
  
      }   
  
    }
  
    isOutOfBounds(pos: Vector3): boolean{
     // log("OOB Pos: " + pos)
     if(!pos) log("ShapeManagerSystem.isOutOfBounds pos is null!!!",pos)
      if(pos.x > scene.sizeX- scene.maxObjectRadius || pos.x < scene.maxObjectRadius || pos.z > scene.sizeZ - scene.maxObjectRadius || pos.z < scene.maxObjectRadius){
        
        return true
      }      
      
  
      return false
    }
  }

export class RemoverSystem {

    group = engine.getComponentGroup(RemovedAtBoundaries)
    removeGroup = engine.getComponentGroup(MarkedForRemoval)  
  
    update(dt: number){
    
      //let world = worldManager.getComponent(worldState)
  
      for(let entity of this.group.entities) {
        let transform = entity.getComponent(Transform)
        let removeData = entity.getComponent(RemovedAtBoundaries)
  
        if(this.isOutOfBounds(transform.position, removeData.radius )){
         entity.addComponent(new MarkedForRemoval())
        // log("Entity marked for removal: " + entity + ", " + transform.position)
         
         
        }
      }
      //let count = 0
      while(this.removeGroup.entities.length){
        engine.removeEntity(this.removeGroup.entities[0])
        //count++
       // log("Entities removed: " + count)
      }
    }
  
    isOutOfBounds(pos: Vector3, radius: number): boolean{
      // log("OOB Pos: " + pos)
      if(!pos) log("RemoverSystem.isOutOfBounds pos is null!!!",pos)
       if( (pos.x > scene.sizeX - radius) || (pos.x < radius) || (pos.z > scene.sizeZ - radius) || (pos.z < radius)){
        
         return true
       }   
       return false
     }
  
  }

  //export let myRemoverSystem = new RemoverSystem()