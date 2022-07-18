import { scene, player } from "../scene";
import * as ui from '@dcl/ui-scene-utils'
//import { setPlayerDriving} from "./car";
import * as leaderboard from 'leaderboard'
import * as raceHud from 'ui-race-hud'
import * as racePrompts from 'ui-race-prompts'
import * as clientSpec from "../connection/state/client-state-spec";
import * as utilities from "../utilities";

import { Constants } from "../resources/globals";
import { IGame2DUI } from "./iGame2DUI";


let uiAtlasTexture = new Texture('textures/ui_atlas.png', {samplingMode: 1})

export const canvas = ui.canvas
/*
export let topRightContainer = new UIContainerRect(canvas)
topRightContainer.height = '20%'
topRightContainer.hAlign = 'right'
topRightContainer.vAlign = 'top'
topRightContainer.width = '10%'
topRightContainer.color = Color4.FromHexString("#00000088")

export let topRightExitCarContainer = new UIContainerRect(topRightContainer)
topRightExitCarContainer.height = '40%'
topRightExitCarContainer.hAlign = 'right'
topRightExitCarContainer.vAlign = 'bottom'
topRightExitCarContainer.width = '100%'
topRightExitCarContainer.color = Color4.FromHexString("#00000088")

export let exitCarBtn = new UIImage(topRightExitCarContainer, uiAtlasTexture)
exitCarBtn.visible = false 
exitCarBtn.positionX = 8
exitCarBtn.width = '32px'
exitCarBtn.height = '32px'
exitCarBtn.sourceLeft = 0
exitCarBtn.sourceTop = 0
exitCarBtn.sourceWidth = 64
exitCarBtn.sourceHeight = 64
exitCarBtn.hAlign = 'left'
exitCarBtn.vAlign = 'center' 
exitCarBtn.isPointerBlocker = true
exitCarBtn.onClick = new OnClick(() => {  
  //setPlayerDriving(false)
})

let exitCarText = new UIText(exitCarBtn)
exitCarText.value = "Exit Car"
exitCarText.isPointerBlocker = false
exitCarText.vTextAlign = 'center'
exitCarText.hTextAlign = 'right'
exitCarText.positionX = 15
exitCarText.fontSize = 20*/

/**
 * created this as a workaround as was getting errors with imports however 
 * this centralized class i think is the right way to go long term
 * just unfortunate must proxy the calls
 */
export class Game2DUI implements IGame2DUI{
  
  hideAll(){
    this.showLeaderboard(false)
    this.showLapTime(false)
    this.showGo(false)
    this.showRaceStartMsg(false)
    this.showWrongWay(false)
    this.showLapCounter(false)
    this.showRaceEnded(false)  
    this.showProjectileBar(false)  
    this.showBoostBar(false)  
    this.raceExitHidePrompts()
  }
  reset(){
    this.setLapCounter("")
    this.updateLapTime("",-1)
    this.updateTotalTime("")
    this.updateLeaderboard("",[])
    this.setRaceEndReasonText("")
    this.updateRacePosition(1,1)
    this.updateRaceCount(1,1)
  }
  formatTime(timeSeconds: number,fractionDigits:number=1): string {
    return utilities.formatTime(timeSeconds,fractionDigits)
  }
  showExitCarButton(_visible:boolean){
    log("exitCarBtn is commented out !!!!")
    log("exitCarBtn is commented out !!!!")
    log("exitCarBtn is commented out !!!!")
    //exitCarBtn.visible = _visible
  }

  updateLeaderboard(title:string,playerNames: string[]) {
    leaderboard.updateLeaderboard(title,playerNames)
  }

  isLeaderboardVisible(){
    return leaderboard.isLeaderboardVisible()
  }
  showLeaderboard(visible:boolean){
    leaderboard.showLeaderboard(visible)
  }


  isRaceStartMsgVisible(){
    return raceHud.isRaceStartMsgVisible()
  }
  showRaceStartMsg(visible:boolean){
    raceHud.showRaceStartMsg(visible)
  }
  updateRaceStartWaiting(counter:number){
    raceHud.updateRaceStartWaiting(counter)
  }
  updateRaceStarting(counter:number){
    raceHud.updateRaceStarting(counter)
  }
  setRaceStartCountdown(val:number){
    raceHud.setRaceStartCountdown(val)
  }


