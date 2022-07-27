import * as sfx from "../resources/sounds";
import { CONFIG } from "src/config"
//import { Constants.SCENE_MGR } from "./raceSceneManager"
import { SceneEntity, SubScene, VisibilityStrategyEnum } from "./subScene"
import { ScenePOI, SceneVector3Type, SpawnPoint } from "./types"
import * as utils from '@dcl/ecs-scene-utils'
import {scene as SceneData} from '../scene'
import { Leaderboard, LeaderBoardItmConstants, LeaderBoardItmType, LeaderBoardManager, LEADERBOARD_ITEM_REGISTRY } from "./menu"
import { LevelMenuItem } from "./menuItem"
import { CommonResources } from "src/resources/common"
import { levelManager } from "src/tracks/levelManager"
import { Game_2DUI } from "../ui/index"
import { Constants } from "../resources/globals"

//const Constants.SCENE_MGR = Constants.Constants.SCENE_MGR 
//import { fetchLeaderboardInfo } from "src/login/login-flow"

const LEADERBOARD_SCORE_NUM_DECIMAL_POINTS = 2
//https://community.playfab.com/questions/4254/leaderboard-ordering-with-min-aggregation.html
const LEADBOARD_SCORE_TIME_SCALAR = -1 * 1/1000

function createLeaderboardLbl(statLbl:string,statTimeLbl:string){
  return statLbl + " ("+statTimeLbl+")"
}

export class LobbyScene extends SubScene{
  leaderboardManager = new LeaderBoardManager

  level0:Leaderboard
  level1:Leaderboard
  level0b:Leaderboard
  level1b:Leaderboard
  leaderboards:Leaderboard[]

  onInit(scene:SubScene){

    if(!this.rootEntity.alive) engine.addEntity(this.rootEntity)
    const _scene = this.rootEntity


    const baseShape = new GLTFShape('models/lobby/lobby_building.glb')
    baseShape.withCollisions = false

    const sceneBase = new Entity("building base")
    sceneBase.addComponent(new Transform( {
      position: new Vector3( SceneData.center.x,0,SceneData.center.z ),
      scale:  new Vector3( 1,1,1 )
    } ))

    const lobbyCrane = new Entity("crane")
    lobbyCrane.addComponent(new Transform( {
      position: new Vector3( 0,0,0 ),
      scale:  new Vector3( 1,1,1 )
    } ))
    lobbyCrane.addComponent(new GLTFShape('models/lobby/lobby_crane.glb'))
    lobbyCrane.addComponent(new Billboard(false,true,false))
    lobbyCrane.setParent(sceneBase)


    sceneBase.addComponent(baseShape)
    //set scene root as parent so we can move the root around and everything shifts relative
    sceneBase.setParent(scene.rootEntity) 
    scene.addEntity( new SceneEntity("base building",sceneBase) )


    const leaderboardManager = this.leaderboardManager = new LeaderBoardManager()

    this.spawnLeaderboards(leaderboardManager);


    const modArea = new Entity("modArea.lobby.racePlatform.hideAvatar")
    //set scene root as parent so we can move the root around and everything shifts relative
    modArea.setParent(scene.rootEntity)
    const modAreaSceneEnt = new SceneEntity(modArea.name,modArea,{ 
        onInit(sceneEnt:SceneEntity){
          const modArea = sceneEnt.entity
          modArea.addComponent(
            new AvatarModifierArea({
              area: {
                //x,z of size 8 grows beyond crane base size
                box: new Vector3(5, SceneData.raceElevationStartRange, 5) //safe bet to hide everyone, long term unhide when out of car
              }, 
              modifiers: [AvatarModifiers.HIDE_AVATARS], 
            })
          ) 
          const modAreaPos =  new Vector3().copyFrom(SceneData.center)
          modAreaPos.y = (SceneData.raceElevationStartRange)
          modArea.addComponent(
            new Transform({ 
              position: modAreaPos
            })
          )
        },
        visibilityStrategy: VisibilityStrategyEnum.ENGINE_ADD_REMOVE 
      }
    )
    scene.addEntity(modAreaSceneEnt)
  }

 
  private spawnLeaderboards(leaderboardManager: LeaderBoardManager) {
    const level0 = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, levelManager.levels[0].name, levelManager.levels[0].id, SceneData.menuPositions[0].position, SceneData.menuPositions[0].rotation, 1.4);
    const level1 = this.level1 = leaderboardManager.createLeaderboard(this.rootEntity, levelManager.levels[1].name, levelManager.levels[1].id, SceneData.menuPositions[1].position, SceneData.menuPositions[1].rotation, 1.4);
    const level0b = this.level0 = leaderboardManager.createLeaderboard(this.rootEntity, levelManager.levels[0].name, levelManager.levels[0].id, SceneData.menuPositions[2].position, SceneData.menuPositions[2].rotation, 1.4);
    const level1b = this.level1b = leaderboardManager.createLeaderboard(this.rootEntity, levelManager.levels[1].name, levelManager.levels[1].id, SceneData.menuPositions[3].position, SceneData.menuPositions[3].rotation, 1.4);

