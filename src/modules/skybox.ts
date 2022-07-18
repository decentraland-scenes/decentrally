import { Level } from "src/tracks/levelManager";
import { scene  } from "./scene";


export class SkyBoxControl{
 fogSphereShape:GLTFShape
 skyBoxTexture:Texture
 skyLineBigTexture:Texture
 skylineSmallTexture:Texture
 skyBoxTopTexture:Texture

  horizonSphere:Entity
  skyboxNorth:Entity
  skyboxSouth:Entity
  skyboxEast:Entity
  skyboxWest:Entity
  skylineWestSmall:Entity
  skyboxTop:Entity
  fogSphere2:Entity
  fogSphere3:Entity

  constructor(){
    this.fogSphereShape =    new GLTFShape('models/fogSphere.glb')
    this.skyBoxTexture = new Texture('textures/skybox.png', {samplingMode: 0, wrap: 1})
    this.skyBoxTopTexture = new Texture('textures/skyboxTop.png', {samplingMode: 2})

    this.horizonSphere = new Entity()
    this.skyboxNorth = new Entity()
    this.skyboxSouth = new Entity()
    this.skyboxEast = new Entity()
    this.skyboxWest = new Entity()
    this.skylineWestSmall = new Entity()
    this.skyboxTop = new Entity()
    this.fogSphere2 = new Entity()
    this.fogSphere3 = new Entity()

    const skyBoxMat = new BasicMaterial()
    skyBoxMat.texture = this.skyBoxTexture


    const skyBoxTopMat = new BasicMaterial()
    skyBoxTopMat.texture = this.skyBoxTopTexture


    let skylinePlaneBigWest = new PlaneShape()
    skylinePlaneBigWest.withCollisions = false 

    let skylinePlaneSmallWest = new PlaneShape()
    skylinePlaneSmallWest.withCollisions = false 

    //SKYBOX PLANES
    this.skyboxNorth.addComponent(new Transform({
      position: new Vector3(scene.sizeX/2, scene.raceGroundElevation + scene.sizeX/8, scene.sizeZ),
      rotation: Quaternion.Euler(0,0,180),
      scale: new Vector3(scene.sizeX,scene.sizeX/4,1)
    }))
    this.skyboxNorth.addComponent(new PlaneShape()).withCollisions = false
    this.skyboxNorth.addComponent(skyBoxMat)

    this.skyboxSouth.addComponent(new Transform({
      position: new Vector3(scene.sizeX/2, scene.raceGroundElevation + scene.sizeX/8, 0),
      rotation: Quaternion.Euler(0,180,180),
      scale: new Vector3(scene.sizeX,scene.sizeX/4,1)
    }))
    this.skyboxSouth.addComponent(new PlaneShape()).withCollisions = false
    this.skyboxSouth.addComponent(skyBoxMat)

    this.skyboxEast.addComponent(new Transform({
      position: new Vector3(scene.sizeX, scene.raceGroundElevation + scene.sizeX/8, scene.sizeZ/2),
      rotation: Quaternion.Euler(0,90,180),
      scale: new Vector3(scene.sizeX,scene.sizeX/4,1)
    }))
    this.skyboxEast.addComponent(new PlaneShape()).withCollisions = false
    this.skyboxEast.addComponent(skyBoxMat)

    this.skyboxWest.addComponent(new Transform({
      position: new Vector3(0, scene.raceGroundElevation + scene.sizeX/8, scene.sizeZ/2),
      rotation: Quaternion.Euler(0,270,180),
      scale: new Vector3(scene.sizeX,scene.sizeX/4,1)
    }))
    this.skyboxWest.addComponent(skylinePlaneBigWest)
    this.skyboxWest.addComponent(skyBoxMat)


    this.skyboxTop.addComponent(new Transform({
      position: new Vector3(scene.sizeX/2, scene.raceGroundElevation + scene.sizeX/4, scene.sizeZ/2),
      rotation: Quaternion.Euler(90,0,0),
      scale: new Vector3(scene.sizeX,scene.sizeZ,1)
    }))
    this.skyboxTop.addComponent(new PlaneShape()).withCollisions = false
    this.skyboxTop.addComponent(skyBoxTopMat)

    // engine.addEntity(skyboxNorth)
    // engine.addEntity(skyboxSouth)
    // engine.addEntity(skyboxEast)
    // engine.addEntity(skyboxWest)  
    // engine.addEntity(skyboxTop) 

    // FOG PLANES
    this.fogSphere2.addComponent(new Transform({
      position: new Vector3(scene.sizeX/2, scene.raceGroundElevation - 0.2, scene.sizeZ/2), 
      rotation: Quaternion.Euler(0,0,0),
      scale: new Vector3(scene.sizeX/2, scene.sizeX/5, scene.sizeX/2)  
    }) )
    this.fogSphere2.addComponent(this.fogSphereShape)

    this.fogSphere3.addComponent(new Transform({
      position: new Vector3(scene.sizeX/2, scene.raceGroundElevation, scene.sizeZ/2), 
      rotation: Quaternion.Euler(0,0,0),
      scale: new Vector3(scene.sizeX/2.4, scene.sizeX/5, scene.sizeX/2.4)  
    }) )
    this.fogSphere3.addComponent(this.fogSphereShape)

  }

  updateFromLevel(level:Level){
    
    //TODO if need different UI per level do it here... level.getTheme()
    this.skyboxEast.getComponent(BasicMaterial).texture = level.getTheme().skyboxTexture   
    this.skyboxWest.getComponent(BasicMaterial).texture = level.getTheme().skyboxTexture   
    this.skyboxNorth.getComponent(BasicMaterial).texture = level.getTheme().skyboxTexture   
    this.skyboxSouth.getComponent(BasicMaterial).texture = level.getTheme().skyboxTexture   
      

  }
  AddSkybox(){
    
    if(!this.fogSphere2.alive)
      engine.addEntity(this.fogSphere2)
    if(!this.fogSphere3.alive)
      engine.addEntity(this.fogSphere3)
    if(!this.skyboxNorth.alive)
      engine.addEntity(this.skyboxNorth)
    if(!this.skyboxSouth.alive)
      engine.addEntity(this.skyboxSouth)
    if(!this.skyboxEast.alive)
      engine.addEntity(this.skyboxEast)
    if(!this.skyboxWest.alive)
      engine.addEntity(this.skyboxWest)
    if(!this.skyboxTop.alive)
      engine.addEntity(this.skyboxTop)
  
  }
  
  RemoveSkybox(){
      if(this.fogSphere2.alive)
          engine.removeEntity(this.fogSphere2)
      if(this.fogSphere3.alive)
          engine.removeEntity(this.fogSphere3)
      if(this.skyboxNorth.alive)
        engine.removeEntity(this.skyboxNorth)
      if(this.skyboxSouth.alive)
        engine.removeEntity(this.skyboxSouth)
      if(this.skyboxEast.alive)
        engine.removeEntity(this.skyboxEast)
      if(this.skyboxWest.alive)
        engine.removeEntity(this.skyboxWest)      
      if(this.skyboxTop.alive)
        engine.removeEntity(this.skyboxTop)
      
  }
}









