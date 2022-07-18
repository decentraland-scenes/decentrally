import * as sfx from "../resources/sounds";
import * as utils from '@dcl/ecs-scene-utils'
import { UserData } from "@decentraland/Identity"
import { CONFIG } from "src/config"
import { CommonResources } from "src/resources/common"
import { levelManager } from 'src/tracks/levelManager'
import {  Car, SkidSpawner } from "../car"
import { CarData, defaultCar } from "../carData"
import { joinOrCreateRoom } from "../connection/connect-flow"
import { disconnect } from "../connection/connection"
import { updateLeaderboard } from "../connection/onConnect"
import { PlayerButtonState, RaceDataOptions } from "../connection/state/server-state-spec"
import { EnemyMarkerSystem, EnemyUpdateSystem } from "../enemies"
import { createRaceGround, GroundMoveSystem } from "../ground"
import { ManualMovePlayerSystem } from "../manualMovePlayerSystem"
import { ENEMY_MGR } from "../playerManager"
import { Projectile, ProjectileSystem } from "../projectiles"
import { ClosestTrackSystem } from "../race"
import { Constants } from '../resources/globals'
import { player, PlayerBase, ResetWorld,  scene as SceneData } from '../scene'
import { GAME_STATE, PlayerState } from "../state"
import { createFinishFlag, createStartPosition, createTrackFeature, setStartPositionEntity, setTrackFeaturePosition,  TrackSpawner,  TrackSpawnSystem, TRACK_FEATURE_LAYER_1 } from "../trackPlacement"
import { Game_2DUI } from "../ui/index"
import { getAndSetUserData, getUserDataFromLocal } from "../userData"
import { distance } from "../utilities"
import { VehicleMoveSystem, WorldMoveSystem } from "../worldMoveEngine"
//import { Constants.SCENE_MGR } from "./raceSceneManager"
import { EntityWrapper, SceneEntity, SubScene, VisibilityStrategyEnum, VisibleChangeType } from "./subScene"
import * as serverSpec from '../connection/state/server-state-spec';
import { IntervalUtil } from '../interval-util'
import { SkyBoxControl } from '../skybox'
import { TrackFeatureComponent } from '../trackFeatures'
import { SOUND_POOL_MGR } from '../resources/sounds'
import { fullBoostTimer, fullProjectileTimer, ItemRechargeSystem } from "../itemRecharger";
import { StarSpawner, StarTrailSystem } from "../trail";
import { movePlayerTo } from "@decentraland/RestrictedActions";
import { BoxedInPlatflormUsingPrimitives, BoxedInPlatflormUsingModel } from "../platform";
 

const input = Input.instance

const playerButtons:PlayerButtonState={
  forward:false,backward:false,left:false,right:false,shoot:false
}
function updateStateButtons(){
  playerButtons.forward = player.MOVE_FORWARD
  playerButtons.shoot = player.shoot_btn_down
  if(GAME_STATE.gameRoom){
    GAME_STATE.gameRoom.send("player.buttons.update",playerButtons)
  }
} 

const groundThickness = CONFIG.GROUND_THICKNESS
const showInivisibleGroundColliders = CONFIG.showInivisibleGroundColliders
    
const nearbySpawningPad = new Entity("raceArea.nearbySpawningPad")
const preventJumpingCollider = new Entity("raceArea.preventJumpingCollider")
const nearbySpawnPadStartPos =  new Vector3(SceneData.center.x, SceneData.inCarPlayerGroundElevation+(SceneData.startPlayerWayAboveRacePosYPad)- groundThickness/2, SceneData.center.z)// - 1) //diagnal downward not great. so minimal backwards
//const nearbySpawnPadEndPos = new Vector3(SceneData.center.x, SceneData.inCarPlayerGroundElevation+ groundThickness/2, SceneData.center.z)
//move to above the car collider to drop them into it or will intersect colliders
const nearbySpawnPadEndPos = new Vector3(SceneData.center.x, (SceneData.startPlayerWayAboveRacePosYPad > 0 ? SceneData.raceGroundElevation : SceneData.inCarPlayerGroundElevation)+ groundThickness/2, SceneData.center.z)

const nearbySpawningPad2 = new BoxedInPlatflormUsingModel(nearbySpawningPad,false)
nearbySpawningPad2.activatePlatform()


const RACING_PLAYER_STANDON_GROUND_COLLIDER = new BoxShape()
const PREVENT_PLAYER_JUMP_COLLIDER = new BoxShape()
const LOWER_PLAYER_SLOWLY_COLLIDER = new BoxShape()

