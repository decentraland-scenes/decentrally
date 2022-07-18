//import { showExitCarButton } from "./ui";
import * as utils from '@dcl/ecs-scene-utils'
import { movePlayerTo } from '@decentraland/RestrictedActions';
import { MovesWithWorld, VehicleObject } from 'src/components/moveWithWorld';
import { CONFIG } from 'src/config';
import { CarData, defaultCar } from './carData';
import { Hidden } from './commonComponents';
import { IntervalUtil } from './interval-util';
import { SoundPool, SOUND_POOL_MGR } from './resources/sounds';
import { player, PlayerBase, scene } from "./scene";
import { engineAddEntity } from './scene-utilities';
import { EntityWrapper } from "./scene/subScene";
import { AbstractMoveWithWorldSpawner } from './spawner';
import { GAME_STATE } from './state';
import { distance, ToDegrees } from "./utilities";


//let carBodyShape01 =  new GLTFShape('models/car.glb')
let skidmarkShape =  new GLTFShape('models/skidmark.glb')
let fireShape =         new GLTFShape('models/fire.glb')

const carPosition = new Vector3(scene.center.x,scene.center.y+0.02,scene.center.z)

const ZERO_ROTATION = Quaternion.Euler(0,0,0)

//extend SceneEntity???
export class BaseCar extends EntityWrapper{

  systems:ISystem[] = []

  driverEntity:Entity
  car :Entity
  carRearWheelL:Entity
  carRearWheelR:Entity
  carFrontWheelL:Entity
  carFrontWheelR:Entity
  carFrontWheelRootL:Entity
  carFrontWheelRootR:Entity
  exhaustFire:Entity
  wheelSpeed:number
  wheelSystem:WheelRotSystem
  skidSystem:SkidMarkSystem
  getInCarText:TextShape
  getInCarMarker:Entity
  driverPosition:Vector3
  wheelRotMax:number = 30
  wheelRotMin:number = -30
  carData:CarData
  driver:PlayerBase
  carCollider:Entity
  carColliderTop:Entity

