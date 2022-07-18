import * as ui from '@dcl/ui-scene-utils'
import { afterRaceFormatPlayerName, sortPlayersByPosition } from '../connection/state-data-utils';
import { RaceRoomState } from '../connection/state/client-state-spec';
import { ENEMY_MGR } from '../playerManager';
//import { Constants.SCENE_MGR } from '../scene/raceSceneManager';
import { GAME_STATE } from '../state';
import * as utilities from "../utilities";

import * as scene from '../scene'
import { Constants } from '../resources/globals';
//import { setPlayerDriving} from "./car";

//const Constants.SCENE_MGR = Constants.Constants.SCENE_MGR

const canvas = ui.canvas

let PROMPT_WIDTH = 450
let OK_PROMPT_HEIGHT = 350
let PROMPT_HEIGHT = 300


const PROMPT_OFFSET_X = 0;//80//move it away from communications box as cant click thru it
const PROMPT_OFFSET_Y = 40
const MAIN_CONTENT_START_Y = 180
let PROMPT_TITLE_HEIGHT = 100 
let OK_PROMPT_TITLE_HEIGHT = 160 
let PROMPT_TEXT_HEIGHT = 100 
const PROMPT_TITLE_COLOR = Color4.White()
const BUTTON_HEIGHT = 60
const BUTTON_POS_Y =  -40 //-180

let buttonPosY = BUTTON_POS_Y
const buttonHeight = BUTTON_HEIGHT




//START END GAME MESSAGE//START END GAME MESSAGE
//START END GAME MESSAGE//START END GAME MESSAGE

PROMPT_WIDTH = 350
PROMPT_HEIGHT = 200
PROMPT_TITLE_HEIGHT = 80 
//const BUTTON_POS_Y =  -40 //-180

buttonPosY = BUTTON_POS_Y + 35//- 30

export const gameEndedPrompt = new ui.CustomPrompt(ui.PromptStyles.DARKLARGE,PROMPT_WIDTH,PROMPT_HEIGHT)

gameEndedPrompt.addText("Race Has Ended", 0, PROMPT_TITLE_HEIGHT ,PROMPT_TITLE_COLOR,20)  

const endGameResultReason = gameEndedPrompt.addText("End Reason Here", 0, 20 ,PROMPT_TITLE_COLOR,20)  

gameEndedPrompt.addButton(
  'Results',
  0,
  buttonPosY - buttonHeight,
  () => { 
    log('end')
    //Constants.SCENE_MGR.goLobby(true)
    showRaceEnded(false)
    openGameResultsPrompt()
  },
  ui.ButtonStyles.E
)

gameEndedPrompt.hide()

export function isRaceEndedVisible(){
  return gameEndedPrompt.background.visible
}

export function openGameEndedPrompt(){
  gameEndedPrompt.show()
  gameEndedPrompt.closeIcon.visible=false
}
export function hideGameEndedPrompt(){
  gameEndedPrompt.hide()
}
export function showRaceEnded(visible:boolean){
  if(visible){
    openGameEndedPrompt()
  }else{
    hideGameEndedPrompt()
  }
}

export function setRaceEndReasonText(text:string){
  endGameResultReason.text.value = text
}

//START END GAME LEADERBOARD//START END GAME LEADERBOARD
//START END GAME LEADERBOARD//START END GAME LEADERBOARD


PROMPT_WIDTH = 450
OK_PROMPT_HEIGHT = 350
PROMPT_HEIGHT = 300

PROMPT_TITLE_HEIGHT = 100 
OK_PROMPT_TITLE_HEIGHT = 160 
PROMPT_TEXT_HEIGHT = 100 

buttonPosY = BUTTON_POS_Y

PROMPT_WIDTH = 500
PROMPT_HEIGHT = 550
PROMPT_TITLE_HEIGHT = 250 

buttonPosY = BUTTON_POS_Y - 130

const gameResultsPrompt = new ui.CustomPrompt(ui.PromptStyles.DARKLARGE,PROMPT_WIDTH,PROMPT_HEIGHT)

const gameResultsPromptTitle = gameResultsPrompt.addText("Level Name Results", 0, PROMPT_TITLE_HEIGHT ,PROMPT_TITLE_COLOR,20)  


type PlayerResultsRow2DUI={
  position?:ui.CustomPromptText
  icon?:ui.CustomPromptIcon
  name?:ui.CustomPromptText
  time?:ui.CustomPromptText
}


const iconHeight = 30
const imageRowYPad = 2
const imageBreakerPad = -6
const resultRows:PlayerResultsRow2DUI[]=[]
let rowStartPosY = 200
let rowPosY = 0

 
const lineBreakTexture = new Texture("textures/road_orm.png")
//const lineBreakTexture = new Texture("textures/road_orm.png")
const defaultPlayerIcon = new Texture("textures/anonymous-player.png")
const lineBreakTextureSource = undefined//{sourceHeight:128,sourceWidth:128}
const avatarTextureSource = {sourceHeight:256,sourceWidth:256}

