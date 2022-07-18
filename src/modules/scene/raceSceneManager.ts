import { CONFIG } from 'src/config'
import { Constants } from '../resources/globals'
import { player, scene } from '../scene'
import { Game_2DUI } from '../ui/index'
import { realDistance } from '../utilities'
import { LobbyScene } from './lobby'
import { RacingScene } from './race'
import { IRaceSceneManager } from './raceSceneManagerInterface'
import { SceneManager } from './sceneManager'
import { SceneVector3Type, SpawnPoint } from './types'
//import * as gameUI from "../ui/index";

export class RaceSceneManager extends SceneManager implements IRaceSceneManager{

  static instance:RaceSceneManager
 
  static getInstance(){
    if(!RaceSceneManager.instance || RaceSceneManager.instance === undefined){
      RaceSceneManager.instance = new RaceSceneManager();
    }
    return RaceSceneManager.instance
  } 

  lobbyScene:LobbyScene
  racingScene:RacingScene
  playerLocationBeforeRace:Vector3

  goRace(force?:boolean){
    Constants.doLoginFlow(
        {
          onSuccess:()=>{ 
            const alreadyRacing = this.racingScene.visible
            
            //-3 for player height with padding if standing on stuff
            
            this.capturePlayerLobbyPosition()

            if( (force === undefined || !force ) && alreadyRacing ){
              log("already racing")
              //run these anyway just in case state got messed up
              this.changeToScene(this.racingScene)
              this.racingScene.movePlayerHere()
            }else{
              if(!Constants.showedHowToPlayAlready){
                Constants.Game_2DUI.openHowToPlayPrompt()
              }else{
                this.changeToScene(this.racingScene)
                this.racingScene.movePlayerHere()
                this.racingScene.initRace(force)
              }
            }
          }
        }
      )
  } 
  goLobby(force?:boolean){

    const forceGo = force !== undefined && force
 
      if(!forceGo && this.racingScene.visible){
        //log("gameUI.openEndGameConfirmPrompt",gameUI)
        Game_2DUI.openEndGameConfirmPrompt() 
      }else{
        this.racingScene.exitRace()
        
        this.changeToScene(this.lobbyScene)

        const cameraLook = scene.center.clone()
        cameraLook.y = 8
        const spawnPoint:SpawnPoint = new SpawnPoint({
          position: new SceneVector3Type( this.playerLocationBeforeRace.x,this.playerLocationBeforeRace.y,this.playerLocationBeforeRace.z ),
          cameraLookAt: cameraLook
        })
        //spawnPoint.position._cachedFixedPosition = this.playerLocationBeforeRace
        this.lobbyScene.movePlayerHere(spawnPoint)
      }
    
  }

  capturePlayerLobbyPosition(){
    if( player.camera.position.y  < scene.raceGroundElevation - 3 ){
      this.playerLocationBeforeRace = new Vector3().copyFrom( player.camera.position )

      //also check distance from center which is not a place to be spawned

      const centerIgnoreHeight = new Vector3().copyFrom(scene.center)
      centerIgnoreHeight.y = this.playerLocationBeforeRace.y
      const distFromCenter = realDistance(this.playerLocationBeforeRace,centerIgnoreHeight)
      log("goRace check dist from center",this.playerLocationBeforeRace,distFromCenter)
      const minDistance = 8
      if(distFromCenter < minDistance){
        //how did they start a game from in side the tower?
        //TODO have predefined spawn spots?
        this.playerLocationBeforeRace.x += (minDistance-this.playerLocationBeforeRace.x)
        this.playerLocationBeforeRace.y += 1 //to avoid spawning inside something
        log("goRace move out from center",this.playerLocationBeforeRace,distFromCenter)
      }

    }else{
      log("goRace playerLocationBeforeRace player in race so dont capture",this.playerLocationBeforeRace)
      //see if has value, if missing for some reason pick a safe respawn point
      //this.playerLocationBeforeRace
    }
  }
}

//export const SCENE_MGR = new RaceSceneManager();
export function initSceneMgr(){
  Constants.SCENE_MGR = RaceSceneManager.getInstance()
}
 