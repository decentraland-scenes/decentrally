import * as ui from '@dcl/ui-scene-utils';
import { CONFIG } from 'src/config';
import { GAME_STATE } from 'src/modules/state';

/*
const entity = new Entity()
entity.addComponent(new Transform({position:new Vector3(1,1,1)}))

if(!entity.hasComponent(Animator)) entity.addComponentOrReplace(new Animator())
entity.getComponent(Animator).addClip(new AnimationState("Run", { looping: true })))
entity.getComponent(Animator).addClip(new AnimationState("Idle", { looping: true }))

entity.getComponent(Animator).getClip("Run").play()

engine.addEntity(entity)
*/
/*
export const loginGamePrompt = new ui.CustomPrompt(ui.PromptStyles.DARKLARGE,400,400)

//loginGamePrompt.hide()


loginGamePrompt.addIcon("images/play-carousel-1.png",0,0,80,80)
loginGamePrompt.addIcon("images/play-carousel-2.png",0,0,80,80)

loginGamePrompt.addText("Play",0,180,Color4.White(),20)

*/


const SHIFTY = -30
const SHIFTY_TEXT = -10


export const PROMPT_PICKER_WIDTH = 530
export const PROMPT_PICKER_HEIGHT = 500 //550 
export const PROMPT_OFFSET_X = 0;//80//move it away from communications box as cant click thru it
export const PROMPT_OFFSET_Y = 40
export const MAIN_CONTENT_START_Y = 180
export const PROMPT_TITLE_HEIGHT = 230 + SHIFTY //250 + SHIFTY
export const PROMPT_TITLE_COLOR = Color4.White()
export const BUTTON_HEIGHT = 60

export const PROMPT_OVERLAY_TEXT_COLOR = Color4.White()

export const PROMPT_PICKER_OVERLAY_WIDTH = PROMPT_PICKER_WIDTH
export const PROMPT_PICKER_OVERLAY_HEIGHT = 320
export const PROMPT_OVERLAY_OFFSET_X = 0
export const PROMPT_OVERLAY_OFFSET_Y = 60

export const BUTTON_POS_Y =  -120 //-180


const BANNER_SOURCE_WIDTH = 1093//1038
const BANNER_SOURCE_HEIGHT = 128
const BANNER_IMAGE_SCALE = .3

 


const startX=-370;
const startY=MAIN_CONTENT_START_Y;
const rowHeight = 30
const rowPaddY = 10
const colWidth = 200 
const buttonHeight = BUTTON_HEIGHT
   
let yCounter = startX


let buttonPosY = BUTTON_POS_Y

//export const agePrompt = new ui.CustomPrompt(CUSTOM_TEXTURE,400,300)
export const loginGamePrompt = new ui.CustomPrompt(ui.PromptStyles.DARK,PROMPT_PICKER_WIDTH,PROMPT_PICKER_HEIGHT)
//if( CONFIG.UI_REPLACE_TEXTURE_WITH_SINGLETON ) loginGamePrompt.background.source = RESOURCES.textures.darkThemeSemiTransparent//workaround to try to save textures
//setSection(loginGamePrompt.background, resources.backgrounds.promptBackground)
//setSection(loginGamePrompt.closeIcon, resources.icons.closeD)

loginGamePrompt.hide()

loginGamePrompt.background.positionX = PROMPT_OFFSET_X
loginGamePrompt.background.positionY = PROMPT_OFFSET_Y


//why is it behind the background????
//loginGamePrompt.closeIcon.visible=true
//loginGamePrompt.closeIcon.positionX = PROMPT_OFFSET_X
//bug where draws behind and too low. have to move it out
loginGamePrompt.closeIcon.positionY = 310//310
loginGamePrompt.closeIcon.positionX = 280//280

//closeIcon: UIImage = new UIImage(this.background, this.texture)
/*
loginGamePrompt.closeIcon = new UIImage(loginGamePrompt.background, loginGamePrompt.texture)
setSection(loginGamePrompt.closeIcon, resources.icons.closeW) 
loginGamePrompt.closeIcon.visible=true
loginGamePrompt.closeIcon.positionY = 300//310
loginGamePrompt.closeIcon.positionX = 270//280*/