    log("to add levelManager.levels ", levelManager.levels);

    const RESELECT_COOLDOWN = 1000;
    const boards = this.leaderboards = [level0, level1, level0b, level1b];
    const stats: LeaderBoardItmType[] = [
      LeaderBoardItmConstants.TOTAL_BEST_TIME, LeaderBoardItmConstants.LAP_BEST_TIME
    ];
    const statsTime: LeaderBoardItmType[] = [
      LeaderBoardItmConstants.FREQUENCY_DAILY, LeaderBoardItmConstants.FREQUENCY_WEEKLY
    ];

    for (const p in boards) {
      const board = boards[p];

      const levelId = board.type;

      board.addMenuItem(
        new LevelMenuItem(
          {
            scale: new Vector3(1, 1, 1),
          },
          CommonResources.RESOURCES.textures.roundedSquareAlpha.texture,
          "Play",
          "play",
          () => {
            //small delay
            //TODO - start connecting sooner???
            levelManager.setCurrentLevel(levelId);
            utils.setTimeout(300, () => {
              Constants.SCENE_MGR.goRace();
            });
            //deselect
          },
          {
            reSelectCoolDown: RESELECT_COOLDOWN
          }
        )
      );
      for (const j in stats) {
        for (const q in statsTime) {

          const statPostfix = stats[j].id + "_" + statsTime[q].id;
          const menuItmLabl = createLeaderboardLbl(stats[j].label, statsTime[q].label);
          board.addMenuItem(
            new LevelMenuItem(
              {
                scale: new Vector3(1, 1, 1),
              },
              CommonResources.RESOURCES.textures.roundedSquareAlpha.texture,
              menuItmLabl,
              statPostfix,
              () => {

                let statToLoad = "lvl_" + levelId + "_" + statPostfix;

                log("levelManager.clicked", stats[j], "load leaderboard", statToLoad);

                //https://community.playfab.com/questions/4254/leaderboard-ordering-with-min-aggregation.html
                this.leaderboardManager.updateBoardWithLoaderBoardId(board, menuItmLabl, statToLoad, LEADBOARD_SCORE_TIME_SCALAR, LEADERBOARD_SCORE_NUM_DECIMAL_POINTS); //divide to get seconds
              },
              {
                reSelectCoolDown: RESELECT_COOLDOWN
              }
            )
          );
          //}
        }
      }

      board.hideRows();
    }
  }

  refreshLevelLeaderboardStats(options?:{reloadSelected:boolean,thisStat?:string,defaultStat?:string,levelId?:string}){
    log("refreshLevelLeaderboardStats",options)

    for(const p in this.leaderboards){
      const board = this.leaderboards[p]
 
      const levelId = board.type

      if(options && options.levelId && options.levelId != levelId){
        log("refreshLevelLeaderboardStats","skipping board did not match",options.levelId)
        continue;
      }

      const selectedItm = board.getSelectedMenuItem()

      let menuItem: LevelMenuItem

      let stat:string = undefined
 
      let usedSelectedItem = false
      if(options){
        if(options.thisStat){
          stat = options.thisStat
        }

        if(options.reloadSelected == true && selectedItm && selectedItm instanceof LevelMenuItem){
          if(selectedItm.type != 'play' ){
            //assume has full value already
            stat = selectedItm.type
            usedSelectedItem = true
            menuItem = selectedItm
          }else{
            //fallback
            log("refreshLevelLeaderboardStats","fallback to default as ",selectedItm.type,"was selected")
          }
        }

        //if still null use default stat
        if(!stat){
          stat = options.defaultStat
        }
      }

      if(!usedSelectedItem){
        //TODO must select item
      }
      
      if(stat){
        stat = "lvl_"+levelId + "_"+ stat
      }

      if(stat){
        log("refreshLevelLeaderboardStats","loading",stat,"for",board.type,"for menu",menuItem)
        if(menuItem && menuItem.updateWearablesMenu){
          menuItem.updateWearablesMenu()
        }else{

          //FIXME this lookup is ugly
          let lbl = stat
          for(let p in LEADERBOARD_ITEM_REGISTRY){
            log("refreshLevelLeaderboardStats checking",stat,p) 
            if( stat.indexOf(p) >= 0){ 
              lbl = createLeaderboardLbl(LEADERBOARD_ITEM_REGISTRY[p].type.label,LEADERBOARD_ITEM_REGISTRY[p].frequency.label)
            }
          }
          this.leaderboardManager.updateBoardWithLoaderBoardId(board, lbl, stat,LEADBOARD_SCORE_TIME_SCALAR,LEADERBOARD_SCORE_NUM_DECIMAL_POINTS) //divide to get seconds
        }
      }else{
        //default
        log("refreshLevelLeaderboardStats","no stats to load",stat,"for",board.type)
      }

      //this.leaderboardManager.updateBoardWithLoaderBoardId(board,statToLoad,LEADBOARD_SCORE_TIME_SCALAR,LEADERBOARD_SCORE_NUM_DECIMAL_POINTS) //divide to get seconds
      
    }
    //this.leaderboardManager.updateBoardWithLoaderBoardId(board,statToLoad,-1 * 1/1000,NUM_DECIMAL_POINTS) //divide to get seconds
  }
  
  onShow(scene: SubScene): void {
    //super.onShow() 
    sfx.playLevelTheme( "lobby",.3 ) 
  }
  onHide(scene:SubScene){
    //super.onHide()
    log("LOBBY onHide called")
    super.onHide(scene)

    //WORKAROUND, must explicity set playing false
    //if playOnce is called, on add to scene (again, it plays again)
    sfx.stopAllSources("lobby.onHide.allMenuAudioSources",sfx.allMenuAudioSources)
  }
}

