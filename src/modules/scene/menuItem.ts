import { AnimatedItem } from "./simpleAnimator"
import * as resource from "../resources/resources"
import * as sfx from "../resources/sounds"


export class MenuItem extends Entity {
    selected:boolean = false
    lastSelectTime:number=0
    defaultItemScale:Vector3
    highlightItemScale:Vector3
    reSelectCoolDown:number

    constructor(){
        super()       
        this.defaultItemScale = new Vector3(1,1,1)
        this.highlightItemScale = new Vector3(1,1,1)
    }
    updateItemInfo(_info:any, _secondaryInfo?:any){
    }
           
    select(){          
    }
    deselect(_silent?:boolean){
        // this.selected = false                 
    }
    show(){
    }
    hide(){
    }

    reSelectCooldownPassed(){
      const retVal = this.reSelectCoolDown !== undefined && this.reSelectCoolDown < Math.abs(Date.now()-this.lastSelectTime )
      log("select.reSelectCooldownPassed",retVal,this.reSelectCoolDown,this.lastSelectTime,(Date.now()-this.lastSelectTime ))
      return retVal
    }
}






//const clickableGroup = engine.getComponentGroup(ClickableItem, Transform)

export type LevelMenuItemOptions={
  reSelectCoolDown?:number
}

export class LevelMenuItem extends MenuItem {
  public scale: Vector3;
  public scaleMultiplier: number;


  itemRoot: Entity;
  cardOffset: Vector3;
  title: Entity;
  titleText: TextShape;
  highlightFrame: Entity;
  updateWearablesMenu: () => void
  _transform:TranformConstructorArgs
  options:LevelMenuItemOptions
  type:string

  constructor(
    _transform: TranformConstructorArgs,
    _alphaTexture: Texture,   
    _title:string, 
    _type:string,
    _updateWearablesMenu: () => void,
    _options?:LevelMenuItemOptions
    
  ) {
    super();

    this.setOptions(_options)

    this.type = _type
    this._transform = _transform

    this.updateWearablesMenu = _updateWearablesMenu  
    

    this.addComponent(new Transform(  _transform ));
    this.scale = new Vector3(1, 1, 1);
    this.scaleMultiplier = 1.2;
    this.defaultItemScale = new Vector3(1, 1, 1);
    this.highlightItemScale = new Vector3(1, 1, 1);
    this.cardOffset = new Vector3(0, 0, 0);

    //selection event animation
    this.addComponent(
      new AnimatedItem(
        {
          position: new Vector3(0, 0, 0),
          scale: new Vector3(this.defaultItemScale.x, this.defaultItemScale.y, this.defaultItemScale.z),
          rotation: Quaternion.Euler(0, 0, 0),
        },
        {
          position: new Vector3(0, 0.0, -0.05),
          scale: new Vector3(this.highlightItemScale.x, this.highlightItemScale.y, this.highlightItemScale.z),
          rotation: Quaternion.Euler(0, 0, 0),
        },
        2
      )
    );

    // event card root
    this.itemRoot = new Entity();
    this.itemRoot.addComponent(
      new Transform({
        position: new Vector3(this.cardOffset.x, this.cardOffset.y, this.cardOffset.z),
        scale: new Vector3(1, 1, 1),
      })
    );
    this.itemRoot.addComponent(resource.smallCardShape);
    this.itemRoot.setParent(this);

    // TITLE
    this.titleText = new TextShape();
    this.title = new Entity();
    let rawText: string = _title;

    this.titleText.font = new Font(Fonts.SansSerif_Heavy);
    this.titleText.height = 20;
    this.titleText.width = 2;
    this.titleText.fontSize = 4;
    this.titleText.color = Color3.Black();
    this.titleText.hTextAlign = "center";
    this.titleText.vTextAlign = "center";

    this.title.addComponent(
      new Transform({
        position: new Vector3(0, 0, -0.02),
        scale: new Vector3(0.3, 0.3, 0.3),
      })
    );
    this.title.addComponent(this.titleText);
    this.titleText.value = rawText;

    this.title.setParent(this.itemRoot);

    //highlight on click
    this.highlightFrame = new Entity();
    this.highlightFrame.addComponent(new Transform());
    this.highlightFrame.addComponent(resource.smallCardHighlightShape);
    this.highlightFrame.addComponent(
      new AnimatedItem(
        {
          position: new Vector3(0, 0, 0),
          scale: new Vector3(0, 0, 0),
          rotation: Quaternion.Euler(0, 0, 0),
        },
        {
          position: new Vector3(0, 0, 0),
          scale: new Vector3(1, 1, 1),
          rotation: Quaternion.Euler(0, 0, 0),
        },
        3
      )
    );
    this.highlightFrame.setParent(this);
  }
  setOptions(options:LevelMenuItemOptions){
    this.options = options
    if(this.options !== undefined){
      this.reSelectCoolDown = this.options.reSelectCoolDown
    }
  }
  updateItemInfo(_collection: any, _item: any) {
    
  }
  getTitle(){
    return this.titleText.value
  }
  select() {
    log("select",this.selected)
    if (!this.selected || this.reSelectCooldownPassed()) {
      this.selected = true;
      this.lastSelectTime = Date.now()
      this.updateWearablesMenu();

      this.highlightFrame.getComponent(AnimatedItem).isHighlighted = true;
      this.titleText.color = Color3.White();
      this.titleText.font = new Font(Fonts.SansSerif_Heavy);
    }
  }
  deselect(_silent?: boolean) {
    if (this.selected) {
      this.selected = false;
    }

    this.highlightFrame.getComponent(AnimatedItem).isHighlighted = false;
    this.titleText.color = Color3.Black();
    this.titleText.font = new Font(Fonts.SansSerif_Heavy);
  }
  show() {}
  hide() {}
}


