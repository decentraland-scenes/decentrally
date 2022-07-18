import { scene, player } from "../scene";
import * as ui from '@dcl/ui-scene-utils'
import * as utils from '@dcl/ecs-scene-utils'
import resources, { setSection } from "../../dcl-scene-ui-workaround/resources";
import { ImageSection } from "node_modules/@dcl/ui-scene-utils/dist/utils/types";
import { Constants } from "../resources/globals";
import { SOUND_POOL_MGR } from "../resources/sounds";
//import { setPlayerDriving} from "./car";

//let uiAtlasTexture = new Texture('textures/ui_atlas.png', {samplingMode: 1})


export const canvas = ui.canvas

function createButton( parent:UIShape,theme:Texture,selection:ImageSection,text:string,fontSize:number,fontColor:Color4,onClick:()=>void ){

  let img = new UIImage(topRightLapTimesCounter,ui.darkTheme)
  //quitRace.value = "Quit Race"
  img.isPointerBlocker = true
  setSection(img,selection)
  
  const lbl= new UIText(img)

  lbl.value = text
  lbl.hTextAlign = 'center'
  lbl.vTextAlign = 'center'
  lbl.fontSize = fontSize
  lbl.font = ui.SFFont
  lbl.color = fontColor
  lbl.isPointerBlocker = false

  img.onClick = new OnClick(() => {
    onClick()
  })

  return img

}

export let topRightContainer = new UIContainerRect(canvas)
topRightContainer.height = '33%'
topRightContainer.hAlign = 'right'
topRightContainer.vAlign = 'top'
topRightContainer.width = '10%'
topRightContainer.color = Color4.FromHexString("#00000088")


//START POSITION//START POSITION//START POSITION
//START POSITION//START POSITION//START POSITION
//
export let topRightPositionCounter = new UIContainerRect(topRightContainer)
topRightPositionCounter.height = '25%'
topRightPositionCounter.hAlign = 'center'
topRightPositionCounter.vAlign = 'top'
topRightPositionCounter.width = '100%'
//topRightPositionCounter.color = Color4.Green()//Color4.FromHexString("#ffff088")

let positionTitle = new UIText(topRightPositionCounter)
positionTitle.value = "Position "
positionTitle.isPointerBlocker = false
positionTitle.vTextAlign = 'top'
positionTitle.hTextAlign = 'center'
positionTitle.vAlign = 'top'
positionTitle.fontSize = 14

let positionText = new UIText(topRightPositionCounter)
positionText.value = "1 / 3"
positionText.isPointerBlocker = false
positionText.paddingTop = 10
positionText.vTextAlign = 'center'
positionText.hTextAlign = 'center'
positionText.fontSize = 28

export function updateRacePosition(pos:number,total:number){
  const newVal = pos + " / " + total
  //small performance gain, only set when value changes
  if(positionText.value != newVal){
    positionText.value = newVal
  }else{
    //log("updateRacePosition noop")
  }
}


//START LAP COUNTER//LAP COUNTER//LAP COUNTER
//START LAP COUNTER//LAP COUNTER//LAP COUNTER
//
export let topRightLapCounter = new UIContainerRect(topRightContainer)
topRightLapCounter.height = '25%'
topRightLapCounter.positionY = 30
topRightLapCounter.hAlign = 'center'
topRightLapCounter.vAlign = 'center'
topRightLapCounter.width = '100%'
//topRightLapCounter.positionY = 10
//topRightLapCounter.color = Color4.Blue() //Color4.FromHexString("#ffff088")//Color4.FromHexString("#ff000088")

let lapTitle = new UIText(topRightLapCounter)
lapTitle.value = "Lap: "
lapTitle.isPointerBlocker = false
lapTitle.vTextAlign = 'top'
lapTitle.hTextAlign = 'center'
lapTitle.vAlign = 'top'
lapTitle.fontSize = 14

