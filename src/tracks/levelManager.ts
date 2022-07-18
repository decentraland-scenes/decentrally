import { GAME_STATE } from "src/modules/state";
import { Theme, themeControl } from "src/modules/themeData";
import { TrackFeature } from "src/modules/trackFeatures";
import { realDistance } from "src/modules/utilities";
import { scene } from "../modules/scene";
import { track2, track3 } from "./tracks";


export class Level {
  id:string
  name:string
  trackData:any//what is this, not used currently
  trackPath:Vector3[]
  theme:Theme
  maxLaps:number
  trackFeatures:TrackFeature[]

  constructor(id:string,name:string,trackPoints:Vector3[], theme:Theme){
    this.id = id
    this.name = name
    this.trackPath = []
    //this.theme = theme

    log("LEVEL ORIGINAL TRACK POINTS IS THIS LONG: " + trackPoints.length)
    for(let i=0; i< trackPoints.length; i++){

      if(i==0){
        this.trackPath.push(trackPoints[i].add(new Vector3(scene.center.x, scene.raceGroundElevation, scene.center.z)))  
      }

      //merge points that are rally close to each other and only include one
      if(i > 0){
        if(realDistance(trackPoints[i-1],trackPoints[i]) > 0.1){
          this.trackPath.push(trackPoints[i].add(new Vector3(scene.center.x, scene.raceGroundElevation, scene.center.z)))
        }
      }      
    }
    this.trackPath.reverse()

    log("LEVEL TRACKPATH IS THIS LONG: " + this.trackPath.length)
    this.theme = theme
  }

  canAddTrackFeature(feat:TrackFeature){
    return feat.position.startSegment < this.trackPath.length-2
  }

  addTrackFeature(feat:TrackFeature){
    if(!this.trackFeatures) this.trackFeatures = []

    if( !this.canAddTrackFeature( feat ) ){
      log("Level.trackFeatures out of bounds",feat)
      return
    }

    this.trackFeatures.push( feat )
  }

  getRandomDecoration():GLTFShape{
    let randIndex = Math.floor(Math.random()*this.theme.subObjects.length)
    return this.theme.subObjects[randIndex]
  }

  getTheme():Theme{

    return this.theme
  }

}

class LevelManager {
  levels:Level[]
  currentLevel:Level

  constructor(){
    this.levels = []
  }
  addLevel(newLevel:Level){
    this.levels.push(newLevel)

    if(this.levels.length == 1){
      this.currentLevel = this.levels[0]
    }

  }
  setCurrentLevel(level:number|string|Level){
    if(level instanceof Level){
      this.currentLevel = level
    }else if(typeof level === 'string'){
      for(const p in this.levels){
        const lvl = this.levels[p]
        if(lvl.id == level){
          this.currentLevel = lvl
        }
      }
    }else{
      this.currentLevel = this.levels[level]
    }
  }

  getCurrentLevel():Level{
    return this.currentLevel
  }

}

//NOTE: server/src/levelData/levelData.ts will be overriding/managing name as well as other values over time
//currently server controls official value for:
//name
let level1 = new Level("city_track_demo_1","City Track Demo",track2, themeControl.getTheme(0))
let level2 = new Level("desert_track_demo_1","Desert Track Demo",track3, themeControl.getTheme(1))


export let levelManager = new LevelManager()
levelManager.addLevel(level1)
levelManager.addLevel(level2)
levelManager.setCurrentLevel(0)



