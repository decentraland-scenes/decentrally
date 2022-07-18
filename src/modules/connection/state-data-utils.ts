import { GAME_STATE } from '../state'
import * as clientState from './state/client-state-spec'

export type PlayerRankingsType={
  racePosition:number
  //totalProgre:number
  name:string
  id:string
  isPlayer:boolean
  endTime:number
}
export function inRaceFormatPlayerName(val:clientState.PlayerState):string{
  let name = val.userData.name
  if(addYOUToName(val)){
      name += "(you)"
  }
  if(val.connStatus !== 'connected'){
      name += "("+val.connStatus+")"
  }
  return name
}

function addYOUToName(val:clientState.PlayerState){
  return val.sessionId == GAME_STATE.gameRoom.sessionId && val.userData.name.indexOf("#") > 0
}

export function afterRaceFormatPlayerName(val:clientState.PlayerState):string{
  let name = val.userData.name
  if(addYOUToName(val)){
      name += "(you)"
  }
  
  if(!val.racingData.endTime){
    if(val.connStatus !== 'connected'){
        name += "("+val.connStatus+")"
    }
  }
  return name
}

export function sortPlayersByPosition(players:clientState.PlayerMapState,nameFormatter?:(val:clientState.PlayerState)=>string){
  const playerData:PlayerRankingsType[] = []
   
  if(!players){
    return playerData;
  }

  players.forEach(
      (val:clientState.PlayerState)=>{
        const isPlayer = false
          let name = nameFormatter ? nameFormatter(val) : inRaceFormatPlayerName(val)
          
          //const closestSegId = (val.racingData.closestSegmentID !== undefined) ? val.racingData.closestSegmentID: 0
          //const percentOfSeg = (val.racingData.closestSegmentPercent !== undefined) ? val.racingData.closestSegmentPercent: 0
          //const lap = (val.racingData.lap !== undefined) ? val.racingData.lap: 0
          const racePosition = (val.racingData.racePosition !== undefined) ? val.racingData.racePosition: 99
          //playerData.push( {id:val.sessionId,name:name,totalProgress: (lap + 1) * closestSegId + percentOfSeg })
          playerData.push( {id:val.sessionId,name:name,racePosition: racePosition,isPlayer:isPlayer,endTime:val.racingData.endTime })
      }
  )

  const playerDataRanked = playerData.sort((n1,n2) => {
    if(n1.racePosition === undefined) return 1
    if(n2.racePosition === undefined) return -1
    return n1.racePosition < n2.racePosition ? -1 : 1
  });

  return playerDataRanked
}