let lapText = new UIText(topRightLapCounter)
lapText.value = "1 / 3"
lapText.isPointerBlocker = false
lapText.paddingTop = 10
lapText.vTextAlign = 'center'
lapText.hTextAlign = 'center'
lapText.fontSize = 28


export let topRightTimesContainer = new UIContainerRect(topRightContainer)
topRightTimesContainer.positionY = 10
topRightTimesContainer.height = '50%'
topRightTimesContainer.hAlign = 'center'
topRightTimesContainer.vAlign = 'bottom'
topRightTimesContainer.width = '100%'
//topRightTimesContainer.color = Color4.Black()//Color4.FromHexString("#ffff088")//Color4.FromHexString("#ff000088")



export let topRightTotalTimeCounter = new UIContainerRect(topRightTimesContainer)
topRightTotalTimeCounter.height = '40%'
topRightTotalTimeCounter.hAlign = 'center'
topRightTotalTimeCounter.vAlign = 'top'
topRightTotalTimeCounter.width = '100%'
//topRightTotalTimeCounter.color = Color4.Teal()//Color4.FromHexString("#ffff088")//Color4.FromHexString("#ff000088")

let totalTimeLabel = new UIText(topRightTotalTimeCounter)
totalTimeLabel.value = "Total Time: "
totalTimeLabel.isPointerBlocker = false
totalTimeLabel.vTextAlign = 'top'
totalTimeLabel.hTextAlign = 'center'
totalTimeLabel.vAlign = 'top'
totalTimeLabel.fontSize = 14

let totalTimeText = new UIText(topRightTotalTimeCounter)
totalTimeText.value = "1:55:31"//\n00:12:21\n00:55:31"
totalTimeText.isPointerBlocker = false
totalTimeText.positionY = 5
totalTimeText.paddingTop = 30 
totalTimeText.vTextAlign = 'top'
totalTimeText.hTextAlign = 'bottom'
totalTimeText.fontSize = 14

// lapTimeArray.push(lapTimesText)



export let topRightLapTimesCounter = new UIContainerRect(topRightTimesContainer)
topRightLapTimesCounter.height = '60%'
topRightLapTimesCounter.hAlign = 'center'
topRightLapTimesCounter.vAlign = 'bottom'
topRightLapTimesCounter.width = '100%'
//topRightLapTimesCounter.color = Color4.Gray()//Color4.FromHexString("#ffff088")//Color4.FromHexString("#ff000088")

let lapTimesTitle = new UIText(topRightLapTimesCounter)
lapTimesTitle.value = "Lap Times: "
lapTimesTitle.isPointerBlocker = false
lapTimesTitle.vTextAlign = 'top'
lapTimesTitle.hTextAlign = 'center'
lapTimesTitle.vAlign = 'top'
lapTimesTitle.fontSize = 14


let quitRaceBtn = createButton(topRightLapTimesCounter,ui.darkTheme,resources.buttons.buttonRed,"Quit",20,Color4.White(),()=>{ 
  Constants.Game_2DUI.hideHowToPlayPrompt()
  //or just put over top of?
  //Constants.Game_2DUI.toggleGameResultsPrompt(false)
  Constants.SCENE_MGR.goLobby()
})
quitRaceBtn.positionY = -100 //-70
quitRaceBtn.height = parseInt(quitRaceBtn.height + "")/2


let howToPlayBtn = createButton(topRightLapTimesCounter,ui.darkTheme,resources.buttons.roundWhite,"How To Play",15,Color4.Black(),()=>{ 
  Constants.Game_2DUI.openHowToPlayPrompt()
})
howToPlayBtn.positionY = -70 //-100
howToPlayBtn.height = parseInt(howToPlayBtn.height + "")/2