function createHiddenGroundToStandOn(){
  const groundShape = new BoxShape()
    groundShape.withCollisions = true

    //workaround nearby spawn location in attempt to hide the blooming affect (out of camera view)
    nearbySpawningPad.addComponentOrReplace(new Transform({
      position: nearbySpawnPadStartPos.clone(),
      //scale:  new Vector3( 8,groundThickness,8 )
    })
    )
    const nearbySpawningPadChild = new Entity("raceArea.preventJumpingColliderPl")
    nearbySpawningPadChild.addComponentOrReplace(new Transform({
      scale:  new Vector3( 8,groundThickness,8 )
    })
    )
    nearbySpawningPadChild.addComponentOrReplace(LOWER_PLAYER_SLOWLY_COLLIDER)
    nearbySpawningPadChild.setParent(nearbySpawningPad)
    if(!showInivisibleGroundColliders) nearbySpawningPadChild.addComponent(CommonResources.RESOURCES.materials.transparent)
    
    
    
    
    engine.addEntity(nearbySpawningPad)


     //workaround nearby spawn location in attempt to hide the blooming affect (out of camera view)
     preventJumpingCollider.addComponentOrReplace(new Transform({
      position: new Vector3(SceneData.center.x, SceneData.preventJumpColliderYPos + groundThickness/2, SceneData.center.z),
      scale:  new Vector3( .2,.05,.2 )
    })
    )
    preventJumpingCollider.addComponentOrReplace(PREVENT_PLAYER_JUMP_COLLIDER)
    if(!showInivisibleGroundColliders) preventJumpingCollider.addComponent(CommonResources.RESOURCES.materials.transparent)
    engine.addEntity(preventJumpingCollider)
    
    const inCarPlayerGround = new Entity("player.in.car.ground")
    inCarPlayerGround.addComponent(new Transform( {
      position: new Vector3( SceneData.center.x,SceneData.inCarPlayerGroundElevation - groundThickness/2,SceneData.center.z ),
      scale:  new Vector3( 8,groundThickness,8 )
    } ))
    inCarPlayerGround.addComponent(RACING_PLAYER_STANDON_GROUND_COLLIDER)
    if(!showInivisibleGroundColliders) inCarPlayerGround.addComponent(CommonResources.RESOURCES.materials.transparent)
    engine.addEntity(inCarPlayerGround)


    const groundForPlayerY = SceneData.raceGroundElevation - groundThickness/2 

    const groundForPlayer1 = new Entity("race.ground.1")
    groundForPlayer1.addComponent(new Transform( {
      position: new Vector3( SceneData.center.x/2  - SceneData.carWidth,groundForPlayerY,SceneData.center.z ),
      scale:  new Vector3( SceneData.sizeX/2 - SceneData.carWidth*2,groundThickness,SceneData.sizeX )
    } ))
    groundForPlayer1.addComponent(groundShape)
    if(!showInivisibleGroundColliders) groundForPlayer1.addComponent(CommonResources.RESOURCES.materials.transparent)
    engine.addEntity(groundForPlayer1)
    

    const groundForPlayer4 = new Entity("race.ground.4") 
    groundForPlayer4.addComponent(new Transform( {
      position: new Vector3( SceneData.center.x  - SceneData.carWidth  ,groundForPlayerY, SceneData.center.z + SceneData.center.z/2 ),
      scale:  new Vector3( SceneData.sizeX/2 - SceneData.carWidth*2 ,groundThickness,SceneData.sizeX/2 - SceneData.carWidth*4 )
    } ))
    groundForPlayer4.addComponent(groundShape)
    if(!showInivisibleGroundColliders) groundForPlayer4.addComponent(CommonResources.RESOURCES.materials.transparent)
    engine.addEntity(groundForPlayer4)


    const groundForPlayer3 = new Entity("race.ground.3") 
    groundForPlayer3.addComponent(new Transform( {
      position: new Vector3( SceneData.center.x + SceneData.center.x/2 + SceneData.carWidth  ,groundForPlayerY, SceneData.center.z + SceneData.center.z/2 - SceneData.carWidth*4 ),
      scale:  new Vector3( SceneData.sizeX/2 - SceneData.carWidth*2 ,groundThickness,SceneData.sizeX/2 + SceneData.carWidth*4 )
    } ))
    groundForPlayer3.addComponent(groundShape)
    if(!showInivisibleGroundColliders) groundForPlayer3.addComponent(CommonResources.RESOURCES.materials.transparent)
    engine.addEntity(groundForPlayer3)

    const groundForPlayer2 = new Entity("race.ground.2")
    groundForPlayer2.addComponent(new Transform( {
      position: new Vector3( SceneData.center.x  ,groundForPlayerY ,SceneData.center.z/2 - SceneData.carWidth ),
      scale:  new Vector3( SceneData.sizeX ,groundThickness,SceneData.sizeX/2 - SceneData.carWidth*2 )
    } ))
    groundForPlayer2.addComponent(groundShape)
    if(!showInivisibleGroundColliders) groundForPlayer2.addComponent(CommonResources.RESOURCES.materials.transparent)
    engine.addEntity(groundForPlayer2)
}

//TODO sync with server
//TODO make these better and time based, this is quick and dirty enablement
//time based as in after X time u get another one if u wait 2x time u get 2 until capp reached
const projectileShootCooldown = new IntervalUtil(CONFIG.PROJECTILE_SHOOT_COOLDOWN_MS,'abs-time')
//const projectileReloadtime = new IntervalUtil(CONFIG.PROJECTILE_RELOAD_TIME,'abs-time')

const boostCooldown = new IntervalUtil(CONFIG.BOOSTERS_COOLDOWN_MS,'abs-time')
//const boostReloadTime = new IntervalUtil(CONFIG.BOOSTERS_RELOAD_TIME,'abs-time')

