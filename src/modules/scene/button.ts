

export interface NoArgCallBack {
	() : void;
}

export interface NumberCallback {
	(i:number) : number;
}

export class MenuButton {
    text: string = 'X' 
    pos: Vector3   
    color: Color3 = Color3.Blue()   
    highlightColor: Color3 = Color3.Green()   
    fontSize:number = 2
    material: Material 
    Button: Entity
    ButtonMesh: Entity
    id:number
    
    constructor(initialText:string, pos:Vector3, mat:Material, clickCallBack: NumberCallback, id:number, _clickDistance?:number ){

        this.material = mat
        this.id = id
        /* this.material.albedoColor = color
        this.material.emissiveIntensity = 0
        this.material.emissiveColor = color
        this.material.transparencyMode = 0 */

        let ButtonTextAnchor = new Entity()  

        let ButtonText = new TextShape(initialText)
        ButtonText.fontSize = this.fontSize
        ButtonText.shadowColor = Color3.Black()
        ButtonText.shadowOffsetX = 4
        ButtonText.shadowOffsetY = -4
        ButtonText.shadowBlur = 0.1
        

        this.Button = new Entity()

        this.ButtonMesh = new Entity()

        ButtonTextAnchor.addComponent(ButtonText)
        ButtonTextAnchor.addComponent(new Transform({position: new Vector3(0,0,-0.15)}))

        this.ButtonMesh.addComponent(new BoxShape())
        this.ButtonMesh.addComponent(this.material)
        this.ButtonMesh.addComponent(new Transform({ 
            position: new Vector3(0, 0, 0),
            scale: new Vector3(1.5, 0.8, 0.2)
        }))

        this.ButtonMesh.addComponent(new OnPointerDown( (): void => {
            clickCallBack(this.id)
        },{button: ActionButton.POINTER, hoverText: "SELECT", distance: _clickDistance}))

        this.Button.addComponent(new Transform({ 
            position: new Vector3(pos.x, pos.y, pos.z), 
            rotation: Quaternion.Euler(0,0,0)   
        }))

        ButtonTextAnchor.setParent(this.Button)
        this.ButtonMesh.setParent(this.Button)
        //Button.setParent(startMenu)
    }

    setButtonParent(parent:Entity){
        this.Button.setParent(parent)
    }

    
  }