const lapTimeArray=[]
for(let x=0;x<3;x++){
  let lapTimesText = new UIText(topRightLapTimesCounter)
  lapTimesText.value = x+"0:55:31"//\n00:12:21\n00:55:31"
  lapTimesText.isPointerBlocker = false
  lapTimesText.positionY = 5
  lapTimesText.paddingTop = 30 * x
  lapTimesText.vTextAlign = 'center'
  lapTimesText.hTextAlign = 'bottom'
  lapTimesText.fontSize = 14

  lapTimeArray.push(lapTimesText)
}


export function setLapCounter(text:string){
  lapText.value = text
}
export function showLapCounter(val:boolean){
  topRightContainer.visible = val
}


export let centerLaptimeContainer = new UIContainerRect(canvas)
centerLaptimeContainer.height = '7%'
centerLaptimeContainer.hAlign = 'center'
centerLaptimeContainer.vAlign = 'bottom'
centerLaptimeContainer.positionY = 5
centerLaptimeContainer.width = '10%'

centerLaptimeContainer.color = Color4.FromHexString("#00000088")

let lapTimeTitle = new UIText(centerLaptimeContainer)
lapTimeTitle.value = "Lap Time: "
lapTimeTitle.isPointerBlocker = false
lapTimeTitle.vTextAlign = 'top'
lapTimeTitle.hTextAlign = 'center'
lapTimeTitle.vAlign = 'top'
lapTimeTitle.paddingTop = 2
lapTimeTitle.fontSize = 10

let lapTimeText = new UIText(centerLaptimeContainer)
lapTimeText.value = "00:00"
lapTimeText.isPointerBlocker = false
lapTimeText.vTextAlign = 'center'
lapTimeText.hTextAlign = 'center'
lapTimeText.paddingTop = 5
lapTimeText.fontSize = 28

//flag controls if we show speed in bottom center instead of time
//maybe long term we show both?
const bottomCenterSpeed = true
//repurposing
let speedText = lapTimeText
let speedTitle = lapTimeTitle
if(bottomCenterSpeed){
  speedTitle.value = "Speed"
}


export function updateTotalTime(text:string,lapNumber:number,maxLaps?:number){
  totalTimeText.value = text
}
export function updateCarSpeed(text:string){
  if(bottomCenterSpeed && speedText.value != text) speedText.value = text
}
export function updateLapTime(text:string,lapNumber:number,maxLaps?:number){
  if(!lapTimeText) log("lapTimeText is null!!",lapTimeText)
  if(!bottomCenterSpeed) lapTimeText.value = text

  if(lapNumber !== undefined){
    const lapNumberBase0 = lapNumber-1

    if(lapNumber > 0 && lapNumberBase0 < lapTimeArray.length){
      if(!lapTimeArray[lapNumberBase0]) log("could not find laptimer" , lapNumberBase0,"for lap",lapNumber)
      lapTimeArray[lapNumberBase0].value = text
    }else if(lapNumberBase0 < lapTimeArray.length){
      let counter= 1
      for(const p in lapTimeArray){
        if(!lapTimeArray[p]) log("could not find laptimer" , p)
        lapTimeArray[p].value=text
        if(maxLaps !== undefined && counter > maxLaps){
          lapTimeArray[p].visible=false
        }
        counter++
      }
    }else{
      //over the lap limit, do nothing
    }
  }
}
export function showLapTime(val:boolean,maxLaps?:number){
  centerLaptimeContainer.visible = val
  let counter=1 
  
  for(const p in lapTimeArray){
    if(maxLaps !== undefined ){
      //debugger
      if(counter <= maxLaps){
        lapTimeArray[p].visible=val
      }else{
        lapTimeArray[p].visible=false
      }
    }else if(maxLaps === undefined){
      lapTimeArray[p].visible=val
    }
    counter++
  }
}

//
//END LAP COUNTER//LAP COUNTER//LAP COUNTER


//START WAITING TO START//START WAITING TO START
//START WAITING TO START//START WAITING TO START
//

