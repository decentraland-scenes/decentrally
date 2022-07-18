import { EnemyData, ENEMY_MGR } from "./playerManager";
import { scene } from "./scene";


//let enemyPlayer = []
//let enemyMarker = []





  
export class EnemyUpdateSystem {  

  group = engine.getComponentGroup(EnemyData)

  update(dt: number){

    for (let entity of this.group.entities) {
      const enemyPosData = entity.getComponent(EnemyData)      
      enemyPosData.worldPos.addInPlace(scene.worldMoveVector)
      enemyPosData.targetWorldPos.addInPlace(scene.worldMoveVector) 
   
      enemyPosData.worldPos = Vector3.Lerp( enemyPosData.worldPos, enemyPosData.targetWorldPos, 5*dt )  
      enemyPosData.worldRot = Quaternion.Slerp( enemyPosData.worldRot, enemyPosData.targetWorldRot , 5*dt)

      //was not sure if using hte method is this fast enough? or need direct reference?  using direct access to players
      const enemy = ENEMY_MGR.players[enemyPosData.playerId]//ENEMY_MGR.getPlayerByID( enemyPosData.playerId )
      if(enemy && enemy.car.visible){
        enemy.car.updateTurbo()
        enemy.car.updateWheels() //TODO must fix state to share all values for this to work
        enemy.car.updateDriverRotation()
      }else{
        //log("enemy car not visible",enemy.state.name)
      }
      //scene.worldMoveVector = new Vector3(0,0,-1*player.currentSpeed * dt).rotate(this.worldMoveDirection)
      //const playerMoveVector = new Vector3(0,0,-1*enemyPosData.currentSpeed * dt).rotate(enemyPosData.worldMoveDirection)
      //scene.worldMoveVector = scene.worldMoveVector.multiplyByFloats( 1, 0, 1)//zero out Y
    }
  }

}
//MOVED TO src/modules/scene/race.ts
//engine.addSystem(new EnemyUpdateSystem()) 

export class EnemyMarkerSystem {  

 // markerLookPoint = new Vector3(scene.sceneCenter.x, scene.sceneCenter.y+0.75,scene.sceneCenter.z)

  update(dt: number){

    //for(let i = 0; i< enemyPlayer.length; i++)
    for( const p in ENEMY_MGR.players)
    {
        const player = ENEMY_MGR.players[p]
        const playerEnt = player.entities.main
        //const playerEnt = player.entities.main
        const enemyData = player.getEnemyData()
        let enemyWorldPos = enemyData.worldPos
        let enemyWorldRot = enemyData.worldRot
        let enemyPosVector = enemyWorldPos.subtract(scene.center)
         

        //if enemy is inside scene boudaries, put player marker above it directly
        if(Math.abs(enemyPosVector.x) < scene.sizeX/2 && Math.abs(enemyPosVector.z) < scene.sizeZ/2){
            
            //if(!player.visible){
            //manually operate visible for performance
            player.car.visible = true
            //}

            playerEnt.getComponent(Transform).position.set(enemyWorldPos.x, scene.raceGroundElevation + 1.0, enemyWorldPos.z)
            playerEnt.getComponent(Transform).rotation.copyFrom( enemyWorldRot )

           // engine.addEntity(enemyPlayer[i])
        }
        //if enemy is out of bounds, put its player marker along edge of scene
        else{
            //manually operate visible for performance
            player.car.visible = false

            //engine.removeEntity(enemyPlayer[i])
            let u = Math.max(Math.abs(enemyPosVector.x), Math.abs(enemyPosVector.z))
            let xp = (enemyPosVector.x/u) * scene.sizeX/2.2
            let zp = (enemyPosVector.z/u) * scene.sizeZ/2.2  
            playerEnt.getComponent(Transform).position.set(scene.center.x + xp, scene.raceGroundElevation + 0.5,  scene.center.z + zp)
            //player.car.h
        }

        //enemyMarker[i].getComponent(Transform).lookAt(this.markerLookPoint,Vector3.Up())
        //pMarker.getComponent(Transform).rotate(Vector3.Up(),180)
    }

  }
}
//MOVED TO src/modules/scene/race.ts
//engine.addSystem(new EnemyMarkerSystem())