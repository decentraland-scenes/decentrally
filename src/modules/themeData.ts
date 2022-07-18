import { getOrCreateGLTFShape } from "src/resources/common"

class ThemeAnimationData{
    enabled:boolean
    loop:boolean
    idle:string
    activate:string
}
export class ThemeTrackFeature{
    shape:GLTFShape
    transform?:Transform
    triggerSize?:Vector3
    animationData:ThemeAnimationData
    activateTime:number
}
export class ThemeTrackFeatures {    
    boost: ThemeTrackFeature
    trap: ThemeTrackFeature
}

export class Theme {
    name:string
    trackEdgeMesh: GLTFShape        
    groundTexture: Texture      
    subObjects: GLTFShape[] 
    trackFeature: ThemeTrackFeatures
    carDust: GLTFShape
    skyboxTexture: Texture
    //skyBox //TODO DEFINE SKYBOX PER THEME
    
}

export class ThemeController {

    currentThemeIdx:number
    themes:Theme[]
    
    constructor(){
        this.themes = []

        //TODO expand this for animations. idle, activated. etc
        const trackFeatures:ThemeTrackFeatures = { 
            boost: {
                    shape: getOrCreateGLTFShape('models/trackFeatures/booster.glb')    
                    ,transform:new Transform({scale:new Vector3(1,1,1)})
                    ,triggerSize: new Vector3(.5,2,.5)
                    , animationData: { enabled:false, loop:false, idle: "idle", activate: "activate" }
                    , activateTime: 0 //now
                    },
            trap:  {
                    shape: getOrCreateGLTFShape('models/trackFeatures/trap_spikes.glb')
                    ,transform:new Transform({scale:new Vector3(1.5,1.5,1.5)})
                    //,triggerSize: new Vector3(2,2,2)
                    , animationData: { enabled:false, loop:false, idle: "idle", activate: "activate" }
                    , activateTime: 0 //now
                    }
        }

        // THEMES
        //CITY
        const cityTheme:Theme = {
            name: "City",
            trackEdgeMesh: new GLTFShape('models/city/track_edge_meta.glb'),        
            groundTexture: new Texture('textures/road.png', {samplingMode: 2, wrap:1}),      
            subObjects: [
                new GLTFShape('models/city/meta_lamp.glb'),
                new GLTFShape('models/city/meta_building.glb')
            ],
            carDust: new GLTFShape('models/city/road_dust.glb') ,
			trackFeature: trackFeatures,
            skyboxTexture:   new Texture('textures/skybox.png', {samplingMode: 0, wrap: 1})   
        }
        
        //DESERT
        const desertTheme:Theme = {
            name: "Desert",
            trackEdgeMesh: new GLTFShape('models/desert/track_edge_sand.glb'),        
            groundTexture: new Texture('textures/sand_color.png', {samplingMode: 2, wrap:1}),      
            subObjects: [
                new GLTFShape('models/desert/rock.glb'),
                new GLTFShape('models/desert/cactus.glb')
            ],
            carDust: new GLTFShape('models/desert/desert_dust.glb'),
			trackFeature: trackFeatures,
            skyboxTexture:   new Texture('textures/skybox_desert.png', {samplingMode: 0, wrap: 1})
        }

        // INIT THEMES
        // ID: 0
        this.newTheme( cityTheme )
        // ID: 1
        this.newTheme( desertTheme )
    
    }
    
    newTheme(themeData:Theme){
        this.themes.push(themeData)

        if(this.themes.length == 1){
            this.setTheme(0)
        }
    }

    setTheme(id:number){
        if (id >= 0 && id < this.themes.length){
            this.currentThemeIdx = id
        }
    }
    getTheme(id:number):Theme{
        if (id >= 0 && id < this.themes.length){
            return this.themes[id]
        }
        else return this.themes[0]
    }

    getCurrentTheme(){
        return this.themes[this.currentThemeIdx]
    }

    getGround():Texture{
        return this.themes[this.currentThemeIdx].groundTexture
    }

    getEdge():GLTFShape {
        return this.themes[this.currentThemeIdx].trackEdgeMesh
    }

    getDust():GLTFShape{
        return this.themes[this.currentThemeIdx].carDust
    }

}
// THEME CONTROLLER
export const themeControl = new ThemeController()






