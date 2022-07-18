import { CONFIG } from 'src/config'
import { RacingScene } from './race'
import { SceneEntity, SubScene } from './subScene'

export type SceneInitData={
  onInit:(scene:SubScene)=>void
  onShow?:(scene:SubScene)=>void
  onHide?:(scene:SubScene)=>void
  entities: SceneEntity[]
  name:string
}

export interface ISceneManager{
  generateSceneId():number
  addScene(scene:SubScene|SceneInitData):SubScene
  changeToScene(scene:SubScene):void
  initScenes():void
  hideScenes():void
}

export class SceneManager implements ISceneManager{
  scenes:SubScene[] = []

  generateSceneId():number{
    return this.scenes.length+1
  }
  addScene(scene:SubScene|SceneInitData):SubScene{
    log("addScene ENTRY ",scene)
    let retScene:SubScene;
    if(scene instanceof SubScene){
      retScene = scene
      this.scenes.push( scene )
    }else{
      retScene = new SubScene( this.generateSceneId(),scene.name,scene.entities );
      if(scene.onInit !== undefined ) retScene.onInit = scene.onInit
      if(scene.onHide !== undefined ) retScene.onHide = scene.onHide
      if(scene.onShow !== undefined ) retScene.onShow = scene.onShow
      this.scenes.push( retScene )
    }
    log("addScene EXIT ",retScene)
    return retScene
  }
  changeToScene(scene:SubScene){
    for(const p in this.scenes){
      if(this.scenes[p] == scene){

      }else{
        this.scenes[p].hide()
      }
    }
    scene.show()
  }
  initScenes(){
    for(const p in this.scenes){
        this.scenes[p].init()
    }
  }
  hideScenes(){
    for(const p in this.scenes){
        this.scenes[p].hide()
    }
  }
}


//export const SCENE_MGR = new RaceSceneManager();