  constructor(name:string,carData:CarData){
    super( name,[] )
    this.carData = carData
  }
  reset(){
    this.car.addComponentOrReplace(new Transform({
      position: carPosition.clone(),
      //position: new Vector3(0,worldState.sceneCenter.y+0.02,0),
      rotation: Quaternion.Euler(0,0,0),
      scale: new Vector3(1,1,1)}))
  }
  enableTopCollider(){
    if(!CONFIG.ENABLE_BLOOM_VISIBLE_WORKAROUNDS) return
    if(!this.carColliderTop.alive) engine.addEntity(this.carColliderTop)
  }
  disableTopCollider(){
    if(!CONFIG.ENABLE_BLOOM_VISIBLE_WORKAROUNDS) return
    if(this.carColliderTop.alive) engine.removeEntity(this.carColliderTop)
  }
  updateCarData(carData:CarData){
    log("updateCarData",carData,this.driver)
    if(!carData){
      log("updateCarData WARING was missing, not updating",carData)
    }
    this.carData = carData

    if(this.driver) this.driver.carModelId = this.carData.id//TODO store this somewhere else

    this.driverPosition = carData.driverPos.clone()//.addInPlace(carPosition)
  
    //DRIVER
    log("updatingCarData",carData.driverMesh)
    this.driverEntity.addComponentOrReplace(new GLTFShape(carData.driverMesh)) 
    this.driverEntity.addComponentOrReplace(new Transform({
      position: new Vector3(this.driverPosition.x,this.driverPosition.y, this.driverPosition.z),//.addInPlace(carPosition),  
      rotation: Quaternion.Euler(0,0,0),
      scale: carData.driverScale.clone()
      }
      ))
    this.driverEntity.setParent(this.car)
    //engineAddEntity(this.driverEntity)
  
    // CAR BODY
    this.car.addComponentOrReplace(new GLTFShape(carData.mesh))
    //this.car.addComponent(new vehicleObject())
    engineAddEntity( this.car)

    // REAL WHEEL LEFT
    this.carRearWheelL.addComponentOrReplace(new GLTFShape(carData.wheelMesh))
    this.carRearWheelL.addComponentOrReplace(new Transform({
      position: carData.rearWheelL.clone(),
      rotation: Quaternion.Euler(0,0,0),
      scale: new Vector3(1,1,1)}))
      
    this.carRearWheelL.setParent(this.car)
    engineAddEntity(this.carRearWheelL)

    // REAL WHEEL RIGHT
    this.carRearWheelR.addComponentOrReplace(new GLTFShape(carData.wheelMesh))
    this.carRearWheelR.addComponentOrReplace(new Transform({
      position: carData.rearWheelR.clone(),
      rotation: Quaternion.Euler(0,0,0),
      scale: new Vector3(-1,1,1)}))      
    this.carRearWheelR.setParent(this.car)
    engineAddEntity(this.carRearWheelR)

    // FRONT WHEEL ROOT LEFT
    
    this.carFrontWheelRootL.addComponentOrReplace(new Transform({
      position:carData.frontWheelL.clone(),
      rotation: Quaternion.Euler(0,0,0),
      scale: new Vector3(1,1,1)}))      
    this.carFrontWheelRootL.setParent(this.car)
    engineAddEntity(this.carFrontWheelRootL)

    // FRONT WHEEL ROOT RIGHT   
    this.carFrontWheelRootR.addComponentOrReplace(new Transform({
      position: carData.frontWheelR.clone(),
      rotation: Quaternion.Euler(0,0,0),
      scale: new Vector3(1,1,1)}))      
    this.carFrontWheelRootR.setParent(this.car)
    engineAddEntity(this.carFrontWheelRootR)

    // FRONT WHEEL LEFT
    this.carFrontWheelL.addComponentOrReplace(new GLTFShape(carData.wheelMesh))
    this.carFrontWheelL.addComponentOrReplace(new Transform({
      position: new Vector3(0,0,0),
      rotation: Quaternion.Euler(0,0,0),
      scale: new Vector3(1,1,1)}))      
    this.carFrontWheelL.setParent(this.carFrontWheelRootL)
   

    // FRONT WHEEL RIGHT
    this.carFrontWheelR.addComponentOrReplace(new GLTFShape(carData.wheelMesh))
    this.carFrontWheelR.addComponentOrReplace(new Transform({
      position: new Vector3(0,0,0),
      rotation: Quaternion.Euler(0,0,0),
      scale: new Vector3(-1,1,1)}))      
    this.carFrontWheelR.setParent(this.carFrontWheelRootR)
    

    // EXHAUST FIRE
    this.exhaustFire.addComponentOrReplace(fireShape)
    this.exhaustFire.addComponentOrReplace(new Transform({
      position: carData.exhaustPos.clone(),
      rotation: Quaternion.Euler(-90, 0, 0),
      scale: carData.exhaustScale.clone()
    }))
      this.exhaustFire.setParent(this.car)
    engineAddEntity(this.exhaustFire)
 
  }
  onInit(bar:BaseCar){
    //super.onInit()

    this.car = new Entity(this.name+'.car')
    this.driverEntity = new Entity(this.name+'.driverEnt')
    this.carRearWheelL = new Entity(this.name+'.carRearWheelL')
    this.carRearWheelR = new Entity(this.name+'.carRearWheelR')
    this.carFrontWheelL = new Entity(this.name+'.carFrontWheelL')
    this.carFrontWheelR = new Entity(this.name+'.carFrontWheelR')
    this.carFrontWheelRootL = new Entity(this.name+'.carFrontWheelRootL')
    this.carFrontWheelRootR = new Entity(this.name+'.carFrontWheelRootR')
    this.exhaustFire = new Entity(this.name+'.exhaustFire')
    this.carCollider = new Entity(this.name+'.carCollider')
    this.carColliderTop = new Entity(this.name+'.carCollider.top')

    //make sure added in order of parentage, parents first, children last
    const ents:Entity[] = [ this.car,this.driverEntity
      ,this.carRearWheelL,this.carRearWheelR,this.carFrontWheelL,this.carFrontWheelR,this.carFrontWheelRootL,this.carFrontWheelRootR,
      ,this.exhaustFire,this.carCollider,this.carColliderTop ]
    //load entities
    for(const p in ents){
      this.entities.push( ents[p] )
    }

    this.updateCarData(this.carData)

    //will set default orientations
    this.reset()
  }
  hide(): void {
    super.hide()
  }
  disable(){
    for(const p in this.systems){
      if(this.systems[p].active)  engine.removeSystem(this.systems[p])
    }
  }