function registerInputHandlers(){
  // button down event
  input.subscribe("BUTTON_DOWN", ActionButton.POINTER, false, e => {
    //log("pointer POINTER Down", e)  
    
    if(player.isDriving){
       
      if(projectileShootCooldown.update()){
        //if(projectileReloadtime.update()){
        //  player.projectileCount = CONFIG.PROJECTILE_MAX_RELOAD_AMOUNT
          //Game_2DUI.updateProjectileBar(player.projectileCount,CONFIG.PROJECTILE_MAX_RELOAD_AMOUNT)
        //}
        if(player.projectileTimer > CONFIG.PROJECTILE_RELOAD_TIME){
          //TODO MOVE THIS TO A OBJECT FACTORY TO REUSE
          let rocket = new Projectile({position: new Vector3(SceneData.sizeX/2, SceneData.raceGroundElevation + 0.25,SceneData.sizeZ/2), scale: new Vector3(1, 1, 1)}, Vector3.Forward().rotate(player.shootDirection).normalize(),20)
          player.projectileTimer -= CONFIG.PROJECTILE_RELOAD_TIME
          //player.projectileCount--
          //Game_2DUI.updateProjectileBar(player.projectileCount,CONFIG.PROJECTILE_MAX_RELOAD_AMOUNT)
        }
      }
      

      //EXPERIMENTAL DISABLED FOR NOW '
      //need to refactor how track feature works before doing this
      /*
      const addTF:serverSpec.TrackFeatureUpdate = {
        name: "slow-down."+player.name +"."+ player.closestSegmentID + player.closestSegmentPercent,
        type: "slow-down",
        activateTime: Date.now() + 500,//so does not hit player
        position: {
          startSegment: player.closestSegmentID + player.closestSegmentPercent,
          endSegment:player.closestSegmentID,
          centerOffset: player.closestSegmentDistance  * -1 //FIXME for some reason its inverted?!?!? its used for enemy position so need to look into it before changing,
        }
      }
      GAME_STATE.gameRoom.send("levelData.trackFeature.add",addTF)
      */
      player.shoot_btn_down = true
      updateStateButtons()
    }
    
  })
  input.subscribe("BUTTON_UP", ActionButton.POINTER, false, e => {
    //log("pointer POINTER Down", e)  
    
    if(player.isDriving){
      //let rocket = new Projectile({position: new Vector3(SceneData.sizeX/2, SceneData.raceGroundElevation + 0.25,SceneData.sizeZ/2), scale: new Vector3(1, 1, 1)}, Vector3.Forward().rotate(player.shootDirection).normalize(),20)

      player.shoot_btn_down = false
      updateStateButtons()
    }
    
  })


  input.subscribe("BUTTON_DOWN", ActionButton.FORWARD, false, e => {
  // log("pointer PRIMARY Down", e)
    if(player.isDriving){
      player.MOVE_FORWARD = true
      //if(player.serverState) player.serverState.buttons.forward = player.MOVE_FORWARD
      updateStateButtons()
    }/*
    else if(player.isNearCar){
      car.setPlayerDriving(true)
    }*/
  })  

  // button up event
  input.subscribe("BUTTON_UP", ActionButton.FORWARD, false, e => {
  // log("pointer PRIMARY Up", e)
    if(player.isDriving){
      player.MOVE_FORWARD = false
      //if(player.serverState) player.serverState.buttons.forward = player.MOVE_FORWARD
      updateStateButtons()
    }
  })

  // button up event
  input.subscribe("BUTTON_DOWN", ActionButton.BACKWARD, false, e => {
    if(player.isDriving){
      //FIXME dont enable till working right 
      //player.MOVE_BACKWARD = true
    
      updateStateButtons()

      //workaround for now
      player.appliedSlowdownFriction = Math.min(player.appliedSlowdownFriction+SceneData.DRAG_MAX,SceneData.DRAG_MAX)
    }
  })
  input.subscribe("BUTTON_UP", ActionButton.BACKWARD, false, e => {
    if(player.isDriving){
      //FIXME dont enable till working right 
      //player.MOVE_BACKWARD = false

      updateStateButtons()
    }
  })
  
  // button down event
  input.subscribe("BUTTON_DOWN", ActionButton.SECONDARY, false, e => {
  // log("pointer SECONDARY Down", e)
    //scene.MOVE_BACKWARD = true
    player.appliedSlowdownFriction = SceneData.DRAG_MAX
  })


  // button down event
  input.subscribe("BUTTON_DOWN", ActionButton.PRIMARY, false, e => {
    // log("pointer SECONDARY Down", e)
      //scene.MOVE_BACKWARD = true

      if(boostCooldown.update()){
        //if(boostReloadTime.update()){
        //  player.boosterCount = CONFIG.BOOSTERS_MAX_RELOAD_AMOUNT
          //Game_2DUI.updateBoostBar(player.boosterCount,CONFIG.BOOSTERS_MAX_RELOAD_AMOUNT)
        //}
        if(player.boostReloadTimer > CONFIG.BOOSTERS_RELOAD_TIME){
          player.appliedBoostFriction = -1 * SceneData.BOOST_MAX
          SOUND_POOL_MGR.boost.playOnce()
          //player.boosterCount--
          player.boostReloadTimer -= CONFIG.BOOSTERS_RELOAD_TIME
          //Game_2DUI.updateBoostBar(player.boosterCount,CONFIG.BOOSTERS_MAX_RELOAD_AMOUNT)
        }
      }
      
      
    })

  // button up event
  input.subscribe("BUTTON_UP", ActionButton.SECONDARY, false, e => {
    //log("pointer SECONDARY Up", e)
    //scene.MOVE_BACKWARD = false
  })
}

