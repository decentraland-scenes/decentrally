import { scene } from './scene'
import { themeControl } from './themeData'
import { levelManager } from '../tracks/levelManager'


@Component("groundObject")
export class GroundObject {
  
}


export function createRaceGround():Entity{
  const groundMat = new Material()
  groundMat.albedoTexture = levelManager.getCurrentLevel().getTheme().groundTexture
  groundMat.metallic = 0.0
  groundMat.specularIntensity = 0.0
  groundMat.roughness = 1.0

  const groundPlaneShape = new PlaneShape() 
  groundPlaneShape.withCollisions = false
  groundPlaneShape.uvs = [
    0, 0,
    1, 0,
    1, 1,
    0, 1,
  //----
    0, 0,
    1, 0,
    1, 1,
    0, 1,
  ]
  const sceneRoot = new Entity()

  
  sceneRoot.addComponent(new Transform({position: new Vector3(scene.center.x,scene.center.y,scene.center.z),rotation: Quaternion.Euler(0,0,0)}))
  engine.addEntity(sceneRoot)

  const ground = new Entity()

  ground.addComponent(groundPlaneShape)
  ground.addComponent(new Transform({
  // position: sceneCenter,
    rotation: Quaternion.Euler(90,0,0),
    scale: new Vector3(scene.sizeX,scene.sizeZ,1)}))

    ground.addComponent(groundMat)

  ground.setParent(sceneRoot)

  ground.addComponent(new GroundObject())

  sceneRoot.getComponent(Transform).rotation = Quaternion.Euler(0,0,0)
  engine.addEntity(ground)

  return ground

}

export class GroundMoveSystem {
   
    UVMoveVector = new Vector2(0,0)
    
    group = engine.getComponentGroup(GroundObject)
  
    update(dt: number) {    
  
      for (let entity of this.group.entities) {
        const groundPlaneShape:PlaneShape = entity.getComponent(PlaneShape)
        // log("wW: " + worldState.worldMoveVector)
        //log("speed: " + worldState.currentSpeed)
        this.UVMoveVector.x += scene.worldMoveVector.x / scene.sizeX * scene.groundTilingFactor
        this.UVMoveVector.y -= scene.worldMoveVector.z /scene.sizeZ * scene.groundTilingFactor
    
        if(this.UVMoveVector.x > 2){
          this.UVMoveVector.x -=2
        }
        if(this.UVMoveVector.y > 2){
          this.UVMoveVector.y -=2
        }     
        groundPlaneShape.uvs = [    
    
          0, 0,      
          1, 0,      
          1, 1,      
          0, 1,
          
          //----
          this.UVMoveVector.x,
          this.UVMoveVector.y,
        
          this.UVMoveVector.x + scene.groundTilingFactor,
          this.UVMoveVector.y,
        
          this.UVMoveVector.x + scene.groundTilingFactor,
          this.UVMoveVector.y + scene.groundTilingFactor,
        
          this.UVMoveVector.x,
          this.UVMoveVector.y + scene.groundTilingFactor,
        ]
      }
    }  
  }
  
  // Add a new instance of the system to the engine
  //MOVED TO src/modules/scene/race.ts
  //engine.addSystem(new GroundMoveSystem())
  