  enable(){
    for(const p in this.systems){
      if(!this.systems[p].active)  engine.addSystem(this.systems[p])
    }
  }
  
  updateDriverRotation(){
    //FIXME, need to account for world rotation 
    //when car is driving player can be looking backwards 
    //if i unparent the driver helmet when car turns the driver does not stay in seat :(
    
    
    const transform = this.driverEntity.getComponent(Transform)
    const parentTransform = this.driverEntity.getParent().getComponent(Transform)
    //SOO CLOSE, locally this works perfectly.   
    //does not work for enemies once off starting line and world has rotated. my guess is its cuz world roation is not taken into account?
    if(!GAME_STATE.raceData.started){
      transform.rotation =  Quaternion.Slerp(transform.rotation, Quaternion.Inverse( parentTransform.rotation ).multiply(this.driver.cameraDirection),.5)//.copyFrom(this.driver.cameraDirection)//
    }else if(transform.rotation !== ZERO_ROTATION){
      //WORKAROUND, once race starts dont let them look at eachother till solved
      //rotate them back to facing forward
      transform.rotation =  Quaternion.Slerp(transform.rotation, Quaternion.Inverse( parentTransform.rotation ).multiply(ZERO_ROTATION),.5)//.copyFrom(this.driver.cameraDirection)//
      if(transform.rotation.y - ZERO_ROTATION.y < .01 && transform.rotation.w - ZERO_ROTATION.w < .01  && transform.rotation.x - ZERO_ROTATION.x < .01){
        transform.rotation = ZERO_ROTATION //assing this so check is faster
      }
    }else{
      //log("updateDriverRotation noop",this.driver.name)
    }
    
  }
  updateWheels(){
    this.wheelSpeed = this.driver.currentSpeed
    //POSSIBLE OPTIMIATION? wheels should mirror each other. no need to do this 4x??
    this.carRearWheelL.getComponent(Transform).rotate(new Vector3(1,0,0), 8*this.wheelSpeed)
    this.carRearWheelR.getComponent(Transform).rotate(new Vector3(1,0,0), 8*this.wheelSpeed)
    this.carFrontWheelL.getComponent(Transform).rotate(new Vector3(1,0,0), 8*this.wheelSpeed)
    this.carFrontWheelR.getComponent(Transform).rotate(new Vector3(1,0,0), 8*this.wheelSpeed)
  
    if(this.driver.currentSpeed > 0.01){
      const rTransform = this.carFrontWheelRootR.getComponent(Transform)
      const lTransform = this.carFrontWheelRootL.getComponent(Transform)
      
      //consider letting wheels move with mouse reguardless of forward motion
      let angle = Vector3.GetAngleBetweenVectors(Vector3.Forward().rotate(this.driver.cameraDirection), Vector3.Forward().rotate(this.driver.worldMoveDirection), Vector3.Up())
      angle = ToDegrees(angle)
      //log("ANGLE: " +angle) 
  
      if(angle > 45){
        angle = 45
      }
      if(angle < -45){
        angle = -45
      }
  
      //POSSIBLE OPTIMIATION? wheels should mirror each other. no need to do this twice??
      rTransform.rotation = Quaternion.Slerp(rTransform.rotation, Quaternion.Euler(0,-angle,0), 0.2)
      lTransform.rotation = Quaternion.Slerp(lTransform.rotation,Quaternion.Euler(0,-angle,0), 0.2)
    }
    

    
 
      
  }
  updateTurbo(){
    if(this.driver.MOVE_FORWARD){
      this.exhaustFire.getComponent(Transform).scale.y = 0.25 + (this.driver.appliedBoostFriction * -1)/3
    }
    else {
      this.exhaustFire.getComponent(Transform).scale.y = 0.05
    } 
  }
}


