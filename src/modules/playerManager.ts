import { CommonResources } from "src/resources/common"
import { BaseCar, EnemyCar } from "./car"
import { defaultCar, findCarModelById, mercedesAltTest } from "./carData"
import { PlayerBase, PlayerState, scene } from "./scene"
import { loadOnSceneStartThenRemove } from "./scene-utilities"

export class PlayerEntities{
    main:Entity
    marker:Entity
    car:Entity
    data:Entity
    markerFace:Entity
}
export class Player{
    id:string
    //sceneState:PlayerState
    //name:string
    entities:PlayerEntities = new PlayerEntities()
    avatarTexture?:AvatarTexture
    closestProjectedPointCache:Vector3=new Vector3()//avoid making over and over, MOVE TO CACHE OBJECT
    car:BaseCar
    state:PlayerBase
    //serverState:clientState.PlayerState

}
export class Enemy extends Player{
    updateCarModelById(carModelId: string) {
        this.state.carModelId = carModelId
        if(this.car){
            this.car.updateCarData( findCarModelById(carModelId) )
        }
    }
    removeFromEngine() {
        const entities = [this.entities.car,this.entities.main,this.entities.marker,this.entities.data]
        for(const p in entities){
            const ent = entities[p]
            if( ent && ent.alive ) engine.removeEntity(ent)
        }
    }
    getEnemyData(){
        const playerEnt = this.entities.data
        
        return playerEnt.getComponent(EnemyData)
    }
    setName(name:string){
        //this.name = name
        this.state.name = name
        const marker = this.entities.marker
        marker.getComponent(TextShape).value = this.state.name
    }
}


let carBodyShape =  new GLTFShape('models/car_mercedes_test.glb')

loadOnSceneStartThenRemove(carBodyShape,carBodyShape.src)


let markerMat = CommonResources.RESOURCES.materials.enemyMarkerTexture

@Component("enemyData")
export class EnemyData { 
  color: Color3 = Color3.Green() 
  worldPos: Vector3 = new Vector3(scene.center.x,scene.center.y,scene.center.z) 
  worldRot: Quaternion = new Quaternion()
  targetWorldPos: Vector3 = new Vector3(scene.center.x,scene.center.y,scene.center.z) 
  targetWorldRot: Quaternion = new Quaternion()
  playerId:string
}


export interface PlayerManager<T extends Player> {
    createInstance():T
}
export abstract class PlayerManagerSupport<T extends Player> implements PlayerManager<T> {
    players:Record<string,T>
    
    constructor(){
        this.players = {}
    }

    abstract createInstance():T

    addPlayer(id:string):T{
        let player = this.createInstance()
        player.id = id
        this.players[id] = player

       return player
    }
    removeAllPlayers(){
        for(const p in this.players){
            this.removePlayer(p)
        }
    }
    removePlayer(id:string):T{
        const player = this.players[id]
        delete this.players[id]
        return player
    }
    getPlayerByID(_id:string):T{
        let result = this.players[_id]
       
        return result
    }
    updatePlayerPos(_id:string, posX:number, posY:number, posZ:number, rotX:number, rotY:number, rotZ:number, rotW:number){

        // let enemy = this.getEnemyByID(_id)
        // if(enemy != null){
        //     enemy.updatePos(posX, posY, posZ, rotX, rotY, rotZ, rotW)
        // }
        
    }

}

export class CalculationCache{
    id:string
    //worldMoveDirection:Quaternion
    //shootDirection:Quaternion
    //cameraDirection:Quaternion
    sceneMoveVector:Vector3
    sceneMoveTransform:Transform
    constructor(id:string){
        this.id = id
    }

    init(){
        this.sceneMoveVector = new Vector3
        this.sceneMoveTransform = new Transform( {position:new Vector3()} )
        //this.worldMoveDirection = new Quaternion()
        //this.shootDirection = new Quaternion()
        //this.cameraDirection = new Quaternion()
    }
}
export class EnemyManager extends PlayerManagerSupport<Enemy> {
    
    
    calculationCache:Record<string,CalculationCache>={}

    constructor(){
        super()
    }
    createInstance():Enemy{
        return new Enemy()
    }