const RACE_STARTING_FONT_COLOR = Color4.White()
const RACE_STARTING_FONT_HEADER = new Font(Fonts.SansSerif_Bold)
const RACE_STARTING_FONT_LABEL = new Font(Fonts.SansSerif)
const RACE_STARTING_FONT_VALUE = new Font(Fonts.SansSerif_Bold)
const RACE_STARTING_FONT_SIZE = 28
const RACE_STARTING_ROW_2_Y = -20

export let centerRaceStartingContainer = new UIContainerRect(canvas)
centerRaceStartingContainer.visible = false
centerRaceStartingContainer.height = '16%'
centerRaceStartingContainer.hAlign = 'center'
centerRaceStartingContainer.vAlign = 'top'
centerRaceStartingContainer.width = '40%'
centerRaceStartingContainer.color = Color4.Gray()



let raceStartingText = new UIText(centerRaceStartingContainer)
raceStartingText.value = "Waiting for racers to join"
raceStartingText.isPointerBlocker = false
raceStartingText.vTextAlign = 'center'
raceStartingText.hTextAlign = 'center'
raceStartingText.paddingTop = 0
raceStartingText.fontSize = 28
raceStartingText.positionY = 20
raceStartingText.color=RACE_STARTING_FONT_COLOR
raceStartingText.font = RACE_STARTING_FONT_HEADER


let raceCountText = new UIText(centerRaceStartingContainer)
raceCountText.value = "Racers"
raceCountText.isPointerBlocker = false
raceCountText.vTextAlign = 'center'
raceCountText.hTextAlign = 'center'
raceCountText.paddingTop = 5
raceCountText.fontSize = RACE_STARTING_FONT_SIZE
raceCountText.color=RACE_STARTING_FONT_COLOR
raceCountText.positionY = RACE_STARTING_ROW_2_Y
raceCountText.positionX = -150
raceCountText.font = RACE_STARTING_FONT_LABEL


let raceerCount = new UIText(centerRaceStartingContainer)
raceerCount.value = "3/8"
raceerCount.isPointerBlocker = false
raceerCount.vTextAlign = 'center'
raceerCount.hTextAlign = 'center'
raceerCount.paddingTop = 5
raceerCount.fontSize = RACE_STARTING_FONT_SIZE
raceerCount.color=RACE_STARTING_FONT_COLOR
raceerCount.positionY = RACE_STARTING_ROW_2_Y
raceerCount.positionX = -70
raceerCount.font = RACE_STARTING_FONT_VALUE

export function updateRaceCount(cnt:number,max:number){
  raceerCount.value = cnt + " / " + max
}


let raceCountdownText = new UIText(centerRaceStartingContainer)
raceCountdownText.value = "Time Left"//"Starting in "
raceCountdownText.isPointerBlocker = false
raceCountdownText.vTextAlign = 'center'
raceCountdownText.hTextAlign = 'center'
raceCountdownText.paddingTop = 5
raceCountdownText.fontSize = RACE_STARTING_FONT_SIZE
raceCountdownText.color=RACE_STARTING_FONT_COLOR
raceCountdownText.positionY = RACE_STARTING_ROW_2_Y
raceCountdownText.positionX = 70
raceCountdownText.font = RACE_STARTING_FONT_LABEL


let raceCountdown = new UIText(centerRaceStartingContainer)
raceCountdown.value = "3"
raceCountdown.isPointerBlocker = false
raceCountdown.vTextAlign = 'center'
raceCountdown.hTextAlign = 'center'
raceCountdown.paddingTop = 5
raceCountdown.fontSize = RACE_STARTING_FONT_SIZE
raceCountdown.color=RACE_STARTING_FONT_COLOR
raceCountdown.positionY = RACE_STARTING_ROW_2_Y
raceCountdown.positionX = 170
raceCountdown.font =RACE_STARTING_FONT_VALUE


const countdownTimer = new Entity()
engine.addEntity(countdownTimer)

let _enableCoundDownSound = false