export class Car extends BaseCar {
 
  enterCarSystem:EnterCarSystem
  skidSpawner:SkidSpawner

  constructor(carData:CarData){
    super("playerCar",carData)
  }

  updateCarData(carData:CarData){
    super.updateCarData(carData)


    // CAR COLLIDER FOR CAMERA AND TRAPPING AVATAR
    this.carCollider.addComponentOrReplace( new GLTFShape(CONFIG.ENABLE_BLOOM_VISIBLE_WORKAROUNDS ? 'models/car_collider_no_top.glb':'models/car_collider.glb')) //

    if(CONFIG.ENABLE_BLOOM_VISIBLE_WORKAROUNDS){
      //FIXME, it screws with the camera removing for now
      //have a primitive collider working decently well
      /*
       this.carColliderTop.addComponentOrReplace( new GLTFShape('models/car_collider_top_only.glb')) //
       this.carColliderTop.addComponentOrReplace(new Transform({
        position: new Vector3(0,-1.1,0),      
        rotation: Quaternion.Euler(0,0,0),
        scale: new Vector3(1,1,1)}))    
        
      this.carColliderTop.setParent(this.car)
      */
    }
    
    
    this.carCollider.addComponentOrReplace(new Transform({
      position: new Vector3(0,0,0),      
      rotation: Quaternion.Euler(0,0,0),
      scale: new Vector3(1,1,1)}))    
    this.carCollider.setParent(this.car)

  }

  onInit(car:BaseCar){
    super.onInit(car)

    //TODO decide on way to not require skid spawning
    if(!this.skidSpawner){
      throw Error("skidSpawner is required to be initialized")
    }

    this.car.addComponent(new VehicleObject())

    // let crosshair = new Entity
    // crosshair.addComponent(new SphereShape())
    // crosshair.addComponent(new Transform({position: new Vector3(0,0.2,2), scale: new Vector3(0.05, 0.05, 0.01)}))
    // crosshair.setParent(car)

    this.getInCarText = new TextShape()
    this.getInCarText.value = "Press 'E' to hop in"
    this.getInCarText.fontSize = 2
    
    this.getInCarMarker = new Entity()
    this.getInCarMarker.addComponent(this.getInCarText)
    this.getInCarMarker.addComponent(new Billboard(false,true,false))
    this.getInCarMarker.addComponent(new Transform({
      position: new Vector3(this.car.getComponent(Transform).position.x, this.car.getComponent(Transform).position.y + 0.5, this.car.getComponent(Transform).position.z )
    }))

    //this.entities.push(this.getInCarMarker)
 
    this.wheelSystem = new WheelRotSystem(this)
    //engine.addSystem(this.wheelSystem)
    this.systems.push( this.wheelSystem )

    this.enterCarSystem = new EnterCarSystem(this)
    //engine.addSystem(this.enterCarSystem)
    this.systems.push( this.enterCarSystem )
    
    this.skidSystem = new SkidMarkSystem(this,this.skidSpawner)
    //engine.addSystem(this.skidSystem)
    this.systems.push( this.skidSystem )

    super.updateCarData(this.carData)

  }