//export const exteriorScene = new SubScene(0,[_scene]) //exterior,frontDoor
export function initLobbyScene(){

  const _scene = new Entity('_scene.lobby')
  ////engine.addEntity(_scene)
  const transform = new Transform({
    position:  new Vector3(0, 0, 0),
    rotation: Quaternion.Euler(0,0,0),
    scale: new Vector3(1, 1, 1)
  })
  _scene.addComponentOrReplace(transform)


  //const lobbyScene = new lobbyScene()
  const lobbyScene = new LobbyScene(
    Constants.SCENE_MGR.generateSceneId(),
    "lobby",
    [new SceneEntity("lobby.base.scene",_scene)],
  )

  Constants.SCENE_MGR.addScene( lobbyScene ) 


  //START spawn points
  const spawnPoints: ScenePOI[] = [
    new ScenePOI({ position:new SceneVector3Type( 17.68587303161621 , 1.7549998760223389 , 45.16695022583008 )  }),
    new ScenePOI({ position:new SceneVector3Type( 21.182018280029297 , 1.7549998760223389 , 44.75783920288086 ) }) ]

  for(const p in spawnPoints){
    const spawnPointEnt = new Entity('lobby-spawn-pint')
    //engine.addEntity(spawnPointEnt) 
    spawnPointEnt.setParent(_scene)
    //if is a range, we grab center
    spawnPointEnt.addComponent(new Transform( spawnPoints[p].toTransformConstructorArg() ))

    //spawnPointEnt.addComponent(new BoxShape()) //see where they are

    //make spawn point absolute world position
    const spawnPoint:SpawnPoint = spawnPoints[p]
    spawnPoint.position.copyFrom( utils.getEntityWorldPosition(spawnPointEnt) )

    lobbyScene.spawnPoints.push( spawnPoint )
  }
  //END SPAWN POINTS

  log("assigned exterior")
  //Constants.SCENE_MGR.addScene(exteriorScene)
  lobbyScene.rootEntity = _scene
  Constants.SCENE_MGR.lobbyScene = lobbyScene


}