export function stopCountdownTimer(){
  if(countdownTimer.hasComponent(utils.Interval)){
    countdownTimer.removeComponent(utils.Interval)
  }
}
function startRefreshTimer(startAt:number,callback:(val:number)=>void){
  //log("startRefreshTimer ",startAt)
  engine.addEntity(countdownTimer)
  //need it this high so the counter is right and not laggy
  countdownTimer.addComponentOrReplace(new utils.Interval(50, ()=>{
    let distance = startAt - (Date.now())
    
    if(distance <= 0){
        log('countdown is over') 
        engine.removeEntity(countdownTimer)
    }
    else{
      callback( Math.round(distance/1000))
    }
  }))
}

export function isRaceStartMsgVisible(){
  return centerRaceStartingContainer.visible
}
export function showRaceStartMsg(visible:boolean){
  centerRaceStartingContainer.visible = visible
  if(!visible) stopCountdownTimer()
}
export function enableCoundDownSound(val:boolean){
  _enableCoundDownSound = val
}
export function setRaceStartCountdown(val:number){
  const newVal = val +""
  if( raceCountdown.value != newVal){
    raceCountdown.value = newVal
    if(_enableCoundDownSound){
      if(val <= 3 && val != 0){
        SOUND_POOL_MGR.raceCountDownBeep.playOnce()
      }else if(val == 0){
        SOUND_POOL_MGR.raceStart.playOnce()
      }
      log("setRaceStartCountdown.play sound for ",newVal)
    }
    //log("setRaceStartCountdown  change",newVal)
    
  }else{
    //log("setRaceStartCountdown no change",newVal)
  }
  
  //start a timer
}

export function updateRaceStartWaiting(counter:number){
  enableCoundDownSound(false)
  raceStartingText.value = "Waiting for racers to join"
  raceCountdownText.value = "Time Left"

  centerRaceStartingContainer.color = Color4.FromHexString("#808080ee")//Color4.Gray()

  startRefreshTimer(Date.now() + (counter *1000),setRaceStartCountdown)
}
export function updateRaceStarting(counter:number){
  enableCoundDownSound(true)
  raceStartingText.value = "Race about to begin"
  raceCountdownText.value = "Starting in"

  centerRaceStartingContainer.color = Color4.FromHexString("#228b22ee")

  setRaceStartCountdown(counter)
  startRefreshTimer(Date.now() + (counter *1000),setRaceStartCountdown)
}
//
//END WAITING TO START//END WAITING TO START



//START GO POPUP//START GO POPUP//START GO POPUP
//START GO POPUP//START GO POPUP//START GO POPUP
//
export let centerGoContainer = new UIContainerRect(canvas)
centerGoContainer.visible = false
centerGoContainer.height = '8%'
centerGoContainer.hAlign = 'center'
centerGoContainer.vAlign = 'top'
centerGoContainer.width = '20%'
centerGoContainer.color = Color4.FromHexString("#00ab66ee")//Color4.Green()


let goText = new UIText(centerGoContainer)
goText.value = "GO!!!!"
goText.isPointerBlocker = false
goText.vTextAlign = 'center'
goText.hTextAlign = 'center'
goText.paddingTop = 0
goText.fontSize = 28
goText.font = new Font(Fonts.SansSerif_Bold)

export function isGoVisible(){
  return centerWrongWayContainer.visible
}
export function showGo(visible:boolean,duration?:number){
  centerGoContainer.visible = visible
  if(duration) utils.setTimeout(duration,()=>{ centerGoContainer.visible=false })
}

//
//END GO POPUP//END GO POPUP//END GO POPUP



//START WRONG WAY POPUP//START WRONG WAY POPUP
//START WRONG WAY POPUP//START WRONG WAY POPUP
//
export let centerWrongWayContainer = new UIContainerRect(canvas)
centerWrongWayContainer.visible = false
centerWrongWayContainer.height = '8%'
centerWrongWayContainer.hAlign = 'center'
centerWrongWayContainer.vAlign = 'top'
centerWrongWayContainer.width = '20%'
centerWrongWayContainer.color = Color4.FromHexString("#ee440088")