  isDriving(){
    return this.driver.isDriving
  }
  setPlayerDriving(_drives:boolean,_movePlayer?:boolean){
 
    const movePlayer = _movePlayer === undefined || _movePlayer
    if(_drives){
      if(movePlayer) movePlayerTo({ x: scene.sizeX/2, y: scene.inCarPlayerGroundElevation+scene.movePlayerYPadding, z: scene.sizeZ/2 }, { x: scene.sizeX/2, y: 1, z: scene.sizeZ })
      this.driver.isDriving = true
      this.driverEntity.getComponent(Transform).position.y = this.driverPosition.y      
     // showExitCarButton(true)
      //engine.removeSystem(this.enterCarSystem) 
      if(this.getInCarMarker.isAddedToEngine()){
        engine.removeEntity(this.getInCarMarker)
      }
      
    }
    else{
      if(movePlayer) movePlayerTo({ x: scene.sizeX/2-.5, y: scene.inCarPlayerGroundElevation+scene.movePlayerYPadding, z: scene.sizeZ/2-2 }, { x: scene.sizeX/2, y: 1, z: scene.sizeZ/2 })
      this.driver.isDriving = false
      this.driverEntity.getComponent(Transform).position.y = -20      
      this.driver.isNearCar = false
     // showExitCarButton(false)    
      engine.addSystem(this.enterCarSystem) 
    }
   
  
  }
}


export class EnemyCar extends BaseCar{
  constructor(name:string,carData:CarData){
    super("enemyCar."+name,carData)
  }
  updateCarData(carData:CarData){
    super.updateCarData(carData)
  }

  onInit(car:BaseCar){
    super.onInit(car)
    
    this.car.getComponent(Transform).position = new Vector3(0,0,0)
  }
}

// let carUIRoot = new Entity()
// let carUISpeedTitle = new Entity()
// let carUISpeedValue = new Entity()

// let carUIAnchor = new Entity()
// carUIAnchor.addComponent(
//     new Transform({
//       position: new Vector3(0.15, 0.2, 0.3),
//       rotation: Quaternion.Euler(0,0,0),
//       scale: new Vector3(0.2,0.2,0.2)
//     })
//   )
// carUIAnchor.setParent(carUIRoot)

// let carUISpeedTitleText = new TextShape()
// carUISpeedTitleText.value = "Speed: "
// carUISpeedTitleText.fontSize = 2

// let carUISpeedValueText = new TextShape()
// carUISpeedValueText.value = scene.currentSpeed.toString()
// carUISpeedValueText.fontSize = 2

// carUISpeedTitle.addComponent(carUISpeedTitleText)
// carUISpeedTitle.addComponent(
//     new Transform({
//       position: new Vector3(0, 0, 0)
//     })
//   )
// carUISpeedTitle.setParent(carUIAnchor)

// carUISpeedValue.addComponent(carUISpeedValueText)
// carUISpeedValue.addComponent(
//     new Transform({
//       position: new Vector3(0.5, 0, 0)
//     })
//   )
// carUISpeedValue.setParent(carUIAnchor)

// //carUIRoot.addComponent(gunShape)
// //carUIRoot.addComponent(new Billboard())
// carUIRoot.addComponent(
//   new Transform({
//     position: new Vector3(0, 0.0, 0.0),
//     rotation: Quaternion.Euler(0,0,0),
//     scale: new Vector3(1,1,1)
//   })
// )
// engineAddEntity(carUIRoot)
// carUIAnchor.setParent(carUIRoot)
// //carUIRoot.setParent(car)

// export function updateCarUISpeed(speed:number){
//     carUISpeedValueText.value = speed.toPrecision(2)
// }

// const carSpawner1 = new Entity()
// carSpawner1.addComponent(new BoxShape())
// carSpawner1.getComponent(BoxShape).withCollisions = false
// carSpawner1.getComponent(BoxShape).visible = true

