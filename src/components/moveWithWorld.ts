 
@Component("movesWithWorld")
export class MovesWithWorld {
  worldPosition: Vector3
  worldSpeed: number
  originalScale: number
  speedFraction: number
  active: boolean
  hidePos: Vector3

  constructor(){
    this.reset()
  }
  reset(){
    this.worldPosition = new Vector3(0,0,0)
    this.worldSpeed = 5 
    this.originalScale = 1 
    this.speedFraction = 1 
    this.active = true
    this.hidePos = new Vector3(8,-20,8)
  }
  setActive(active:boolean){
    const triggered = this.active != active
    this.active = active
    if(triggered){
      /*
      if(active){
        this.onActivate()
      }else{
        this.onDeactivate()
      }*/
    }
  }
}

@Component("RemovedAtBoundaries")
export class RemovedAtBoundaries {  
  radius: number = 4
}

@Component("MarkedForRemoval")
export class MarkedForRemoval {    
}

@Component("shapeManager")
export class shapeManager {  
  shape: GLTFShape
  entity: Entity
  worldPosition: Vector3
  initialPosition: Vector3
}

@Component("vehicleObject")
export class VehicleObject {
  position: Vector3
}


