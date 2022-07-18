import { LoginFlowCallback, LoginFlowResult } from 'src/login/login-types';
import { IRaceSceneManager } from '../scene/raceSceneManagerInterface'
import { IGame2DUI } from '../ui/iGame2DUI';

export interface NoArgCallBack {
	() : void;
}

//backflips to avoid cyclic dependencies
//if i register things to this, namly
//interfaces in their own file, we can avoid cycles
export interface IConstants{
	SCENE_MGR?:IRaceSceneManager
	doLoginFlow?:(callback?:LoginFlowCallback,resultInPlace?:LoginFlowResult) => Promise<LoginFlowResult>
	Game_2DUI?:IGame2DUI
	showedHowToPlayAlready:boolean
}

export const Constants:IConstants = {
	//SCENE_MGR:IRaceSceneManager
	showedHowToPlayAlready: false
}