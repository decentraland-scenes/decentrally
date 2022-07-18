import * as utils from '@dcl/ecs-scene-utils'
import { Level } from 'src/tracks/levelManager'
import { AbstractSpawner } from "../spawner"

const menuUpClip = new AudioClip('sounds/menu_woosh_up.mp3')
export const menuUpSource = new AudioSource(menuUpClip)
menuUpSource.volume = 1

const menuDownClip = new AudioClip('sounds/menu_woosh.mp3')
export const menuDownSource = new AudioSource(menuDownClip)
menuDownSource.volume = 1

const menuScrollEndClip = new AudioClip('sounds/menu_scroll_end.mp3')
export const menuScrollEndSource = new AudioSource(menuScrollEndClip)
menuScrollEndSource.volume = 1

const menuSelectClip = new AudioClip('sounds/menu_select.mp3')
export const menuSelectSource = new AudioSource(menuSelectClip)
menuSelectSource.volume = 1

const menuDeselectClip = new AudioClip('sounds/menu_deselect.mp3')
export const menuDeselectSource = new AudioSource(menuDeselectClip)
menuDeselectSource.volume = 1

const refreshSuccessClip = new AudioClip('sounds/refresh.mp3')
export const refreshSource = new AudioSource(refreshSuccessClip)
refreshSource.volume = 1

const menuErrorClip = new AudioClip('sounds/menu_error.mp3')
export const menuErrorSource = new AudioSource(menuErrorClip)
menuErrorSource.volume = 0.8

const themeDesertClip = new AudioClip('sounds/themeSongDesert.mp3')
export const themeDesertSource = new AudioSource(themeDesertClip)
themeDesertSource.volume = 0.1

const themeCityClip = new AudioClip('sounds/themeSongCity.mp3')
export const themeCityClipSource = new AudioSource(themeCityClip)
themeCityClipSource.volume = 0.1

const themeLobbyClip = new AudioClip('sounds/themeSongLobby.mp3')
export const themeLobbyClipSource = new AudioSource(themeLobbyClip)
themeLobbyClipSource.volume = 0.3

/*
const raceCountdownClip = new AudioClip('sounds/raceCountdown.mp3')
export const raceCountdownSource = new AudioSource(raceCountdownClip)
raceCountdownSource.volume = 0.3*/

/*
const boostClip = new AudioClip('sounds/boostClip2.mp3')
export const boostClipSource = new AudioSource(boostClip)
boostClipSource.volume = 0.8

const trapClip = new AudioClip('sounds/trapClip.mp3')
export const trapClipSource = new AudioSource(trapClip)
trapClipSource.volume = 0.8

const skidClip = new AudioClip('sounds/skidClip.mp3')
export const skidClipSource = new AudioSource(skidClip)
skidClipSource.volume = 0.8
*/ 
export const allMenuAudioSources:AudioSource[] = [
    menuUpSource,menuDownSource, menuScrollEndSource, menuSelectSource,menuDeselectSource,refreshSource,menuErrorSource,themeLobbyClipSource
]
//const AUDIO_SOURCE_ENTITIES:Record<string,Entity>={}

export const raceSoundAudioSources:AudioSource[] = [
    themeCityClipSource,themeDesertSource
]
export const raceThemeSoundAudioSources:AudioSource[] = [
    themeCityClipSource,themeDesertSource,themeLobbyClipSource
]


function createEntitySound(name:string,audioClip:AudioClip|AudioSource,volume?:number){
    const entSound = new Entity(name)
    entSound.addComponent(new Transform())
    if(audioClip instanceof AudioClip ){
        entSound.addComponent(new AudioSource(audioClip))
    }else{
        entSound.addComponent(audioClip)
    }
    entSound.getComponent(AudioSource).volume = volume !== undefined ? volume : 0.5
    entSound.getComponent(AudioSource).loop = false
    engine.addEntity(entSound)
    entSound.setParent(Attachable.AVATAR)

    return entSound
}

//adding entities to engine so can play the audio, must be registered to engine thru entity
const themeDesertSoundEntity = createEntitySound("themeDesertSoundEntity",themeDesertSource)
const themeCitySoundEntity = createEntitySound("themeCitySoundEntity",themeCityClipSource)
const themeLobbySoundEntity = createEntitySound("themeLobbySoundEntity",themeLobbyClipSource)

type SoundAbstractSpawnerArgs={
    audioClipUrl:string
    clipLen:number
    replayCooldown?:number
    volume?:number
}

class SoundAbstractSpawner extends AbstractSpawner{
    audioClipUrl:string
    audioClip:AudioClip
    /**
     * entire len of clip
     */
    clipLen:number
    /**
     * cooldown till can be reused again (allows sounds to be played ontop of eachother)
     */
    replayCooldown:number

    volume:number


    constructor(name:string,maxPoolSize:number,options:SoundAbstractSpawnerArgs){
        super(name,maxPoolSize)
        this.audioClipUrl = options.audioClipUrl
        this.clipLen = options.clipLen
        this.replayCooldown = options.replayCooldown
        this.volume = options.volume
    }

