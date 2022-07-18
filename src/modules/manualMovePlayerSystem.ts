import { Constants } from "./resources/globals";
import { scene } from "./scene";
//import { Constants.SCENE_MGR } from "./scene/raceSceneManager";
import { distance } from "./utilities";
//import { updateCarUISpeed } from "./car";


export class ManualMovePlayerSystem implements ISystem{
  
  enabled:boolean = true
  targetPosition:Vector3
  getTargetPosition:()=>Vector3
  onTargetReached:()=>void
  distanceThreshold:number = .0001

  reset(){
    this.enabled = false
  }
  update(dt: number) {
    if(!this.enabled){
     engine.removeSystem(this)
     return
    }

    const raceScene = Constants.SCENE_MGR.racingScene
    const startPos = this.targetPosition ? this.targetPosition : this.getTargetPosition()
    const dist = this.distance(startPos,scene.center)
    let lerpPercent = 5*dt
    if(dist < this.distanceThreshold){
      //log("ManualMovePlayerSystem there",dist)
      this.enabled = false
      engine.removeSystem(this)
      //lerpPercent = 1 //set it to 100% and do the work one more time
      if(this.onTargetReached) this.onTargetReached()
      return
    }
    
    let moveVect = startPos.subtract( scene.center )
    moveVect.scaleInPlace(-1)

    moveVect = Vector3.Lerp(Vector3.Zero(),moveVect, lerpPercent )
    
    //log("ManualMovePlayerSystem distance from",dist,moveVect,dt,lerpPercent)


    scene.worldMoveVector = moveVect
    scene.worldMoveVector.y = 0 //worldMoveDirection, Camera.instance.rotation, 3)          
    
    //worldMoveSystem will make changes to the hack of worldMoveVector so
    //calling only the update entity position method
    raceScene.worldMoveSystem.updateEntityPositions(scene.worldMoveVector)
    //this.trackSpawnSystem.update(0)
    
    const systems = raceScene.worldMoveVectorAwareSystems
    for(const p in systems){
      //worldMoveSystem will make changes to the hack of worldMoveVector so wont call it here
      if(raceScene.worldMoveSystem == systems[p]){
        //log("skip already ran for worldMoveSystem")
        continue
      }
      if(systems[p].active){
        systems[p].update(0)
      } else{
        log("skipping inactive " ,systems[p])
      }
    }
    
    /*if(lerpPercent >= 1 ){
      log("ManualMovePlayerSystem there",dist)
      this.enabled = false

      engine.removeSystem(this)
      if(this.onTargetReached) this.onTargetReached()
      return
    }*/
  }
  distance(target?: Vector3, curPos?: Vector3) {
    return distance(target ? target : this.getTargetPosition(),curPos ? curPos : scene.center)
  }
}