function setSystemEnabled(systems:ISystem|ISystem[],val:boolean){
  if(Array.isArray(systems)){
    for(const p in systems){
      if(val){
        if(!systems[p].active) engine.addSystem(systems[p])
      }else{
        if(systems[p].active) engine.removeSystem(systems[p])
      }
    }
  }else{
    if(val){
      if(!systems.active) engine.addSystem(systems)
    }else{
      if(systems.active) engine.removeSystem(systems)
    }
  }
}

const playerTraceFeatureTriggerShape = //new utils.TriggerSphereShape(.5,Vector3.Zero())
            //FIXME triggers dont rotate, need to move shape position based on car rotation
            //for now making it a cube centered on the players head, good enough for now
            new utils.TriggerBoxShape(new Vector3(.5,1,.5),new Vector3(0,0,0))

export class RacingScene extends SubScene{
 
  
  allRacingSystems:ISystem[]
  enemyRacingSystems:ISystem[]
  worldMoveVectorAwareSystems:ISystem[]
  closestTrackSystem:ClosestTrackSystem
  groundMoveSystem:GroundMoveSystem
  worldMoveSystem:WorldMoveSystem
  trackSpawnSystem:TrackSpawnSystem
  trackSpawner:TrackSpawner
  skidSpawner:SkidSpawner
  dustSpawner:StarSpawner
  starTrailSystem:StarTrailSystem
  manualMovePlayerSystem:ManualMovePlayerSystem

  skyboxControl = new SkyBoxControl()
  groundSceneEnt:SceneEntity


  carData:CarData
  car: Car

  finishFlagSceneEnt:SceneEntity
  startPositionSceneEnts:SceneEntity[] = []
  trackFeatureEnts:Record<string,SceneEntity> = {}

  constructor(
    id: number,
    name: string,
    entities: SceneEntity[]
    
  ) {
    super(id,name,entities )
  }
  
