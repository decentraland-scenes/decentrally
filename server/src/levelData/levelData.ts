
const EPOCH_HOURS = 24 ;// 10/60 //1 minute

export class Level {
  id:string
  name:string
  trackData:any//what is this, not used currently
  //trackPath:Vector3[]
  //theme:Theme
  maxLaps:number
  //trackFeatures:TrackFeature[]

  constructor(id:string,name:string,){
    this.id = id
    this.name = name
    //this.trackPath = []
    //this.theme = theme

  }
}
export class LevelManager {
  levels:Level[]

  constructor(){
    this.levels = []
  }
  addLevel(newLevel:Level){
    this.levels.push(newLevel)

  }
  getLevel(level:number|string|Level):Level{
    let currentLevel = undefined
    if(level instanceof Level){
      currentLevel = level
    }else if(typeof level === 'string'){
      for(const p in this.levels){
        const lvl = this.levels[p]
        if(lvl.id == level){
          currentLevel = lvl
        }
      }
    }else{
      currentLevel = this.levels[level]
    }
    return currentLevel
  }


}

//TODO set more values from server like maxlaps, etc.
let level1 = new Level("city_track_demo_1","City Track Demo")//,track2, themeControl.getTheme(0))
let level2 = new Level("desert_track_demo_1","Desert Track Demo")//,track3, themeControl.getTheme(1))

export const LEVEL_MGR = new LevelManager();
LEVEL_MGR.addLevel( level1 )
LEVEL_MGR.addLevel( level2 )