let wrongWayText = new UIText(centerWrongWayContainer)
wrongWayText.value = "WRONG WAY"
wrongWayText.isPointerBlocker = false
wrongWayText.vTextAlign = 'center'
wrongWayText.hTextAlign = 'center'
wrongWayText.paddingTop = 0
wrongWayText.fontSize = 28
wrongWayText.font = new Font(Fonts.SansSerif_Bold)

export function isWrongWayVisible(){
  return centerWrongWayContainer.visible
}
export function showWrongWay(visible:boolean){
  centerWrongWayContainer.visible = visible
}

//END WRONG WAY POPUP//START WRONG WAY POPUP
//END WRONG WAY POPUP//START WRONG WAY POPUP



//START RACE ENDED POPUP//START RACE ENDED POPUP
//START RACE ENDED POPUP//START RACE ENDED POPUP
//
/*
const RACE_ENDING_FONT_COLOR = Color4.White()
const RACE_ENDING_FONT_HEADER = new Font(Fonts.SansSerif_Bold)
const RACE_ENDING_FONT_LABEL = new Font(Fonts.SansSerif)
const RACE_ENDING_FONT_VALUE = new Font(Fonts.SansSerif_Bold)
const RACE_ENDING_FONT_SIZE = 28
const RACE_ENDING_ROW_2_Y = -20

export let centerRaceEndedContainer = new UIContainerRect(canvas)
centerRaceEndedContainer.visible = false
centerRaceEndedContainer.height = '16%'
centerRaceEndedContainer.hAlign = 'center'
centerRaceEndedContainer.vAlign = 'top'
centerRaceEndedContainer.width = '20%'
centerRaceEndedContainer.color = Color4.Blue()


let raceEndedText = new UIText(centerRaceEndedContainer)
raceEndedText.value = "Race Has Ended"
raceEndedText.isPointerBlocker = false
raceEndedText.vTextAlign = 'center'
raceEndedText.hTextAlign = 'center'
raceEndedText.paddingTop = 0
raceEndedText.fontSize = RACE_ENDING_FONT_SIZE
raceEndedText.positionY = 20
raceEndedText.positionX = 0
raceEndedText.font = RACE_ENDING_FONT_LABEL


let raceEndedResultText = new UIText(centerRaceEndedContainer)
raceEndedResultText.value = "Reason For End"
raceEndedResultText.isPointerBlocker = false
raceEndedResultText.vTextAlign = 'center'
raceEndedResultText.hTextAlign = 'center'
raceEndedResultText.paddingTop = 0
raceEndedResultText.fontSize = RACE_ENDING_FONT_SIZE
raceEndedResultText.color=RACE_ENDING_FONT_COLOR
raceEndedResultText.positionY = RACE_ENDING_ROW_2_Y
raceEndedResultText.positionX = 0
raceEndedResultText.font = RACE_ENDING_FONT_LABEL

export function isRaceEndedVisible(){
  return centerRaceEndedContainer.visible
}
export function showRaceEnded(visible:boolean){
  centerRaceEndedContainer.visible = visible
}
export function setRaceEndReasonText(text:string){
  raceEndedResultText.value = text
}*/
//END RACE ENDED POPUP//END RACE ENDED POPUP
//END RACE ENDED POPUP//END RACE ENDED POPUP



//DEBUG UI
export let BottomDebugContainer = new UIContainerStack(canvas)
BottomDebugContainer.visible = false
BottomDebugContainer.height = '20%'
BottomDebugContainer.hAlign = 'center'
BottomDebugContainer.vAlign = 'bottom'
BottomDebugContainer.width = 200
BottomDebugContainer.color = Color4.FromHexString("#00000088")