  resetRace(){
    ResetWorld()
    
    Game_2DUI.hideAll()
    Game_2DUI.reset()
    this.showRaceUI()


    this.updatePlayerData()
    

    this.resetRaceTrack()
    
    this.resetPlayerStats()
  }
  resetPlayerStats(){ 
    player.projectileTimer = fullProjectileTimer
    player.boostReloadTimer = fullBoostTimer
  }
  resetRaceTrack(){

    this.trackSpawner.removeAll()
    this.skidSpawner.removeAll()

    //must empty pool to reset cached entities
    //solved a different way in spawner
    //this.trackSpawner.releasePool()
    //this.skidSpawner.emptyPool()

    this.car.reset() 
  
    //dont add trackFeatureEnts to scene??? just track registry?
    //for(const p in this.trackFeatureEnts){ scene.addEntity( this.trackFeatureEnts[p] ) }

    GAME_STATE.trackData.init( levelManager.getCurrentLevel()  )

    GAME_STATE.raceData.reset()    
    GAME_STATE.raceData.init(levelManager.getCurrentLevel(),GAME_STATE.trackData)

    //TODO need cleaner way to do this
    this.groundSceneEnt.entity.getComponent(Material).albedoTexture = levelManager.getCurrentLevel().getTheme().groundTexture
 
    this.skyboxControl.updateFromLevel( levelManager.getCurrentLevel() )
    
    sfx.playLevelTheme( levelManager.getCurrentLevel() )

    const pathPosition = GAME_STATE.trackData.trackPath[0]

    log("pathPosition",pathPosition)

    //TODO come up with better "reset position logic"
    //update position
    this.finishFlagSceneEnt.entity.addComponentOrReplace(new Transform({
      position: new Vector3(pathPosition.x, pathPosition.y, pathPosition.z)
    }))
    
    //update positions
    let counter = 0
    for(const p in this.startPositionSceneEnts){
      const entity = this.startPositionSceneEnts[p].entity;
      setStartPositionEntity(entity,GAME_STATE.trackData,counter++)
    }

    //FIXME? do this after or before removeAllTrackFeatures???
    /*
    //no need to call this if we call remove All track features
    for(const p in this.trackFeatureEnts){
      const entity = this.trackFeatureEnts[p].entity;
      setTrackFeaturePosition(entity,GAME_STATE.trackData)
    }*/


    //TODO should i destory the objects? can i reuse them with an object pool??
    this.removeAllTrackFeatures()

    this.trackFeatureEnts = {}
    for(const p in GAME_STATE.trackData.trackFeatures){
      const trackFeat = GAME_STATE.trackData.trackFeatures[p]
      this.addTrackFeature(trackFeat)
      
    }
    
    this.trackSpawnSystem.reset()
    this.manualMovePlayerSystem.reset()
    this.closestTrackSystem.reset()
    this.worldMoveSystem.resetAll()
    
  }
  addTrackFeature(trackFeat:TrackFeatureComponent):SceneEntity{
    const sceneEnt = new SceneEntity("track-feat-"+trackFeat.name,undefined,{
      visibilityStrategy: VisibilityStrategyEnum.ENGINE_ADD_REMOVE ,
      onInit(entity:SceneEntity){ 
        const trackFeatEnt = createTrackFeature( GAME_STATE.trackData,trackFeat )
        entity.setEntity(trackFeatEnt)
        //log("createTrackFeature ",entity.name,entity.entity.alive,trackFeatEnt.getComponent(TrackFeatureComponent))
      }
    })
    //sceneEnt.hide()
    sceneEnt.init()
    //sceneEnt.hide(true) 
    //FIXME this is ugly cyclical linking but quickest i can come up with
    trackFeat.addEntity( sceneEnt )

    if(this.trackFeatureEnts[trackFeat.name]){
      log("WARNING! addTrackFeature attempted to add same track feature again!?!?!",trackFeat.name,this.trackFeatureEnts[trackFeat.name],"vs",trackFeat)
      return this.trackFeatureEnts[trackFeat.name]
    }else{
      this.trackFeatureEnts[trackFeat.name] = sceneEnt 
    }

    return sceneEnt
  }
  showRaceUI(){
    Game_2DUI.showLeaderboard(true)
    Game_2DUI.showLapTime(true,GAME_STATE.raceData.maxLaps)
    Game_2DUI.showLapCounter(true)

    Game_2DUI.showBoostBar(true)
    Game_2DUI.showProjectileBar(true)
    
    
    Game_2DUI.updateLapCounter(player.lap , GAME_STATE.raceData.maxLaps)
    //TODO centralize lap time???
    Game_2DUI.updateLapTime( Game_2DUI.formatTime(0),-1, GAME_STATE.raceData.maxLaps)

    updateLeaderboard(GAME_STATE.gameRoom)
  }
  initRace(force?:boolean){
    const raceRoomName = CONFIG.GAME_RACE_ROOM_NAME
    
    //TODO open up a loading/ waiting for players UI
    if((force === undefined || !force ) && GAME_STATE.gameConnected == 'connected' && GAME_STATE.gameRoom.name == raceRoomName){
      log("already connected to colyseus room:",GAME_STATE.gameRoom,raceRoomName)
    }else{
      this.resetRace()

      this.showRaceUI()

      this.firstTimeEnterCarWorkaroundVisibleBloomOnMove()
      
      //ENEMY_MGR.addEnemy("10","Self 1", trackPath[1], Color3.Green(), 'car')
      //const trackData = GAME_STATE.trackData

      // if(trackData.trackPath.length > 20 ) ENEMY_MGR.addEnemy("1", trackData.trackPath[20], Color3.Green(), new PlayerBase({name:"Shibu"}) )
      // if(trackData.trackPath.length > 40 ) ENEMY_MGR.addEnemy("2", trackData.trackPath[40], Color3.Green(), new PlayerBase({name:"Sam"}))
      // if(trackData.trackPath.length > 80 ) ENEMY_MGR.addEnemy("3", trackData.trackPath[80], Color3.Green(), new PlayerBase({name:"Nico"}))
      // if(trackData.trackPath.length > 130 ) ENEMY_MGR.addEnemy("4", trackData.trackPath[130], Color3.Green(), new PlayerBase({name:"Tak"}))

      //connect to colyseus
      //GAME_STATE.raceData.maxLaps
      //GAME_STATE.raceData.maxPlayers

      const raceDataOptions:RaceDataOptions = {
        levelId:GAME_STATE.raceData.id
        /*,name:GAME_STATE.raceData.name
        ,maxLaps:GAME_STATE.raceData.maxLaps
        ,maxPlayers:GAME_STATE.raceData.maxPlayers*/}



        //FIXME
        //does not support nested objects so going to pass it twice for now
        //as the "flattened value. using dot notation so there is parity"
        raceDataOptions
        const connectOptions = {
          raceDataOptions: raceDataOptions,
          "env": CONFIG.ENV,
          "titleId": CONFIG.PLAYFAB_TITLEID,
          "raceDataOptions.levelId":raceDataOptions.levelId,
          "raceDataOptions.maxPlayers":raceDataOptions.maxPlayers,
          "raceDataOptions.customRoomId":raceDataOptions.customRoomId
        }
        


      joinOrCreateRoom(raceRoomName,connectOptions)
    }
  }
  firstTimeEnterCarWorkaroundVisibleBloomOnMove() {
    if(!CONFIG.ENABLE_BLOOM_VISIBLE_WORKAROUNDS){
      log("workaroundVisibleBloomOnMove disabled, directly enter car")
      //just enter car
      this.enterCar()
      
      return
    }

    LOWER_PLAYER_SLOWLY_COLLIDER.withCollisions = true
    nearbySpawningPad2.activatePlatform()

    PREVENT_PLAYER_JUMP_COLLIDER.withCollisions = false
    RACING_PLAYER_STANDON_GROUND_COLLIDER.withCollisions = false
    this.car.disableTopCollider()
    nearbySpawningPad.getComponent(Transform).position.copyFrom(nearbySpawnPadStartPos)

    const playerY = nearbySpawnPadStartPos.y + SceneData.movePlayerYPadding// + 2
    const moveTo = nearbySpawnPadStartPos.clone()
    moveTo.y += SceneData.movePlayerYPadding + 2
    log("workaroundVisibleBloomOnMove",playerY)

    //{ x: SceneData.sizeX/2, y: playerY, z: SceneData.sizeZ/2 }

    //move them into place
    //move the player above the race track,then enter car?
    //workaround to bloom visible even inside a race area

    movePlayerTo(moveTo, { x: SceneData.sizeX/2, y: 1, z: SceneData.sizeZ }).then(()=>{
      
      nearbySpawningPad.addComponentOrReplace(new utils.MoveTransformComponent(nearbySpawnPadStartPos,nearbySpawnPadEndPos,2.2,()=>{
        //then enter car after enough time has passed
        LOWER_PLAYER_SLOWLY_COLLIDER.withCollisions = false
        RACING_PLAYER_STANDON_GROUND_COLLIDER.withCollisions = true
        
        nearbySpawningPad2.deActivatePlatform()
        
        //give engine time to to remove platform
        //to kick in then move platform back to starting pos
        utils.setTimeout(300,()=>{
          nearbySpawningPad.getComponent(Transform).position.copyFrom(nearbySpawnPadStartPos)
          this.enterCar(movePlayer)
        })

        const movePlayer = false //dont move player to avoid spawn affect
        //
        
      }))
    })
    
  }
  startRace(){
    if(GAME_STATE.raceData.started ) {
      log("race already started!!!")
      return
    }
    Game_2DUI.showLapTime(true,GAME_STATE.raceData.maxLaps)
    Game_2DUI.showRaceStartMsg(false)
    Game_2DUI.showGo(true,2000)
    //TODO encapsulate behind player
    const appliedFriction = (-1*player.appliedSlowdownFriction + -1*player.appliedBoostFriction)    
    if(appliedFriction != 0){
      player.currentSpeed = 1+appliedFriction
    }
    GAME_STATE.raceData.startRace()
    //set initial speed
    
  }
  playerFinishedRace(){
    //FIXME need to separeate better player finished race and entire race is over
    this.endRace()    
  }
  