    removePlayer(id: string): Enemy {
        const player = super.removePlayer(id)

        delete this.calculationCache[id]

        if(player){
            player.setName(player.state.name + "-LEFT!!")
        }
        player.removeFromEngine()
        return player
    }
    getDebugLatanciesArray(){
        const arr=[]
        for(let p in this.players){
            const pl = this.players[p]
            arr.push( { name:pl.state.name, latency:pl.state.latencyAvg } )
        }
        return arr;
    }
    addEnemy(id:string, pos:Vector3, color:Color3, playerState:PlayerBase ):Enemy{
        log("addEnemy",[id,playerState,pos,color,playerState])
        const player = super.addPlayer(id)

        this.calculationCache[id] = new CalculationCache(id)
        this.calculationCache[id].init()

        player.state = playerState

        let enemy = new Entity()
        let shapeEnt = new Entity()
        let carEnt = new Entity()

        let car = new EnemyCar(id, findCarModelById(playerState.carModelId,defaultCar))
        car.driver = player.state
        car.init()


        let shape:Shape = carBodyShape
        shape.withCollisions = false

        //enemy.addComponent(shape)
        //enemy.addComponent(new Transform({position: pos}))
        const enemyData = new EnemyData()
        enemy.addComponent(enemyData)
        //store id or whole object???
        enemyData.playerId = id
        enemyData.worldPos.copyFrom(pos)
        enemyData.targetWorldPos.copyFrom(pos)
        //enemy.addComponent(new movesWithWorld())
        engine.addEntity(enemy)

        shapeEnt.addComponent(new Transform({position: new Vector3(scene.center.x,0,scene.center.z), rotation: Quaternion.Euler(0,0,180)}))
        //
         

        let marker = new Entity()

        marker.addComponent(new Transform({position: new Vector3(0,.4,0), rotation: Quaternion.Euler(0,0,180)}))
        marker.addComponent(new Billboard(false,true,false))
        let enemyTextShape = new TextShape()
        enemyTextShape.value = playerState.name
        enemyTextShape.fontSize = 3
        enemyTextShape.outlineColor = Color3.Black()
        enemyTextShape.outlineWidth = 0.2

        marker.addComponent(enemyTextShape)
        marker.addComponent(markerMat)

        marker.setParent(shapeEnt)

        
        if(playerState.userId){
            log("addEnemy.playerState.userId adding avatar picture",playerState.userId)
            let markerFace = new Entity()

            markerFace.addComponent(new Transform({position: new Vector3(0,-.1,0),scale:new Vector3(.5,-.5,.5), rotation: Quaternion.Euler(0,0,180)}))
            markerFace.addComponent(new PlaneShape()).withCollisions = false
            markerFace.addComponent(new Billboard(false,true,false))

            //FIXME, not working for non web3 locally?? is it just local issue or broke for all web3?
            let myAvatarTexture = new AvatarTexture(playerState.userId)
            const myMaterial = new Material()
            myMaterial.albedoTexture = myAvatarTexture
            myMaterial.alphaTexture = CommonResources.RESOURCES.textures.transparent.texture
            myMaterial.alphaTest=1
            markerFace.addComponent(myMaterial)

            markerFace.setParent(shapeEnt)

            player.entities.markerFace = markerFace
            player.avatarTexture = myAvatarTexture
        }else{
            log("addEnemy.playerState.userId missing, not adding avatar picture",playerState.userId)
        }
        carEnt.addComponent(new Transform({position: new Vector3(0,-1,0)}))
        carEnt.setParent(shapeEnt)
        //car.addComponent(shape)
        //car.addComponent(new Transform({position: new Vector3(0,0,0), rotation: Quaternion.Euler(0,0,180)}))
        car.car.setParent(carEnt)  
         


        engine.addEntity(shapeEnt)

        //shapeEnt.addComponent(shape)
        //shapeEnt.setParent(marker)
        //enemy.addComponent(new Transform({position: pos}))
        

        player.entities.data = enemy
        player.entities.main = shapeEnt
        player.car = car
        player.entities.marker = marker
        //player.entities.car = car
        //enemyPlayer.push(enemy)
        //enemyMarker.push(marker)


        return player
    }
    
}

export const ENEMY_MGR = new EnemyManager()