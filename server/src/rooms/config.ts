
const EPOCH_HOURS = 24 ;// 10/60 //1 minute

export class Config{
  DATE_FORMAT_PATTERN = 'YYYY-MM-DDTHH:mm:ss [GMT]Z'

 
  RECONNECT_WAIT_TIME = 1
  RECONNECT_WAIT_ENABLED = true

  //this is temporary hardcodes
  RACE_MAX_LAPS_DEFAULT = parseInt(process.env.RACE_MAX_LAPS_DEFAULT)

  MAX_WAIT_TO_START_TIME_MILLIS=parseInt(process.env.MAX_WAIT_TO_START_TIME_MILLIS)
  STARTING_COUNTDOWN_TIME_MILLIS = 3000 
  MAX_GAME_TIME_MILLIS = 60 * 1000 * 6 //6 min max?
  MAX_POSSIBLE_RACE_TIME = 9999 * 1000 //9999 seconds

  PLAYFAB_ENABLED = process.env.PLAYFAB_ENABLED === undefined || (process.env.PLAYFAB_ENABLED !== undefined && process.env.PLAYFAB_ENABLED === 'true')
  PLAYFAB_TITLEID = process.env.PLAYFAB_TITLEID
  PLAYFAB_DEVELOPER_SECRET = process.env.PLAYFAB_DEVELOPER_SECRET

  //default is true
  ON_JOIN_REQUIRE_PLAYFAB_DATA_OPTIONS = process.env.ON_JOIN_REQUIRE_PLAYFAB_DATA_OPTIONS === undefined || (process.env.ON_JOIN_REQUIRE_PLAYFAB_DATA_OPTIONS !== undefined && process.env.ON_JOIN_REQUIRE_PLAYFAB_DATA_OPTIONS === 'true')
}

export const CONFIG = new Config()

//console.log("CONFIG",CONFIG)