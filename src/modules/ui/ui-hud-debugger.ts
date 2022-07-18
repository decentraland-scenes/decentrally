import * as ui from '@dcl/ui-scene-utils'

import * as utils from '@dcl/ecs-scene-utils'
import { CONFIG } from 'src/config'
import { colyseusReConnect,  joinLobby, joinNewRoom, joinOrCreateRoom, leave } from '../connection/connect-flow'
//import { Constants.SCENE_MGR } from '../scene/raceSceneManager'
import { RacingScene } from '../scene/race'
import { mercedes, mercedesAltTest } from '../carData'
import { Game_2DUI } from './index'
import { GAME_STATE } from '../state'
import * as clientState from '../connection/state/client-state-spec'
import { player, scene } from '../scene'
import { themeControl } from '../themeData'
import {  logout, refreshUserData, resetLoginState } from 'src/login/login-flow'
import { Constants } from '../resources/globals'
import { LeaderBoardManager } from '../scene/menu'



const textFont = new Font(Fonts.SansSerif)
 
const canvas = ui.canvas


const buttonPosSTART = -350
let buttonPosCounter = buttonPosSTART
let buttonPosY = -50//350
const buttomWidth = 121
const changeButtomWidth = 120
const changeButtomHeight = 16
 
const WORLD_MOVE_DIR_RIGHT = Quaternion.Euler(0,90,0)//right
const WORLD_MOVE_DIR_FWD = Quaternion.Euler(0,0,0)//forward
const WORLD_MOVE_DIR_BKWD = Quaternion.Euler(180,0,180)//backwards
 const WORLD_MOVE_DIR_LEFT = Quaternion.Euler(0,270,0)//left


function testMoveCar(){
  scene.worldMoveVector = new Vector3(0,0,-1*.5).rotate(player.worldMoveDirection)
  scene.worldMoveVector.y = 0 //worldMoveDirection, Camera.instance.rotation, 3)          
  
  testMoveCar2(scene.worldMoveVector)
}

function testMoveCar2(moveVec:Vector3){
  scene.worldMoveVector = moveVec
  scene.worldMoveVector.y = 0 //worldMoveDirection, Camera.instance.rotation, 3)          
  Constants.SCENE_MGR.racingScene.worldMoveSystem.updateEntityPositions(scene.worldMoveVector)

  log("player.worldMoveDirection",player.worldMoveDirection,"scene.worldMoveVector",scene.worldMoveVector)
}