// carSpawner1.addComponent(new Transform({ position: new Vector3(scene.sizeX/2, 2, scene.sizeZ/2), scale: new Vector3(0.25, 0.25, 0.25) }))
// carSpawner1.addComponent(
//   new OnPointerDown(
//     (e) => {
//       setPlayerDriving(true)
//     },
//     { hoverText: "Click to get in!", distance: 4}
//   )
// )
// engineAddEntity(carSpawner1)




@Component("skidMark")
export class SkidMark {   
}
export class WheelRotSystem {
    
    currentCar:BaseCar
    wheelSpeed = 0
    constructor(currentCar:BaseCar){
      this.currentCar = currentCar
    }
    update(dt: number){
      this.currentCar.updateWheels()  
      this.currentCar.updateTurbo()  
      this.currentCar.updateDriverRotation()
      
    }  
  }




  const checkIfPlayerInCarInterval = new IntervalUtil(CONFIG.ENTER_CAR_CHECK_FREQ_MILLIS)


export class EnterCarSystem implements ISystem {   

  currentCar:Car

  constructor(currentCar:Car){
    this.currentCar = currentCar
  }

  update(dt: number){
      
  //   if(!player.isDriving){
  //     if(distance(player.camera.position, this.currentCar.car.getComponent(Transform).position) < 1.5){
  //       player.isNearCar = true
  //       if(!this.currentCar.getInCarMarker.isAddedToEngine())
  //         engineAddEntity(this.currentCar.getInCarMarker)
  //     }
  //     else{
  //       player.isNearCar = false       
  //       if(this.currentCar.getInCarMarker.isAddedToEngine()){
  //         engine.removeEntity(this.currentCar.getInCarMarker)
  //       }
  //     }
  //   }
  //   // if player is driving don't let them leave the car
  //   else{
  //     if(distance(player.camera.position, this.currentCar.car.getComponent(Transform).position) > 0.1){
  //       movePlayerTo({ x: scene.sizeX/2, y: 0, z: scene.sizeZ/2 }, { x: scene.sizeX/2, y: 1, z: scene.sizeZ })        
  //     }
  //   } 
  // }
    
    if(checkIfPlayerInCarInterval.update(dt)){
      if(distance(player.camera.position, this.currentCar.car.getComponent(Transform).position) > 0.1){
        log("move player")
        movePlayerTo({ x: scene.sizeX/2, y: scene.inCarPlayerGroundElevation+scene.movePlayerYPadding, z: scene.sizeZ/2 }, { x: scene.sizeX/2, y: 1, z: scene.sizeZ })  
      }
    }
    
        
  }
}

const skidSoundSeperate = new IntervalUtil(CONFIG.SKID_SOUND_FREQ_MILLIS)



export class SkidMarkSystem {
  wheelSpeed = 0
  elapsedTime = 0
  spawnFrequency = 0.02
  lastPos = new Vector3(scene.center.x,scene.center.y,scene.center.z)
  currentPos = new Vector3
  carWheelVector1 = new Vector3( 0.23, 0, -0.33)
  carWheelVector2 = new Vector3(-0.23,0, -0.33)
  carWheelVector3 = new Vector3(0.23,0, 0.005)
  carWheelVector4 = new Vector3(-0.23,0, 0.005)
  group = engine.getComponentGroup(SkidMark,MovesWithWorld)

  currentCar:Car
  skidSpawner:SkidSpawner

  skidSoundPool:SoundPool[] = []