//need to override its close logic
loginGamePrompt.closeIcon.onClick = new OnClick(() => {
  hideloginGamePrompt()
})

const PLAYER_IMGSHOT_Y= 30 //40

const image_scale = 0 //16 is a little bigger bit fits tight

let gameImageSubTitle = loginGamePrompt.addText("text here", 0, PLAYER_IMGSHOT_Y,Color4.White(),18)//BUTTON_POS_Y + BUTTON_HEIGHT*1.6)
//let gameImageSubTitleAddress = loginGamePrompt.addText("No Player Selected", 0, BUTTON_POS_Y + BUTTON_HEIGHT*1.2)
gameImageSubTitle.text.width=256+image_scale - 30
gameImageSubTitle.text.height=256+image_scale - 50
gameImageSubTitle.text.textWrapping=true
gameImageSubTitle.text.vAlign = 'center' 
gameImageSubTitle.text.hAlign = 'center' 
//pushes to top and to left
//gameImageSubTitle.text.hTextAlign = 'left'
//gameImageSubTitle.text.vTextAlign = 'top'
//centers it completely
gameImageSubTitle.text.hTextAlign = 'center'
gameImageSubTitle.text.vTextAlign = 'center'


let btnLogin = loginGamePrompt.addButton(
  'Login',
  100,
  buttonPosY - buttonHeight,
  () => { 
    log('login')
    GAME_STATE.playerState.requestDoLoginFlow()
    hideloginGamePrompt()
  },
  ui.ButtonStyles.ROUNDGOLD
)

let btnGetMetaMask = loginGamePrompt.addButton(
  'Get MetaMask',
  100,
  buttonPosY - buttonHeight,
  () => { 
    log('get')
    openExternalURL("https://metamask.io/download/")
    hideloginGamePrompt()
  },
  ui.ButtonStyles.ROUNDGOLD
)

let btnCancel = loginGamePrompt.addButton(
  'Cancel',
  -100,
  buttonPosY - buttonHeight,
  () => {
    log('No')
    //loginGamePrompt.hide()
    hideloginGamePrompt()
    ///showPickerPrompt()
  },
  //ui.ButtonStyles.F
)
/*
const input = Input.instance
input.subscribe("BUTTON_DOWN", ActionButton.SECONDARY, false, (e) => {
  log("pointer Down", e)
  nextGameImage(1)
})
input.subscribe("BUTTON_DOWN", ActionButton.PRIMARY, false, (e) => {
  log("pointer Down", e)
  nextGameImage(-1)
})*/




export function openloginGamePrompt(){
    loginGamePrompt.show()

    if(GAME_STATE.playerState.dclUserData?.hasConnectedWeb3){
      btnGetMetaMask.hide()
      btnLogin.show()
    }else{
      btnGetMetaMask.show()
      btnLogin.hide()
    }

    //FIXME making these invisible also stops them listening!?!?
   // btnNext.image.visible=false 
    //btnNext.label.visible = false
      
   // btnPev.image.visible=false
   // btnPev.label.visible = false
    //btnNext.hide()
    //btnPev.hide()
  }
  
  export function hideloginGamePrompt(){
    loginGamePrompt.hide()
  }
 

  GAME_STATE.playerState.addChangeListener(
    (key: string, newVal: any, oldVal: any)=>{
      log("listener.playerState.ui-leaderboard.ts " + key + " " + newVal + " " + oldVal)
  
      switch(key){
        //common ones on top
        case "dclUserData":
          if(GAME_STATE.playerState.dclUserData?.hasConnectedWeb3){

          }else{
            gameImageSubTitle.text.value = "Game requires MetaMask browser extension to play"

            btnLogin.label.value = "Get MetaMask"
            btnLogin.image.onClick = new OnClick(() => { 
              log('login')
              GAME_STATE.playerState.requestDoLoginFlow()
              hideloginGamePrompt()
            })
           
          }
          break;
      }
  })