let debugSegmentBox = new UIContainerRect(BottomDebugContainer)
debugSegmentBox.width = 200
debugSegmentBox.height = 32
debugSegmentBox.hAlign= 'left'
debugSegmentBox.vAlign= 'top'
debugSegmentBox.color = Color4.FromHexString("#00000088")

let debugSegmentTitle = new UIText(debugSegmentBox)
debugSegmentTitle.value = "Current Segment ID: "
debugSegmentTitle.isPointerBlocker = false
debugSegmentTitle.vTextAlign = 'center'
debugSegmentTitle.hTextAlign = 'left'
debugSegmentTitle.hAlign= 'left'
debugSegmentTitle.vAlign= 'top'
debugSegmentTitle.fontSize = 12
debugSegmentTitle.height = '100%'

let debugSegmentText = new UIText(debugSegmentBox)
debugSegmentText.value = "0"
debugSegmentText.isPointerBlocker = false
debugSegmentText.vTextAlign = 'center'
debugSegmentText.hTextAlign = 'right'
debugSegmentText.hAlign= 'right'
debugSegmentText.vAlign= 'top'
debugSegmentText.fontSize = 12
debugSegmentText.height = '100%'

export function setUISegmentID(_ID:number){
  debugSegmentText.value = _ID.toString()
}

let debugDistanceBox = new UIContainerRect(BottomDebugContainer)
debugDistanceBox.width =  200
debugDistanceBox.height = 32
debugDistanceBox.hAlign= 'left'
debugDistanceBox.vAlign= 'top'
debugDistanceBox.color = Color4.FromHexString("#00000088")

let debugDistanceTitle = new UIText(debugDistanceBox)
debugDistanceTitle.value = "Distance from start: "
debugDistanceTitle.isPointerBlocker = false
debugDistanceTitle.vTextAlign = 'center'
debugDistanceTitle.hTextAlign = 'left'
debugDistanceTitle.hAlign= 'left'
debugDistanceTitle.vAlign= 'top'
debugDistanceTitle.fontSize = 12
debugDistanceTitle.height = '100%'

let debugDistanceText = new UIText(debugDistanceBox)
debugDistanceText.value = "0"
debugDistanceText.isPointerBlocker = false
debugDistanceText.vTextAlign = 'center'
debugDistanceText.hTextAlign = 'right'
debugDistanceText.hAlign= 'right'
debugDistanceText.vAlign= 'top'
debugDistanceText.fontSize = 12
debugDistanceText.height = '100%'

export function setUIDistance(_dist:number){
  debugDistanceText.value = _dist.toPrecision(3)
}

let debugCenterDistBox = new UIContainerRect(BottomDebugContainer)


debugCenterDistBox.width =  200
debugCenterDistBox.height = 32
debugCenterDistBox.hAlign= 'left'
debugCenterDistBox.vAlign= 'top'
debugCenterDistBox.color = Color4.FromHexString("#00000088")

let debugCenterDistTitle = new UIText(debugCenterDistBox)
debugCenterDistTitle.value = "Distance from centerline: "
debugCenterDistTitle.isPointerBlocker = false
debugCenterDistTitle.vTextAlign = 'center'
debugCenterDistTitle.hTextAlign = 'left'
debugCenterDistTitle.hAlign= 'left'
debugCenterDistTitle.vAlign= 'top'
debugCenterDistTitle.fontSize = 12
debugCenterDistTitle.height = '100%'

let debugCenterDistText = new UIText(debugCenterDistBox)
debugCenterDistText.value = "0"
debugCenterDistText.isPointerBlocker = false
debugCenterDistText.vTextAlign = 'center'
debugCenterDistText.hTextAlign = 'right'
debugCenterDistText.hAlign= 'right'
debugCenterDistText.vAlign= 'top'
debugCenterDistText.fontSize = 12
debugCenterDistText.height = '100%'

export function setUICenterDist(_dist:number){
  debugCenterDistText.value = _dist.toPrecision(3)
}