  endRace(){
    Game_2DUI.showRaceStartMsg(false)
    GAME_STATE.raceData.endRace()

    //handle 2dUI logic
    //if player finished
    if(player.completedRace){
      Game_2DUI.setRaceEndReasonText("Placed " + player.racePosition)
    }else{
      Game_2DUI.setRaceEndReasonText("Out of time")
    }
    //Game_2DUI.updateGameResultRows( GAME_STATE.getRaceRoom()?.state ) //call after show
    Game_2DUI.showRaceEnded(true)
    
    //update per server time??
    Game_2DUI.updateTotalTime( Game_2DUI.formatTime( (player.raceEndTime - GAME_STATE.raceData.startTime)/1000)) 

    //Game_2DUI.updateRaceResults( GAME_STATE.getRaceRoom().state ) 
    //Game_2DUI.openRaceIsOver() 

    //setSystemEnabled(this.allRacingSystems,false) //still want other player updates but want to shut down things like the counter
    
  }
  exitRace(){
    this.hide()
    disconnect()
  }
  onInit(scene:SubScene){
    super.onInit(scene)
    
    if(!this.rootEntity.alive) engine.addEntity(this.rootEntity)

    this.trackSpawner = new TrackSpawner( "TrackSpawner",SceneData.scale * 24 )
    this.skidSpawner = new SkidSpawner("SkidSpawner",20)
    this.dustSpawner = new StarSpawner("DustSpawner",20)

    const worldMoveSystem = this.worldMoveSystem = new WorldMoveSystem()
    const vehicleMoveSystem = new VehicleMoveSystem()
    const myTrackSpawnSystem = this.trackSpawnSystem = new TrackSpawnSystem( this.trackSpawner )
    const closestTrackSystem = this.closestTrackSystem = new ClosestTrackSystem()
    
    const enemyMarkerSystem = new EnemyMarkerSystem()
    const enemyUpdateSystem = new EnemyUpdateSystem()
    
    const groundMoveSystem = this.groundMoveSystem = new GroundMoveSystem()
    const projectileSystem = new ProjectileSystem()

    const manualMovePlayerSystem = this.manualMovePlayerSystem = new ManualMovePlayerSystem()
    manualMovePlayerSystem.enabled=false

    const starTrailSystem = this.starTrailSystem = new StarTrailSystem(this.dustSpawner)
     
    const itemRechargeSystem = new ItemRechargeSystem()

    this.closestTrackSystem.init()

    this.allRacingSystems = [ starTrailSystem, itemRechargeSystem, worldMoveSystem, vehicleMoveSystem, myTrackSpawnSystem,closestTrackSystem,enemyMarkerSystem,enemyUpdateSystem,groundMoveSystem,projectileSystem,manualMovePlayerSystem ] 
    this.worldMoveVectorAwareSystems = [ starTrailSystem, worldMoveSystem,myTrackSpawnSystem, enemyUpdateSystem,groundMoveSystem ]//TODO add skidMarkSystem
    
    //systems if u want to keep enemies active
    this.enemyRacingSystems = [ projectileSystem,enemyMarkerSystem,enemyUpdateSystem ]
    
    scene.addEntity( closestTrackSystem.debugUI )
 

    createHiddenGroundToStandOn()
 
    const baseShape = new BoxShape()
    baseShape.withCollisions = false
    
    const modArea = new Entity("modArea.raceArea.hideAvatar")
    //set scene root as parent so we can move the root around and everything shifts relative
    //if want a large large area, dont set parent - set it entire scene with large dimentions
    //having issues with bloom visible in a hide entire scene area hoping large hide area helps
    const attachHideAreaToParent = CONFIG.DEBUG_SMALLER_AVATAR_HIDE_AREA

    if(attachHideAreaToParent) modArea.setParent(scene.rootEntity)
    
    const modAreaSceneEnt = new SceneEntity(modArea.name,modArea,{ 
        onInit(sceneEnt:SceneEntity){
          const modArea = sceneEnt.entity
          modArea.addComponent(
            new AvatarModifierArea({
              area: { 
                //box: 
                box: CONFIG.DEBUG_SMALLER_AVATAR_HIDE_AREA ? 
                  new Vector3(0.5, 8, 0.5) //debug mode only hide when in car so can see player when walking around
                  : new Vector3(SceneData.sizeX, SceneData.sizeY, SceneData.sizeX) //safe bet to hide everyone, long term unhide when out of car
              },
              modifiers: [AvatarModifiers.HIDE_AVATARS],
            })
          ) 
          modArea.addComponent(
            new Transform({
              position: new Vector3(SceneData.center.x, attachHideAreaToParent ? 0 : SceneData.sizeY/2, SceneData.center.z),
            })
          )
        },
        visibilityStrategy: VisibilityStrategyEnum.ENGINE_ADD_REMOVE 
      }
    )
    scene.addEntity(modAreaSceneEnt)

    

    /*
    //not using playerFeatureTrigger as current implementation
    //when comparing trigger layer to other trigger layers
    //checks n^2 items which we dont want, using camera check which only checks O(n) times

    //it is useful to see the camera trigger shape
    */
    if(CONFIG.DEBUGGING_TRIGGERS_ENABLED){
      const playerFeatureTrigger = new Entity("playerFeatureTrigger")
      //set scene root as parent so we can move the root around and everything shifts relative
      playerFeatureTrigger.setParent(scene.rootEntity)
      const playerFeatureTriggerSceneEnt = new SceneEntity(playerFeatureTrigger.name,playerFeatureTrigger,{ 
          onInit(sceneEnt:SceneEntity){
            const playerFeatureTrigger = sceneEnt.entity

            playerFeatureTrigger.addComponentOrReplace(
              new utils.TriggerComponent(playerTraceFeatureTriggerShape,{
                layer:TRACK_FEATURE_LAYER_1,
                enableDebug:CONFIG.DEBUGGING_TRIGGERS_ENABLED,
                onTriggerEnter:()=>{
                  log("entered!!! "+"player")
                },
                onTriggerExit:()=>{
          
                }
              })
            )
            playerFeatureTrigger.addComponent(
              new Transform({
                position: new Vector3(SceneData.center.x, SceneData.raceGroundElevation-SceneData.inCarPlayerGroundElevation, SceneData.center.z),
              })
            )
          },
          visibilityStrategy: VisibilityStrategyEnum.ENGINE_ADD_REMOVE 
        }
      )
      scene.addEntity(playerFeatureTriggerSceneEnt)
    }

    registerInputHandlers()


    //SET DEFAULT CAR FOR TESTING
    this.updateCarData(this.carData)
    this.car.hide()
    
    //adding finish flag
    const finishFlagSceneEnt = this.finishFlagSceneEnt = new SceneEntity("finish-flag",createFinishFlag( GAME_STATE.trackData ),{
      /*onChangeEntityVisibility:(entity:EntityWrapper,type:VisibleChangeType)=>{
        switch(type){
          case 'show':
            finishFlagSceneEnt.entity.addComponent(new Transform({
              position: new Vector3(pathPosition.x, pathPosition.y, pathPosition.z)
            })o)
        }
      }*/
     })
    scene.addEntity(finishFlagSceneEnt)
    finishFlagSceneEnt.hide(true) //make sure not visible oninit
 
    //start making starting position entitites
    for(let x=0;x<8;x++){
      this.startPositionSceneEnts.push( new SceneEntity("start-pos-"+x,createStartPosition( GAME_STATE.trackData,x ),{
        }) )
    }
      
    for(const p in this.startPositionSceneEnts){
      scene.addEntity( this.startPositionSceneEnts[p] )
    }
    //end making starting position entitites

    
    //start placing obsticles

    //end placing obsticles

    //adding ground
    const groundSceneEnt = this.groundSceneEnt = new SceneEntity("race-ground",createRaceGround(),{  })
    scene.addEntity(groundSceneEnt)
    groundSceneEnt.hide(true) //make sure not visible oninit

  }   
 
