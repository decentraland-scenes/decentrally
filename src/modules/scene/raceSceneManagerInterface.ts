import { LobbyScene } from "./lobby"
import { RacingScene } from "./race"
import { ISceneManager } from "./sceneManager"
import { SubScene } from "./subScene"

//workaround to break cyclic deps
export interface IRaceSceneManager extends ISceneManager{
  lobbyScene:LobbyScene
  racingScene:RacingScene

  goRace(force?:boolean):void
  goLobby(force?:boolean):void

}

//export let SCENE_MGR:IRaceSceneManager // = new RaceSceneManager();