  constructor(currentCar:Car,skidSpawner:SkidSpawner){
    this.currentCar = currentCar
    this.skidSpawner = skidSpawner

    this.skidSoundPool.push(SOUND_POOL_MGR.skidChirp1)
    this.skidSoundPool.push(SOUND_POOL_MGR.skidChirp2)
    this.skidSoundPool.push(SOUND_POOL_MGR.skidChirp3)
    this.skidSoundPool.push(SOUND_POOL_MGR.skidChirp4)

  }
  update(dt: number){
    const carTransform = this.currentCar.car.getComponent(Transform)
    this.elapsedTime += dt
    
    //log("angle: " + Quaternion.Angle(worldState.worldMoveDirection,carTransform.rotation) )

    if(Quaternion.Angle(this.currentCar.driver.worldMoveDirection,carTransform.rotation) > 10 && this.elapsedTime > this.spawnFrequency ){

      player.isDrifting = true

      if(distance(carTransform.position, this.lastPos) > 0.3){
        this.currentPos = Vector3.Lerp(this.lastPos, carTransform.position, 0.2)
        let carRotation = new Quaternion().copyFrom(carTransform.rotation)
        this.carWheelVector1.rotate(carRotation)
        this.carWheelVector2.rotate(carRotation)
        this.carWheelVector3.rotate(carRotation)
        this.carWheelVector4.rotate(carRotation)

        
        this.skidSpawner.spawnEntity(this.currentPos.x + this.carWheelVector1.x, this.currentPos.y + 0.0001, this.currentPos.z + this.carWheelVector1.z, this.currentCar.driver.worldMoveDirection)
        this.skidSpawner.spawnEntity(this.currentPos.x + this.carWheelVector2.x, this.currentPos.y + 0.0001, this.currentPos.z + this.carWheelVector2.z, this.currentCar.driver.worldMoveDirection)
        this.skidSpawner.spawnEntity(this.currentPos.x + this.carWheelVector3.x, this.currentPos.y + 0.0001, this.currentPos.z + this.carWheelVector3.z, this.currentCar.driver.worldMoveDirection)
        this.skidSpawner.spawnEntity(this.currentPos.x + this.carWheelVector4.x, this.currentPos.y + 0.0001, this.currentPos.z + this.carWheelVector4.z, this.currentCar.driver.worldMoveDirection)

        //SOUND_POOL_MGR.skid.playOnce()
        //keep them apart by at at least 300 ms
        if(skidSoundSeperate.update(dt)){
          //SOUND_POOL_MGR.skid.playOnce()

          this.skidSoundPool[Math.floor(Math.random()*this.skidSoundPool.length)].playOnce()
        }
        
        this.elapsedTime = 0
        this.lastPos.copyFrom(carTransform.position)
        
        this.carWheelVector1.set(0.23, 0, -0.23)
        this.carWheelVector2.set(-0.23,0, -0.23)
        this.carWheelVector3 = new Vector3(0.23,0, 0.305)
        this.carWheelVector4 = new Vector3(-0.23,0, 0.305)
      }
    }
    else{
      player.isDrifting = false
    }
    if(player.currentSpeed <= 0.1){
      this.lastPos.copyFrom(carTransform.position)
    }
    
    this.lastPos.addInPlace(scene.worldMoveVector)

    for (let entity of this.group.entities) 
      {
        let transform = entity.getComponent(Transform)     
        let moveInfo = entity.getComponent(MovesWithWorld)     
  
        // TRACK REMOVE
        if(this.isOutOfBounds(transform.position))
        {
          this.skidSpawner.removeEntity(entity)
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
export class SkidSpawner extends AbstractMoveWithWorldSpawner {
  MAX_POOL_SIZE:number
  entityPool: Entity[]

  spawnEntity(x:number, y:number, z:number, rot:Quaternion) {
    const skid = this.getEntityFromPool()

    if (!skid) return

    let transform = skid.getComponentOrCreate(Transform)
    
    transform.position = new Vector3(x, y, z)        
    transform.rotation = rot
        
    transform.scale = new Vector3(1,1,1)
  
    if(!skid.hasComponent(GLTFShape))
    {
      skid.addComponent(skidmarkShape)
    }     
    skid.getComponentOrCreate(MovesWithWorld).active = true     
    skid.getComponentOrCreate(SkidMark) 

    if(skid.hasComponent(Hidden)){
      skid.removeComponent(Hidden) 
    }   

    //object.addComponent(new popInObject())    
    engineAddEntity(skid)    
  }
  
}