  updateCarData(carData:CarData){
    this.carData = carData
    if(!this.car){
      this.car = new Car(this.carData)
      this.car.driver = player 
      this.car.skidSpawner = this.skidSpawner
      this.car.init() 
      this.car.hide()
     
    }else{
      this.car.updateCarData(carData)
    }
  }
  
  
  updatePlayerData(_userData?:UserData){
    const userData = _userData ? _userData : getUserDataFromLocal()
    player.reset() 
    if(userData){
        //getUserData().then( (value:UserData) =>{
        //FIXME need consistent way to generate id that server agrees with
        //or pass this into the connect call
        this._updatePlayerData(userData)
    }else{
      log("warn user data not init!?!?!")
      //fetch slow way?
      getAndSetUserData().then( (val:UserData) => {
        this._updatePlayerData(userData)
      } )
    }
    
  }
  

  _updatePlayerData(userData:UserData){
    if(userData){
      player.id = userData.displayName+"."+userData.userId  
      player.userId = userData.userId
      player.name = userData.displayName
      if(userData && userData.userId) player.avatarTexture = new AvatarTexture(userData.userId)
    }else{
      log("unable to _updatePlayerData",userData)
    }
  }
  onShow(scene:SubScene){
    super.onShow(scene)

    setSystemEnabled(this.allRacingSystems,true)
    this.showRaceUI()

    this.skyboxControl.AddSkybox()

    
    //redefine trigger shape
    utils.TriggerSystem.instance.setCameraTriggerShape(
      playerTraceFeatureTriggerShape
    )
  }
  onHide(scene:SubScene){
    log("RACE onHide called")
    super.onHide(scene)

    this.disableExitCar()


    this.skyboxControl.RemoveSkybox()

    Game_2DUI.hideAll()

    this.trackSpawner.removeAll()
    this.skidSpawner.removeAll()

    ENEMY_MGR.removeAllPlayers()

    Game_2DUI.showRaceStartMsg(false)

    setSystemEnabled(this.allRacingSystems,false)

    this.hideAllTrackFeatures()

    //WORKAROUND, must explicity set playing false
    //if playOnce is called, on add to scene (again, it plays again)
    sfx.stopAllSources("race.onHide.raceSoundAudioSources",sfx.raceSoundAudioSources)
    sfx.stopAllSources("race.onHide.raceThemeSoundAudioSources",sfx.raceThemeSoundAudioSources)
  }