const projectionY = 0
const boostY = 40
const barLabelX = - 70
const barLabelShift = - 8
const barLabelFontSize = 14
const barLabelFontColor = Color4.Black()

let boostUIBar = new ui.UIBar(1, -30, boostY, Color4.Green(), ui.BarStyles.ROUNDSILVER, 1)
let projectileUIBar = new ui.UIBar(1, -30, projectionY, Color4.Yellow(), ui.BarStyles.ROUNDSILVER, 1)

let projectileBarLabel = new UIText(canvas)
projectileBarLabel.value = "Ammo"
projectileBarLabel.isPointerBlocker = false
projectileBarLabel.vAlign = 'bottom'
projectileBarLabel.hAlign = 'right'
projectileBarLabel.positionY = projectionY + barLabelShift
projectileBarLabel.positionX = barLabelX
projectileBarLabel.vTextAlign = 'center'
projectileBarLabel.hTextAlign = 'center'
projectileBarLabel.fontSize = barLabelFontSize
projectileBarLabel.color = barLabelFontColor

let projectileBarLabelHint = new UIText(canvas)
projectileBarLabelHint.value = "(Click)"
projectileBarLabelHint.isPointerBlocker = false
projectileBarLabelHint.vAlign = 'bottom'
projectileBarLabelHint.hAlign = 'right'
projectileBarLabelHint.positionY = projectionY + barLabelShift
projectileBarLabelHint.positionX = 0//barLabelX
projectileBarLabelHint.vTextAlign = 'center'
projectileBarLabelHint.hTextAlign = 'center'
projectileBarLabelHint.fontSize = barLabelFontSize - 5
projectileBarLabelHint.color = barLabelFontColor

let boostUIBarLabel = new UIText(canvas)
boostUIBarLabel.value = "Boost"
boostUIBarLabel.isPointerBlocker = false
boostUIBarLabel.vAlign = 'bottom'
boostUIBarLabel.hAlign = 'right'
//boostUIBarLabel.positionX = 100
boostUIBarLabel.positionY = boostY + barLabelShift
boostUIBarLabel.positionX = barLabelX
boostUIBarLabel.vTextAlign = 'center'
boostUIBarLabel.hTextAlign = 'center'
boostUIBarLabel.fontSize = barLabelFontSize
boostUIBarLabel.color = barLabelFontColor


let boostUIBarLabelHint = new UIText(canvas)
boostUIBarLabelHint.value = "(E)"
boostUIBarLabelHint.isPointerBlocker = false
boostUIBarLabelHint.vAlign = 'bottom'
boostUIBarLabelHint.hAlign = 'right'
boostUIBarLabelHint.positionY = boostY + barLabelShift
boostUIBarLabelHint.positionX = 0//barLabelX
boostUIBarLabelHint.vTextAlign = 'center'
boostUIBarLabelHint.hTextAlign = 'center'
boostUIBarLabelHint.fontSize = barLabelFontSize - 5
boostUIBarLabelHint.color = barLabelFontColor


export function setBoostBar(amount:number){
  const currVal = boostUIBar.read()
  //const targVal = amount/max
  //log("ItemRechargeSystem. updateBoostBar",currVal,amount)
  if(currVal != amount){
    boostUIBar.set(amount)
  }
}

export function setProjectileBar(amount:number){
  const currVal = boostUIBar.read()
  //const targVal = amount/max
  if(currVal != amount){
    projectileUIBar.set(amount)
  }
}

export function showBoostBar(val:boolean){
  if(val){
    boostUIBar.show()
  }else{
    boostUIBar.hide()
  }
  boostUIBarLabel.visible = val
  boostUIBarLabelHint.visible = val
}

export function showProjectileBar(val:boolean){
  if(val){
    projectileUIBar.show()
  }else{
    projectileUIBar.hide()
  } 
  projectileBarLabel.visible = val
  projectileBarLabelHint.visible = val
}