    playOnce(){
        const ent = this.getEntityFromPool()
        if(ent){
            log("playOnce",this.name," from pool",ent.name)
            ent.getComponent(AudioSource).playOnce()
            this.removeEntityIn(ent,Math.min(this.clipLen,this.replayCooldown))
        }else{
            log("playOnce",this.name," failed no more in pool",ent)
        }
    }
    
    removeEntityIn(entity:Entity,timeMS:number){
        entity.addComponentOrReplace(new utils.Delay(timeMS,()=>{
            this.removeEntity(entity)
        }))
        
    }   
}
 
export class SoundPool extends SoundAbstractSpawner {
    
    //overloading create entity
    createNewPoolEntity(cnt?:number){
        const entSound =createEntitySound(this.name+".pool-ent."+cnt,new AudioClip(this.audioClipUrl),this.volume)

        return entSound
    }

    
}

export class SoundPoolMgr {
    boost:SoundPool = new SoundPool( "car.boost",3,{audioClipUrl:'sounds/boostClip2.mp3',clipLen:1500,replayCooldown:200,volume:.7} );
    trap:SoundPool = new SoundPool( "car.trap",3,{audioClipUrl:'sounds/trapClip.mp3',clipLen:1500,replayCooldown:200,volume:.8} );
    skid:SoundPool = new SoundPool( "car.skid",2,{audioClipUrl:'sounds/skid.mp3',clipLen:1500,replayCooldown:1000,volume:.4} );
    skidChirp:SoundPool = new SoundPool( "car.skid.chirp",2,{audioClipUrl:'sounds/skid-tire-chirp.mp3',clipLen:900,replayCooldown:900,volume:.05} );

    skidChirp1:SoundPool = new SoundPool( "car.skid.chirp.1",1,{audioClipUrl:'sounds/Skid_01.mp3',clipLen:3000,replayCooldown:900,volume:.55} );
    skidChirp2:SoundPool = new SoundPool( "car.skid.chirp.2",1,{audioClipUrl:'sounds/Skid_02.mp3',clipLen:3000,replayCooldown:900,volume:.55} );
    skidChirp3:SoundPool = new SoundPool( "car.skid.chirp.3",1,{audioClipUrl:'sounds/Skid_03.mp3',clipLen:3000,replayCooldown:900,volume:.55} );
    skidChirp4:SoundPool = new SoundPool( "car.skid.chirp.4",1,{audioClipUrl:'sounds/Skid_04.mp3',clipLen:3000,replayCooldown:900,volume:.55} );

    raceCountdown:SoundPool = new SoundPool( "race.countdown",1,{audioClipUrl:'sounds/raceCountdown.mp3',clipLen:6000,replayCooldown:6000,volume:.8} );
    raceCountDownBeep:SoundPool = new SoundPool( "race.countdown.ping",1,{audioClipUrl:'sounds/raceCountdownBeep.mp3',clipLen:1000,replayCooldown:300,volume:.8} );
    //raceCountDownGo:SoundPool = new SoundPool( "race.countdown.ping.go",1,{audioClipUrl:'sounds/raceCountdownBeep.mp3',clipLen:1000,replayCooldown:800,volume:.8} );
    raceStart:SoundPool = new SoundPool( "race.go",1,{audioClipUrl:'sounds/raceGoStart.mp3',clipLen:2000,replayCooldown:1000,volume:1} );
}

export const SOUND_POOL_MGR = new SoundPoolMgr()

//WORKAROUND, must explicity set playing false
//if playOnce is called, on add to scene (again, it plays again)
export function stopAllSources(id:string,src:AudioSource[]){
    log("audio.stopAllSources",id)
    for(const p in src){
        if(src[p].playing){
            log("audio.stopAllSources stopping",src[p].audioClip.url)
            src[p].playing=false
        }else{

        }
    }
}
export function playLevelTheme(level:Level|string,volume?:number){
    stopAllSources("playLevelTheme.raceThemeSoundAudioSources",raceThemeSoundAudioSources)

    let id = "unknown"
    if(level instanceof Level){
        id = level.id
    }else{
        id = level
    }
    let source
    let defaultVolume = .07
    //goal is to normalize volumes since each track may not have same sound level
    let tweakVolume = 0
    switch(id){
        case "city_track_demo_1":
            tweakVolume = -.01 //little too loud, bring it down
            source = themeCityClipSource
            break;
        case "desert_track_demo_1":
            tweakVolume = .02 //little to soft, bring it up
            source = themeDesertSource
            break;
        case "lobby":
        default:
            source = themeLobbyClipSource
            break;
    }
    if(source){
        source.loop=true
        source.playing = true
        const volToUse = ((volume!==undefined) ? volume : defaultVolume) + tweakVolume
        source.volume = volToUse
        log("audio.playLevelTheme",id,volToUse)
    }else{
        log("audio.playLevelTheme","DID NOT FIND",id)
    }
}