function updateDebugButtonUI(testButton:ui.CustomPromptButton){
  if(changeButtomWidth>0) testButton.image.width = changeButtomWidth
  if(changeButtomHeight>0) testButton.image.height = changeButtomHeight
  testButton.label.fontSize -= 5
}
function boolShortNameOnOff(val:boolean){
  if(val) return "On"
  return "Off"
}
export function createDebugUIButtons(){
  if(!CONFIG.TEST_CONTROLS_ENABLE){
    log("debug buttons disabled")
    return
  }
  log("debug buttons")

  let testButton:ui.CustomPromptButton = null
  
  const testControlsToggle = new ui.CustomPrompt(ui.PromptStyles.DARKLARGE,1,1)
  
  
  testControlsToggle.background.positionY = 350
  //testControls.background.visible = false
  testControlsToggle.closeIcon.visible = false
  //testControls.addText('Who should get a gift?', 0, 280, Color4.Red(), 30)
  //const pickBoxText:ui.CustomPromptText = testControls.addText("_It's an important decision_", 0, 260)  
   

  
  const testControls = new ui.CustomPrompt(ui.PromptStyles.DARKLARGE,1,1)
  
  
  const enableDisableToggle = testButton = testControlsToggle.addButton(
    'testTools:'+boolShortNameOnOff(!CONFIG.TEST_CONTROLS_DEFAULT_EXPANDED),
    buttonPosCounter,
    buttonPosY,
    () => { 
      log("enableDisableToggle " + testControls.background.visible)
      if(testControls.background.visible){
        testControls.hide()
        testControls.closeIcon.visible = testControls.background.visible
      }else{
        testControls.show()
        testControls.closeIcon.visible = testControls.background.visible
      }
      enableDisableToggle.label.value='testTools:'+boolShortNameOnOff(!testControls.background.visible)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(enableDisableToggle)
  
  buttonPosCounter += buttomWidth
    
  if(CONFIG.TEST_CONTROLS_DEFAULT_EXPANDED){
    testControls.show()
  }else{
    testControls.hide()
  }
    
  
  testControls.background.positionY = 350  
  //testControls.background.visible = false
  testControls.closeIcon.visible = false
  //testControls.addText('Who should get a gift?', 0, 280, Color4.Red(), 30)
  //const pickBoxText:ui.CustomPromptText = testControls.addText("_It's an important decision_", 0, 260)  
  
  testControls.background.positionY = 350
  //testControls.background.visible = false
  testControls.closeIcon.visible = false
  //testControls.addText('Who should get a gift?', 0, 280, Color4.Red(), 30)
  //const pickBoxText:ui.CustomPromptText = testControls.addText("_It's an important decision_", 0, 260)  
  




  const tglLobby = testButton = testControls.addButton(
    'Tgl:Lobby:'+boolShortNameOnOff(!Constants.SCENE_MGR.lobbyScene.isVisible()),
    buttonPosCounter,
    buttonPosY,
    () => { 
      log("exteriorScene.visible " +Constants.SCENE_MGR.lobbyScene.isVisible())
      
      if(Constants.SCENE_MGR.lobbyScene.isVisible()){
        Constants.SCENE_MGR.lobbyScene.hide()
      }else{
        Constants.SCENE_MGR.lobbyScene.show()
      }
      tglLobby.label.value = 'Tgl:Lobby:'+boolShortNameOnOff(!Constants.SCENE_MGR.lobbyScene.isVisible())
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)

  buttonPosCounter += buttomWidth //next column
   
  log('init.Tgl:Race:'+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible()))
  const tglRace = testButton = testControls.addButton(
    'Tgl:Race:'+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible()),
    buttonPosCounter, 
    buttonPosY,
    () => { 
      if(Constants.SCENE_MGR.racingScene.isVisible()){
        Constants.SCENE_MGR.racingScene.hide()
      }else{
        Constants.SCENE_MGR.racingScene.show()
      }   
      tglRace.label.value = 'Tgl:Race:'+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible())
      log('Tgl:Race:'+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible()))
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)

  buttonPosCounter += buttomWidth //next column
   
   
  const tglInCar = testButton = testControls.addButton(
    'Tgl:InCar:',//+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible()),
    buttonPosCounter, 
    buttonPosY,
    () => { 
      if(Constants.SCENE_MGR.racingScene.isVisible()){
        const racingScene = Constants.SCENE_MGR.racingScene as RacingScene
        if(racingScene.isInCar()){
          racingScene.exitCar()
        }else{
          racingScene.enterCar()
        }
      }else{
        ui.displayAnnouncement("racing not enabled")
      }   
      //tglRace.label.value = 'Tgl:Race:'+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible())
      //log('Tgl:Race:'+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible()))
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)

  buttonPosCounter += buttomWidth //next column
  
  testButton = testControls.addButton(
    'Reset:Race',//+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible()),
    buttonPosCounter, 
    buttonPosY,
    () => { 
      if(Constants.SCENE_MGR.racingScene.isVisible()){
        const racingScene = Constants.SCENE_MGR.racingScene as RacingScene
        racingScene.resetRace()
        racingScene.startRace()
        racingScene.showRaceUI()
        racingScene.enterCar()
      }else{
        ui.displayAnnouncement("racing not enabled")
      }   
      //tglRace.label.value = 'Tgl:Race:'+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible())
      //log('Tgl:Race:'+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible()))
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)

  buttonPosCounter += buttomWidth //next column
  

  testButton = testControls.addButton(
    'Reset:RaceTk',//+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible()),
    buttonPosCounter, 
    buttonPosY,
    () => { 
      if(Constants.SCENE_MGR.racingScene.isVisible()){
        const racingScene = Constants.SCENE_MGR.racingScene as RacingScene
        racingScene.resetRaceTrack()
      }else{
        ui.displayAnnouncement("racing not enabled")
      }   
      //tglRace.label.value = 'Tgl:Race:'+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible())
      //log('Tgl:Race:'+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible()))
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)

  buttonPosCounter += buttomWidth //next column

  const tglTheme = testButton = testControls.addButton(
    'Tgl:Theme',//+boolShortNameOnOff(!Constants.SCENE_MGR.racingScene.isVisible()),
    buttonPosCounter, 
    buttonPosY,
    () => { 
      let next = themeControl.currentThemeIdx + 1
      
      if(next >= themeControl.themes.length){ 
        next = 0
      }
      themeControl.setTheme(next)

      tglTheme.label.value = 'Tgl:Theme:'+themeControl.getCurrentTheme().name
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)


  //NEW ROW//NEW ROW
  buttonPosY -= changeButtomHeight + 2
  buttonPosCounter = buttonPosSTART

  
  testButton = testControls.addButton(
    'Join Lobby',
    buttonPosCounter,
    buttonPosY,
    () => { 
      joinLobby()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  
   
  testButton = testControls.addButton(
    'Leave(T)',
    buttonPosCounter,
    buttonPosY,
    () => { 
      leave(true)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  
  
  testButton = testControls.addButton(
    'Leave(F)',
    buttonPosCounter,
    buttonPosY,
    () => { 
      leave(false)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  
   
  
  testButton = testControls.addButton(
    'ReConnnect',
    buttonPosCounter,
    buttonPosY,
    () => { 
      colyseusReConnect()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  
  
  testButton = testControls.addButton(
    'NewRoom',
    buttonPosCounter,
    buttonPosY,
    () => { 
      joinNewRoom()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  
  
  testButton = testControls.addButton(
    'JoinRoom',
    buttonPosCounter,
    buttonPosY,
    () => { 
      joinOrCreateRoom(CONFIG.GAME_RACE_ROOM_NAME)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  

  
  //NEW ROW//NEW ROW
  buttonPosY -= changeButtomHeight + 2
  buttonPosCounter = buttonPosSTART



testButton = testControls.addButton(
  'ReLoginFlow',
  buttonPosCounter,
  buttonPosY,
  () => { 
    resetLoginState()
    GAME_STATE.playerState.requestDoLoginFlow()
  },
  ui.ButtonStyles.RED
)
updateDebugButtonUI(testButton)
buttonPosCounter += buttomWidth //next column


testButton = testControls.addButton(
  'Logout',
  buttonPosCounter,
  buttonPosY,
  () => { 
    logout()
  },
  ui.ButtonStyles.RED
)
updateDebugButtonUI(testButton)

buttonPosCounter += buttomWidth //next column

testButton = testControls.addButton(
  'ReLoginPlafab',
  buttonPosCounter,
  buttonPosY,
  () => { 
    GAME_STATE.setLoginSuccess(false)
    GAME_STATE.playerState.loginFlowState='customid-success'
    Constants.doLoginFlow()
  },
  ui.ButtonStyles.RED
)
updateDebugButtonUI(testButton)

buttonPosCounter += buttomWidth //next column


testButton = testControls.addButton(
  'RefreshUsrData',
  buttonPosCounter,
  buttonPosY,
  () => { 
    refreshUserData()
  },
  ui.ButtonStyles.RED
)
updateDebugButtonUI(testButton)
buttonPosCounter += buttomWidth //next column



  
  //NEW ROW//NEW ROW
  buttonPosY -= changeButtomHeight + 2
  buttonPosCounter = buttonPosSTART

   
  testButton = testControls.addButton(
    'Tgl:Car:Merc',
    buttonPosCounter,
    buttonPosY,
    () => { 
      Constants.SCENE_MGR.racingScene.updateCarData( mercedes )
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    'Tgl:Car:MercAlt',
    buttonPosCounter,
    buttonPosY,
    () => { 
      Constants.SCENE_MGR.racingScene.updateCarData( mercedesAltTest )
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  

  //NEW ROW//NEW ROW
  buttonPosY -= changeButtomHeight + 2
  buttonPosCounter = buttonPosSTART

   
  testButton = testControls.addButton(
    'TGL:WrongWay',
    buttonPosCounter,
    buttonPosY,
    () => { 
      Game_2DUI.showWrongWay( !Game_2DUI.isWrongWayVisible() )
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column


  testButton = testControls.addButton(
    'TGL:GO',
    buttonPosCounter,
    buttonPosY,
    () => { 
      Game_2DUI.showGo( !Game_2DUI.isGoVisible() )
    },
    ui.ButtonStyles.RED
  )  
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column


  testButton = testControls.addButton(
    'TGL:WaitingToStart',
    buttonPosCounter,
    buttonPosY,
    () => { 
      Game_2DUI.updateRaceStartWaiting(30)
      Game_2DUI.showRaceStartMsg( !Game_2DUI.isRaceStartMsgVisible() )
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    'TGL:RaceEnded',
    buttonPosCounter,
    buttonPosY,
    () => { 
      Game_2DUI.setRaceEndReasonText("time" + Date.now())
      Game_2DUI.showRaceEnded( !Game_2DUI.isRaceEndedVisible() )
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column


  testButton = testControls.addButton(
    'TGL:RaceResults',
    buttonPosCounter,
    buttonPosY,
    () => { 
      Game_2DUI.toggleGameResultsPrompt( !Game_2DUI.isRaceResultsPromptVisible() ) //must call before update
      //Game_2DUI.updateGameResultRows( GAME_STATE.getRaceRoom()?.state ) //call after show
      
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  

  //NEW ROW//NEW ROW
  buttonPosY -= changeButtomHeight + 2
  buttonPosCounter = buttonPosSTART

   
  testButton = testControls.addButton(
    'Go:Race',
    buttonPosCounter,
    buttonPosY,
    () => { 
      Constants.SCENE_MGR.goRace()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    'Go:Lobby',
    buttonPosCounter,
    buttonPosY,
    () => { 
      Constants.SCENE_MGR.goLobby()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  

  testButton = testControls.addButton(
    'Rfsh:Leaderboards',
    buttonPosCounter,
    buttonPosY,
    () => { 
      Constants.SCENE_MGR.lobbyScene.refreshLevelLeaderboardStats({reloadSelected:true,defaultStat:LeaderBoardManager.DEFAULT_STAT_POSTFIX})
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  
  

  //NEW ROW//NEW ROW
  buttonPosY -= changeButtomHeight + 2
  buttonPosCounter = buttonPosSTART

  testButton = testControls.addButton(
    'Wrld:CAM',
    buttonPosCounter,
    buttonPosY,
    () => { 
      //Constants.SCENE_MGR.goLobby()
      
      player.worldMoveDirection = Camera.instance.rotation  

      scene.worldMoveVector = new Vector3(0,0,-1*.5).rotate(player.worldMoveDirection)
      scene.worldMoveVector.y = 0 //worldMoveDirection, Camera.instance.rotation, 3)          
      Constants.SCENE_MGR.racingScene.worldMoveSystem.updateEntityPositions(scene.worldMoveVector)

      log("player.worldMoveDirection",player.worldMoveDirection,"scene.worldMoveVector",scene.worldMoveVector)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column


  testButton = testControls.addButton(
    'Wrld:FWD',
    buttonPosCounter,
    buttonPosY,
    () => { 
      //Constants.SCENE_MGR.goLobby()
      
      player.worldMoveDirection = WORLD_MOVE_DIR_FWD

      testMoveCar()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    'Wrld:LEFT',
    buttonPosCounter,
    buttonPosY,
    () => { 
      
      player.worldMoveDirection = WORLD_MOVE_DIR_LEFT
        

      testMoveCar()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    'Wrld:RIGHT',
    buttonPosCounter,
    buttonPosY,
    () => { 
      player.worldMoveDirection = WORLD_MOVE_DIR_RIGHT
        
      testMoveCar()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  testButton = testControls.addButton(
    'Wrld:BACK',
    buttonPosCounter,
    buttonPosY,
    () => { 
      
      player.worldMoveDirection = WORLD_MOVE_DIR_BKWD

      testMoveCar()
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column
  

  testButton = testControls.addButton(
    'Srt:Pos1',
    buttonPosCounter,
    buttonPosY,
    () => { 
      let moveVect = Constants.SCENE_MGR.racingScene.startPositionSceneEnts[0].entity.getComponent(Transform).position.subtract( scene.center )
      moveVect.scaleInPlace(-1)

      testMoveCar2(moveVect)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column


  testButton = testControls.addButton(
    'Srt:Pos2',
    buttonPosCounter,
    buttonPosY,
    () => { 
      let moveVect = Constants.SCENE_MGR.racingScene.startPositionSceneEnts[1].entity.getComponent(Transform).position.subtract( scene.center )
      moveVect.scaleInPlace(-1)

      testMoveCar2(moveVect)
    },
    ui.ButtonStyles.RED
  )
  updateDebugButtonUI(testButton)
  
  buttonPosCounter += buttomWidth //next column

  
} 
 
