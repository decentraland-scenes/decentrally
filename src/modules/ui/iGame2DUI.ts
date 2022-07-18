import * as clientSpec from "../connection/state/client-state-spec";

//workaround to fix cyclical deps
export interface IGame2DUI {
  
 
  hideAll():void
  reset():void
  formatTime(timeSeconds: number,fractionDigits?:number): string
  
  updateLeaderboard(title:string,playerNames: string[]):void

  isLeaderboardVisible():boolean
  showLeaderboard(visible:boolean):void

  /*
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
    racePrompts.hideQuitGameConfirmPrompt
  }*/

  openHowToPlayPrompt():void
  hideHowToPlayPrompt():void
  /*
  isWrongWayVisible(){
  return raceHud.isWrongWayVisible()
  }
  showWrongWay(visible:boolean){
    raceHud.showWrongWay(visible)
  }
*/
  setBoostBar(amount:number):void
  setProjectileBar(amount:number):void
  /*
  showProjectileBar(val:boolean){
    raceHud.showProjectileBar(val)
  } 
  showBoostBar(val:boolean){
    raceHud.showBoostBar(val)
  }
  showLapTime(val:boolean,maxLaps?:number){
    raceHud.showLapTime(val,maxLaps)
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
  */
  /**
   * hide anything not required for race
   */
  raceToStartHidePrompts():void
  
  updateGameResultRows(state: clientSpec.RaceRoomState):void
  isRaceResultsPromptVisible():void
  toggleGameResultsPrompt(visible:boolean):void
  showLoginErrorPrompt(title:string|undefined,desc:string|undefined):void
  showErrorPrompt(title:string|undefined,desc:string|undefined):void
  
}