  isRaceEndedVisible(){
    return racePrompts.isRaceEndedVisible()
  }
  showRaceEnded(visible:boolean){
    racePrompts.showRaceEnded(visible)
  }
  setRaceEndReasonText(text:string){
    racePrompts.setRaceEndReasonText(text)
  }


  isGoVisible(){
    return raceHud.isGoVisible()
  }
  showGo(visible:boolean,duration?:number){
    raceHud.showGo(visible,duration)
  }

  openEndGameConfirmPrompt(){
    racePrompts.openQuitGameConfirmPrompt()
  }
  hideEndGameConfirmPrompt(){
    racePrompts.hideQuitGameConfirmPrompt()
  }

  openHowToPlayPrompt(){
    racePrompts.openHowToPlayPrompt()
  }
  hideHowToPlayPrompt(){
    racePrompts.hideHowToPlayPrompt()
  }

  isWrongWayVisible(){
  return raceHud.isWrongWayVisible()
  }
  showWrongWay(visible:boolean){
    raceHud.showWrongWay(visible)
  }

  setBoostBar(amount:number){
    raceHud.setBoostBar(amount)
  }
  setProjectileBar(amount:number){
    raceHud.setProjectileBar(amount)
  }
  showProjectileBar(val:boolean){
    raceHud.showProjectileBar(val)
  }
  showBoostBar(val:boolean){
    raceHud.showBoostBar(val)
  }
  showLapTime(val:boolean,maxLaps?:number){
    raceHud.showLapTime(val,maxLaps)
  }
  
  updateCarSpeed(text:string){
    raceHud.updateCarSpeed(text)
  }
  updateLapTime(text:string,lapNumber?:number,maxLaps?:number){
    raceHud.updateLapTime(text,lapNumber,maxLaps)
  }
  updateTotalTime(text:string,lapNumber?:number,maxLaps?:number){
    raceHud.updateTotalTime(text,lapNumber,maxLaps)
  }
  
  
  showLapCounter(val:boolean){
    raceHud.showLapCounter(val)
  }
  setLapCounter(text:string){
    raceHud.setLapCounter(text)
  }
  updateRacePosition(pos:number,total:number){
    raceHud.updateRacePosition(pos,total)
  }

  updateRaceCount(cnt:number,max:number){
    //TODO OPTIMIZE ME
    //TODO manage if changed then update. otherwise do nothing
    raceHud.updateRaceCount(cnt,max)
  }
  
  updateLapCounter(lap:number,maxLaps:number){
    if(lap > maxLaps){
      this.setLapCounter("FINISH")
    }
    else{
      this.setLapCounter(lap + "/" + maxLaps)
    }
  }
  /*
  openRaceIsOver() {
    //throw new Error("Method not implemented.");
    log("openRaceIsOver() IMPLEMENT ME")
  }
  updateRaceResults(state: clientSpec.RaceRoomState) {
    log("updateRaceResults() IMPLEMENT ME")
  }*/

  updateGameResultRows(state: clientSpec.RaceRoomState) {
    racePrompts.updateGameResultRows(state)
  }
  isRaceResultsPromptVisible(){
    return racePrompts.isRaceResultsPromptVisible()
  }
  toggleGameResultsPrompt(visible:boolean){
    racePrompts.toggleGameResultsPrompt(visible)
  }

  raceToStartHidePrompts(): void {
    racePrompts.hideHowToPlayPrompt()
  }
  raceExitHidePrompts(): void {
    //hide race related prompts if still open
    this.hideEndGameConfirmPrompt()
    this.hideHowToPlayPrompt()
  }

  showLoginErrorPrompt(title:string|undefined,desc:string|undefined){
    racePrompts.loginErrorPrompt.text.value = desc ? desc : "Unexpected Error"
    racePrompts.loginErrorPrompt.show()
    //must manaully make visible after show call? why?
    racePrompts.loginErrorPrompt.title.visible = true
  }
  showErrorPrompt(title:string|undefined,desc:string|undefined){
    racePrompts.errorPrompt.text.value = desc ? desc : "Unexpected Error"
    racePrompts.errorPrompt.show()
    //must manaully make visible after show call? why?
    //racePrompts.errorPrompt.title.visible = true
  }
  
}

export const Game_2DUI = new Game2DUI()
Constants.Game_2DUI = Game_2DUI