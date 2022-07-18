import { scene, player } from "./scene";

let gunShape =  new GLTFShape('models/gun.glb')

// let carUIRoot = new Entity()
// let carUISpeedTitle = new Entity()
// let carUISpeedValue = new Entity()

// let carUIAnchor = new Entity()
// carUIAnchor.addComponent(
//     new Transform({
//       position: new Vector3(0.15, -0.1, 0.3),
//       rotation: Quaternion.Euler(0,0,0),
//       scale: new Vector3(0.2,0.2,0.2)
//     })
//   )
// carUIAnchor.setParent(carUIRoot)

// let carUISpeedTitleText = new TextShape()
// carUISpeedTitleText.value = "Speed: "
// carUISpeedTitleText.fontSize = 2

// let carUISpeedValueText = new TextShape()
// carUISpeedValueText.value = scene.currentSpeed.toString()
// carUISpeedValueText.fontSize = 2

// carUISpeedTitle.addComponent(carUISpeedTitleText)
// carUISpeedTitle.addComponent(
//     new Transform({
//       position: new Vector3(0, 0, 0)
//     })
//   )
// carUISpeedTitle.setParent(carUIAnchor)

// carUISpeedValue.addComponent(carUISpeedValueText)
// carUISpeedValue.addComponent(
//     new Transform({
//       position: new Vector3(0.5, 0, 0)
//     })
//   )
// carUISpeedValue.setParent(carUIAnchor)

// //carUIRoot.addComponent(gunShape)
// //carUIRoot.addComponent(new Billboard())
// carUIRoot.addComponent(
//   new Transform({
//     position: new Vector3(0, 0.0, 0.0),
//     rotation: Quaternion.Euler(0,0,0),
//     scale: new Vector3(1,1,1)
//   })
// )
// engine.addEntity(carUIRoot)
// carUIAnchor.setParent(carUIRoot)
// carUIRoot.setParent(Attachable.FIRST_PERSON_CAMERA)

// export function updateAttachedUI(speed:number){
//     carUISpeedValueText.value = speed.toPrecision(2)
// }