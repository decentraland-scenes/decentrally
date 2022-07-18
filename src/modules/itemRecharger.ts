import * as utils from '@dcl/ecs-scene-utils'
import { CONFIG } from "src/config";
import { getOrCreateGLTFShape, getOrCreateMaterial } from 'src/resources/common';
import { Level, levelManager } from "../tracks/levelManager";
import * as serverSpec from './connection/state/server-state-spec';
import { IntervalUtil } from './interval-util';
import { Constants } from './resources/globals';
import {  SOUND_POOL_MGR } from './resources/sounds';
import { player, scene } from "./scene";
import { SceneEntity, VisibleChangeType } from './scene/subScene';
import { AbstractMoveWithWorldSpawner, AbstractSpawner } from "./spawner";
import { GAME_STATE } from "./state";
import { themeControl, ThemeTrackFeature } from "./themeData";
import { createTrackFeatureComponentFrom, FeatureTriggerComponent, TrackFeature, TrackFeatureComponent, TrackFeatureShape } from './trackFeatures';
import { distance, realDistance, ToDegrees } from "./utilities";


//TODO centrlize this logic!!!
export const fullBoostTimer = CONFIG.BOOSTERS_MAX_RELOAD_AMOUNT*CONFIG.BOOSTERS_RELOAD_TIME
export const fullProjectileTimer = CONFIG.PROJECTILE_MAX_RELOAD_AMOUNT*CONFIG.PROJECTILE_RELOAD_TIME

const boostReloadTime = new IntervalUtil(CONFIG.ITEM_RECHARGE_CHECK_FREQ_MILLIS)

export class ItemRechargeSystem {

    
    constructor(){
      
    }

    
    reset(){
      
    }

    update(dt: number){  

      const updateUI = (boostReloadTime.update(dt))

      //log("ItemRechargeSystem",player.boostReloadTimer,fullBoostTimer)
      //check to see if reload needed
      if(player.boostReloadTimer < fullBoostTimer){
        //see what percent we have
        player.boostReloadTimer = Math.min( player.boostReloadTimer + dt, fullBoostTimer )
        const amt = player.boostReloadTimer/fullBoostTimer
        //log("ItemRechargeSystem",player.boostReloadTimer,fullBoostTimer,cnt)
        if(updateUI) Constants.Game_2DUI.setBoostBar(amt)
      }
      


      if(player.projectileTimer < fullProjectileTimer){
        //see what percent we have
        player.projectileTimer = Math.min( player.projectileTimer + dt, fullProjectileTimer )

        const amt = player.projectileTimer/fullProjectileTimer
        if(updateUI) Constants.Game_2DUI.setProjectileBar(amt)
      }
      
    }

    
  
  
}