  hideAllTrackFeatures(){
    //because not part of scene object must manually manage hide/show
    for(const p in this.trackFeatureEnts){
      this.trackFeatureEnts[p].hide()
    }
  }

  removeAllTrackFeatures(){
    //because not part of scene object must manually manage hide/show
    for(const p in this.trackFeatureEnts){
      if(!this.trackFeatureEnts[p].entities) continue

      for(const q in this.trackFeatureEnts[p].entities){
        engine.removeEntity(this.trackFeatureEnts[p].entities[q])
      }
    }
    //this.
  }
  
  isInCar(){
    return this.car.isDriving()
  }
  enterCar(movePlayer?:boolean){
    this.car.setPlayerDriving(true,movePlayer)

    //need time for move to kick in
    utils.setTimeout(200,()=>{
      PREVENT_PLAYER_JUMP_COLLIDER.withCollisions = true
      this.car.enableTopCollider()
    })
    
    this.car.show()
    this.car.enable()

    setSystemEnabled(this.enemyRacingSystems,true)
  }
  exitCar(){
    PREVENT_PLAYER_JUMP_COLLIDER.withCollisions = false

    this.car.setPlayerDriving(false)
    
    this.car.show()
    this.car.disable()

    setSystemEnabled(this.enemyRacingSystems,true)
  }

  disableExitCar(){
    this.car.setPlayerDriving(false,false)
    this.car.disable()
    setSystemEnabled(this.enemyRacingSystems,true)
    this.car.hide()
  }

  /**
   * 
   * @param playerRankBase0 - base 0 indexed - 1rst place is index 0
   */
  moveRacerToStartPosition(playerRankBase0: number) {
    log("moveRacerToStartPosition called",playerRankBase0)
    
    if(!this.manualMovePlayerSystem.enabled){
      //log("turn on!!!")
      const target = this.startPositionSceneEnts[ playerRankBase0 ].entity.getComponent(Transform).position
      //this.manualMovePlayerSystem.getTargetPosition = () => { return target }
      this.manualMovePlayerSystem.targetPosition = target
      
      this.manualMovePlayerSystem.enabled = true
      //this.manualMovePlayerSystem.update(.01)
      setSystemEnabled(this.manualMovePlayerSystem,true)
    }

  }
}


export function initRacingScene(){
    const _scene = new Entity('_scene.race')
    ////engine.addEntity(_scene)
    const transform = new Transform({
      position:  new Vector3(0, SceneData.inCarPlayerGroundElevation, 0),
      rotation: Quaternion.Euler(0,0,0),
      scale: new Vector3(1, 1, 1)
    })
    _scene.addComponentOrReplace(transform)  

    const racingScene = new RacingScene(
      Constants.SCENE_MGR.generateSceneId(),
      "racing",
      [new SceneEntity("racing.base.scene",_scene)],
    )

    racingScene.carData = defaultCar
    Constants.SCENE_MGR.addScene( racingScene ) 

    //START spawn points
    const spawnPoints = [ ]


    log("assigned racing scene")

    racingScene.rootEntity = _scene
    Constants.SCENE_MGR.racingScene = racingScene
}