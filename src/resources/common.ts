
const INVISIBLE_MATERIAL = new BasicMaterial()
const INVISIBLE_MATERIAL_texture = new Texture('textures/transparent-texture.png')
INVISIBLE_MATERIAL.texture = INVISIBLE_MATERIAL_texture
INVISIBLE_MATERIAL.alphaTest = 1


const MATERIAL_CACHE:Record<string,ObservableComponent> = {}
const GLTF_CACHE:Record<string,GLTFShape> = {}
const FONT_CACHE:Record<string,Font> = {}


let enemyMarkerTexture = new Texture('textures/enemy_marker.png', {samplingMode: 2})
let markerMat = new Material()

markerMat.albedoTexture = enemyMarkerTexture
markerMat.alphaTexture = enemyMarkerTexture
markerMat.roughness = 1.0
markerMat.metallic = 0.0

export class CommonResources {
    static RESOURCES = {
        models:{
          names:{
            
          }
        },
        textures: {
          //sprite_sheet: spriteSheetTexture,
          transparent: {
            texture: INVISIBLE_MATERIAL_texture,
            size:{sourceHeight:1,sourceWidth:1} //ImageSection
          },
          roundedSquareAlpha: {
            texture: new Texture ("images/rounded_alpha_square.png")
           // size:{sourceHeight:1,sourceWidth:1} //ImageSection
          }
          
        },
        materials: {
          //sprite_sheet: spriteSheetMaterial
          transparent: INVISIBLE_MATERIAL,
          enemyMarkerTexture: enemyMarkerTexture
        },
        strings:{
           
        },
        images:{
          portrait:{
          }
        }
      }
}


export function getOrCreateGLTFShape(model:string):GLTFShape{
  let shape:GLTFShape = GLTF_CACHE[model]
  if(!shape){
    log("miss gltf cache",model)
    shape = new GLTFShape(model)
    GLTF_CACHE[model] = shape
  }else{
    log("hit gltf cache",model)
  }
  return shape;
}

export function getOrCreateMaterial(color:Color3,transparent:boolean):ObservableComponent{
  let colorCacheName = color.toHexString();// + "-" + colorOn.toHexString() + "-" + emissiveIntensity
  if(transparent){
      colorCacheName = "transparent"
  }
  let materialComp:ObservableComponent = MATERIAL_CACHE[colorCacheName]
  if(!materialComp){
      if(!transparent){
          const material = new Material()
          material.albedoColor = color
          //barItemMaterial.specularIntensity = 1
          material.roughness = 1
          material.metallic = 0.0
          MATERIAL_CACHE[colorCacheName] = material

          materialComp = material
      }else{
          //do stuff to make transparent
          let material = CommonResources.RESOURCES.materials.transparent
          MATERIAL_CACHE[colorCacheName] = material

          materialComp = material
      }
  }else{
    if(transparent){
      log("hit transparent cache")
    }
  }
  return materialComp;
}

export function getColorFromString(strColor:string,theDefault:Color3){
 
  let color:Color3 = theDefault;
  if(strColor!==null&&strColor!==undefined){
    if(strColor?.indexOf("#")==0){
      color = Color3.FromHexString(strColor)
    }else{
      switch(strColor?.toLowerCase()){
        case 'white': color = Color3.White(); break;
        case 'black': color = Color3.Black(); break;
        case 'blue': color = Color3.Blue(); break;
        case 'green': color = Color3.Green(); break;
        case 'red': color = Color3.Red(); break;
        case 'yellow': color = Color3.Yellow(); break;
        case 'purple': color = Color3.Purple(); break;
        case 'magenta': color = Color3.Magenta(); break;
        case 'gray': color = Color3.Gray(); break;
        case 'teal': color = Color3.Teal(); break;
      }
    }
  }
  //log("getColorFromString " + strColor + ";->" + color)
  return color;
}


export function getOrCreateFont(textFont:string):Font{
  let font = FONT_CACHE[textFont];
  if(!font){
    switch (textFont) {
      case 'SF':
      case 'SanFrancisco':
        font = new Font(Fonts.SanFrancisco)
        break
      case 'SF_Heavy': 
      case 'SanFrancisco_Heavy':
        font = new Font(Fonts.SanFrancisco_Heavy)
        break
      case 'LibSans':
      case 'LiberationSans':
        font = new Font(Fonts.LiberationSans)
        break
    }
    FONT_CACHE[textFont] = font
  }
  return font
}