for(let x=0;x<8;x++){
  const row:PlayerResultsRow2DUI = {}

  row.position = gameResultsPrompt.addText(x+1+"", -150, rowStartPosY + rowPosY)

  row.icon = gameResultsPrompt.addIcon(defaultPlayerIcon.src, -100 , rowStartPosY + rowPosY - (iconHeight/2) - imageRowYPad,iconHeight,iconHeight,avatarTextureSource)

  row.name = gameResultsPrompt.addText("player name " + x, 20, rowStartPosY + rowPosY)
 
  row.time = gameResultsPrompt.addText(utilities.formatTime( Math.floor(Math.random()*200) ), 150, rowStartPosY + rowPosY)

  //new row???
  const lineBreaker = gameResultsPrompt.addIcon(lineBreakTexture.src, 0, rowStartPosY + rowPosY - imageBreakerPad,400,2,lineBreakTextureSource)
  lineBreaker.image.source = lineBreakTexture

  resultRows.push( row )

  rowPosY -= 50
}

//resultRows.reverse()

//new row???
const lineBreaker = gameResultsPrompt.addIcon(lineBreakTexture.src, 0, rowStartPosY + rowPosY - imageBreakerPad,400,2,lineBreakTextureSource)
lineBreaker.image.source = lineBreakTexture


gameResultsPrompt.hide()

gameResultsPrompt.addButton(
  'Return to Lobby',
  -100,
  buttonPosY - buttonHeight,
  () => { 
    log('end')
    Constants.SCENE_MGR.goLobby(true)
    hideGameResultsPrompt()
  },
  ui.ButtonStyles.ROUNDWHITE
)


gameResultsPrompt.addButton(
  'Race Again',
  100,
  buttonPosY - buttonHeight,
  () => { 
    log('race again')
    Constants.SCENE_MGR.goRace(true)
    hideGameResultsPrompt()
  },
  ui.ButtonStyles.ROUNDGOLD
)
/*
gameResultsPrompt.addButton(
  'Cancel',
  -100,
  buttonPosY - buttonHeight,
  () => {
    log('No')
    //startGamePrompt.hide()
    hideQuitGameConfirmPrompt()
    ///showPickerPrompt()
  },
  //ui.ButtonStyles.F
)
*/

function hidePlayerResultRow(row:PlayerResultsRow2DUI){
  row.name.hide()
  row.time.hide()
  row.icon.hide()
  row.position.hide()
}
export function updateGameResultRows(state: RaceRoomState){
  const playerDataRanked = sortPlayersByPosition(state?.players,afterRaceFormatPlayerName)
  log("updateGameResultRows",playerDataRanked)
  const roomNames:string[] = []
  let counter = 0
  for(const p in playerDataRanked){
      const pd = playerDataRanked[p]
      const row = resultRows[counter]
      const player = ENEMY_MGR.getPlayerByID(pd.id)
      const playerServerState = state.players.get(pd.id)

      row.name.text.value = pd.name

      if(pd.endTime){
        row.time.text.value = utilities.formatTime( (pd.endTime - state.raceData.startTime)/1000 )
      }else{
        row.time.text.value =  "-:-"
      }

      if(pd.id == GAME_STATE.gameRoom.sessionId){
        //log("using player avatar texture",scene.player.avatarTexture)
        row.icon.image.source = scene.player.avatarTexture
        //row.icon.image.source
      }else if(player && player && player.avatarTexture){
        //log("using enemy player avatar texture",player.avatarTexture)
        row.icon.image.source = player.avatarTexture
      }else{
        row.icon.image.source = defaultPlayerIcon
      }
      //roomNames.push( counter + ": " + pd.name )

      counter++
  }
  for(let x=counter;x<resultRows.length;x++){
    //log("updateGameResultRows calling hide on row ",x)
    hidePlayerResultRow(resultRows[x] )
  }

  //return resultRows;
  //resultRows
}
export function openGameResultsPrompt(){
    gameResultsPromptTitle.text.value = GAME_STATE.raceData.name
    gameResultsPrompt.show()
    gameResultsPrompt.closeIcon.visible=false 
    Constants.Game_2DUI.updateGameResultRows( GAME_STATE.getRaceRoom()?.state ) //call after show
}
export function hideGameResultsPrompt(){
  gameResultsPrompt.hide()
}

export function toggleGameResultsPrompt(val:boolean){
  if(val){
    openGameResultsPrompt()
  }else{
    hideGameResultsPrompt()
  }
}

export function isRaceResultsPromptVisible(){
  return gameResultsPrompt.background.visible
}


//
//END END GAME LEADERBOARD//START END GAME LEADERBOARD

//START END GAME CONFIRM PROMPT//START END GAME CONFIRM PROMPT
//START END GAME CONFIRM PROMPT//START END GAME CONFIRM PROMPT



PROMPT_WIDTH = 450
OK_PROMPT_HEIGHT = 350
PROMPT_HEIGHT = 300

PROMPT_TITLE_HEIGHT = 100 
OK_PROMPT_TITLE_HEIGHT = 160 
PROMPT_TEXT_HEIGHT = 100 

buttonPosY = BUTTON_POS_Y 

export const quitGameConfirmPrompt = new ui.CustomPrompt(ui.PromptStyles.DARKLARGE,PROMPT_WIDTH,PROMPT_HEIGHT)
quitGameConfirmPrompt.addText("End Current Game\n No progress will be saved.", 0, PROMPT_TITLE_HEIGHT ,PROMPT_TITLE_COLOR,20)  

 
quitGameConfirmPrompt.hide()

quitGameConfirmPrompt.addButton(
  'End Game',
  100,
  buttonPosY - buttonHeight,
  () => { 
    log('end')
    Constants.SCENE_MGR.goLobby(true)
    hideQuitGameConfirmPrompt()
  },
  ui.ButtonStyles.ROUNDGOLD
)

quitGameConfirmPrompt.addButton(
  'Cancel',
  -100,
  buttonPosY - buttonHeight,
  () => {
    log('No')
    //startGamePrompt.hide()
    hideQuitGameConfirmPrompt()
    ///showPickerPrompt()
  },
  //ui.ButtonStyles.F
)


export function openQuitGameConfirmPrompt(){
    quitGameConfirmPrompt.show()
}
export function hideQuitGameConfirmPrompt(){
    quitGameConfirmPrompt.hide()
}

//
//END GAME CONFIRM PROMPT//END GAME CONFIRM PROMPT


//START END GAME CONFIRM PROMPT//START END GAME CONFIRM PROMPT
//START END GAME CONFIRM PROMPT//START END GAME CONFIRM PROMPT

PROMPT_TITLE_HEIGHT = 100 
OK_PROMPT_TITLE_HEIGHT = 160 
PROMPT_TEXT_HEIGHT = 100 

buttonPosY = BUTTON_POS_Y

PROMPT_WIDTH = 500
PROMPT_HEIGHT = 550
PROMPT_TITLE_HEIGHT = 250 

buttonPosY = BUTTON_POS_Y 

export const howToPlayPrompt = new ui.CustomPrompt(ui.PromptStyles.DARKLARGE,PROMPT_WIDTH,OK_PROMPT_HEIGHT)
howToPlayPrompt.addText("How To Play", 0, OK_PROMPT_TITLE_HEIGHT ,PROMPT_TITLE_COLOR,22)  

let rowY = PROMPT_TEXT_HEIGHT - 20
const rowHeight = 20
const text = howToPlayPrompt.addText("Use the mouse to steer in the direction you want to go.  Avoid the traps.  Shoot traps to get them out of your path (they will respawn after a period of time).", 0,  rowY ,PROMPT_TITLE_COLOR,15)  
text.text.width = PROMPT_WIDTH - 30
text.text.height = 80
text.text.textWrapping = true

rowY-=rowHeight
rowY-=rowHeight
rowY-=rowHeight
howToPlayPrompt.addText("W - Gas (drive forward)", 0,  rowY ,PROMPT_TITLE_COLOR,15)  
rowY-=rowHeight
howToPlayPrompt.addText("E - Boost (burst of speed)", 0,  rowY ,PROMPT_TITLE_COLOR,15)  
rowY-=rowHeight
howToPlayPrompt.addText("F - Brake (slow down)", 0,  rowY ,PROMPT_TITLE_COLOR,15)  
rowY-=rowHeight
howToPlayPrompt.addText("Click - Shoot projectile", 0,  rowY ,PROMPT_TITLE_COLOR,15)  
rowY-=rowHeight
 
howToPlayPrompt.hide()

howToPlayPrompt.addButton(
  'Got It!',
  0,//100,
  buttonPosY - 20 - buttonHeight,
  () => { 
    if(!Constants.showedHowToPlayAlready){
      Constants.showedHowToPlayAlready = true
      Constants.SCENE_MGR.goRace()
    }
    hideHowToPlayPrompt()
  },
  ui.ButtonStyles.E
)

//howToPlayPrompt.hide()

export function openHowToPlayPrompt(){
  howToPlayPrompt.show()
}
export function hideHowToPlayPrompt(){
  howToPlayPrompt.hide()
}

//
//END GAME CONFIRM PROMPT//END GAME CONFIRM PROMPT


//MAKE LAST SO ITS ONTOP

//START LOGIN ERROR PROMPT//START LOGIN ERROR PROMPT
//START LOGIN ERROR PROMPT//START LOGIN ERROR PROMPT

export const loginErrorPrompt = new ui.OptionPrompt(
  'An Error Occured',
  'Error',
  () => {
      loginErrorPrompt.close()
  },
  () => {
      loginErrorPrompt.hide()
      GAME_STATE.playerState.requestDoLoginFlow()
  },
  'Cancel',
  'Try Again', true
)

loginErrorPrompt.hide()


export const errorPrompt = new ui.OkPrompt(
  'An Error Occured',
  ()=>{

  }
)

errorPrompt.hide()

//END LOGIN ERROR PROMPT//END LOGIN ERROR PROMPT