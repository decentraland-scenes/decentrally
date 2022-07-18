import { CONFIG } from 'src/config'
import { CommonResources } from 'src/resources/common'
import { player, PlayerBase, ResetWorld,  scene as SceneData } from './scene'

export class BoxedInPlatflormUsingModel{
  host:Entity
  preventJumpingCollider: Entity
  PREVENT_PLAYER_JUMP_COLLIDER = new BoxShape()
  boxInEnt :Entity
  constructor(parent: Entity, bDebugMode: boolean = false) {
    const host = this.host = new Entity()
    host.addComponent(
      new Transform({
        position: new Vector3(0,0,0)//,
        //scale: new Vector3(3,1,3)
      })
    )
    host.setParent(parent)


    const groundThickness = CONFIG.GROUND_THICKNESS
    const showInivisibleGroundColliders = CONFIG.showInivisibleGroundColliders

    this.preventJumpingCollider = new Entity("raceArea.platform.preventJumpingCollider")
    this.preventJumpingCollider.setParent(this.host)
     //workaround nearby spawn location in attempt to hide the blooming affect (out of camera view)
    const preventJumpingCollider = this.preventJumpingCollider

    preventJumpingCollider.addComponentOrReplace(new Transform({
      //moved forward on Z to avoid camera jitters
      position: new Vector3(0, 2.67, .18),//2.67
      scale:  new Vector3( .1,.05,.1 )
    })
    )
    preventJumpingCollider.addComponentOrReplace(this.PREVENT_PLAYER_JUMP_COLLIDER)
    if(!showInivisibleGroundColliders) preventJumpingCollider.addComponent(CommonResources.RESOURCES.materials.transparent)
    //engine.addEntity(preventJumpingCollider)

    const boxInEnt = this.boxInEnt = new Entity("raceArea.platform.boxin")
    boxInEnt.setParent(host)
    boxInEnt.addComponent(
      new Transform({
        position: new Vector3(0,1.4,0)//,
        //scale: new Vector3(3,1,3)
      })
    )
    boxInEnt.addComponentOrReplace( new GLTFShape( 'models/car_collider_no_top.glb')) //
  }
  activatePlatform() {
    
    //this.updatePosToPlayer()
  }
  deActivatePlatform() {

  }
}

export class BoxedInPlatflormUsingPrimitives {
  startPos: Vector3
  rocketFlames: Entity
  platform: Entity
  conePlatform1: Entity
  conePlatform2: Entity
  conePlatform3: Entity
  conePlatform4: Entity
  wall1: Entity
  wall2: Entity
  wall3: Entity
  wall4: Entity
  bDebugMode: boolean = false

  constructor(parent: Entity, bDebugMode: boolean = false) {

    const host = new Entity()
    host.addComponent(
      new Transform({
        position: new Vector3(0,0,0)//,
        //scale: new Vector3(3,1,3)
      })
    )
    host.setParent(parent)
    
    this.platform = new Entity('float-board')
    /*this.platform.addComponent(
      new Transform({
        //scale: new Vector3(3, 1, 3),
      })
    )*/
    this.platform.addComponent(new BoxShape())
    this.platform.getComponent(BoxShape).withCollisions = false
    this.platform.setParent(host)

    const coneScale = new Vector3(2, 8, 2)
    const coneY = -2
    const coneRadius = 1

    this.conePlatform1 = new Entity('float-board1')
    this.conePlatform1.addComponent(
      new Transform({
        position: new Vector3(0, coneY, -coneRadius),
        scale: coneScale,
      })
    )
    this.conePlatform1.addComponent(new ConeShape())
    this.conePlatform1.getComponent(ConeShape).withCollisions = false
    this.conePlatform1.setParent(host)

    this.conePlatform2 = new Entity('float-board2')
    this.conePlatform2.addComponent(
      new Transform({
        position: new Vector3(0, coneY, coneRadius),
        scale: coneScale,
      })
    )
    this.conePlatform2.addComponent(new ConeShape())
    this.conePlatform2.getComponent(ConeShape).withCollisions = false
    this.conePlatform2.setParent(host)

    this.conePlatform3 = new Entity('float-board3')
    this.conePlatform3.addComponent(
      new Transform({
        position: new Vector3(-coneRadius, coneY, 0),
        scale: coneScale,
      })
    )
    this.conePlatform3.addComponent(new ConeShape())
    this.conePlatform3.getComponent(ConeShape).withCollisions = false
    this.conePlatform3.setParent(host)

    this.conePlatform4 = new Entity('float-board4')
    this.conePlatform4.addComponent(
      new Transform({
        position: new Vector3(coneRadius, coneY, 0),
        scale: coneScale,
      })
    )
    this.conePlatform4.addComponent(new ConeShape())
    this.conePlatform4.getComponent(ConeShape).withCollisions = false
    this.conePlatform4.setParent(host)

    const wallRadius = coneRadius * 0.8
    const wallY = 10
    const wallScaleY = 20
    const wallScaleWide = 0.4
    const wallScaleAnchor = 5

    this.wall1 = new Entity('float-board5')
    this.wall1.addComponent(
      new Transform({
        position: new Vector3(wallRadius, wallY, -wallRadius),
        rotation: Quaternion.Euler(0, -45, 0),
        scale: new Vector3(wallScaleAnchor, wallScaleY, wallScaleWide),
      })
    )
    this.wall1.addComponent(new BoxShape())
    this.wall1.getComponent(BoxShape).withCollisions = false
    this.wall1.setParent(host)

    this.wall2 = new Entity('float-board6')
    this.wall2.addComponent(
      new Transform({
        position: new Vector3(wallRadius, wallY, wallRadius),
        rotation: Quaternion.Euler(0, 45, 0),
        scale: new Vector3(wallScaleAnchor, wallScaleY, wallScaleWide),
      })
    )
    this.wall2.addComponent(new BoxShape())
    this.wall2.getComponent(BoxShape).withCollisions = false
    this.wall2.setParent(host)

    this.wall3 = new Entity('float-board7')
    this.wall3.addComponent(
      new Transform({
        position: new Vector3(-wallRadius, wallY, wallRadius),
        rotation: Quaternion.Euler(0, -45, 0),
        scale: new Vector3(wallScaleAnchor, wallScaleY, wallScaleWide),
      })
    )
    this.wall3.addComponent(new BoxShape())
    this.wall3.getComponent(BoxShape).withCollisions = false
    this.wall3.setParent(host)

    this.wall4 = new Entity('float-board8')
    this.wall4.addComponent(
      new Transform({
        position: new Vector3(-wallRadius, wallY, -wallRadius),
        rotation: Quaternion.Euler(0, 45, 0),
        scale: new Vector3(wallScaleAnchor, wallScaleY, wallScaleWide),
      })
    )
    this.wall4.addComponent(new BoxShape())
    this.wall4.getComponent(BoxShape).withCollisions = false
    this.wall4.setParent(host)


    this.bDebugMode = bDebugMode
    if (!this.bDebugMode) {
      this.platform.getComponent(BoxShape).visible = false
      this.conePlatform1.getComponent(ConeShape).visible = false
      this.conePlatform2.getComponent(ConeShape).visible = false
      this.conePlatform3.getComponent(ConeShape).visible = false
      this.conePlatform4.getComponent(ConeShape).visible = false

      this.wall1.getComponent(BoxShape).visible = false
      this.wall2.getComponent(BoxShape).visible = false
      this.wall3.getComponent(BoxShape).visible = false
      this.wall4.getComponent(BoxShape).visible = false

      //this.platform.getComponent(BoxShape).isPointerBlocker = false     //when the patform has isPointerBlocker false causes inestability
      this.conePlatform1.getComponent(ConeShape).isPointerBlocker = false
      this.conePlatform2.getComponent(ConeShape).isPointerBlocker = false
      this.conePlatform3.getComponent(ConeShape).isPointerBlocker = false
      this.conePlatform4.getComponent(ConeShape).isPointerBlocker = false
      this.wall1.getComponent(BoxShape).isPointerBlocker = false
      this.wall2.getComponent(BoxShape).isPointerBlocker = false
      this.wall3.getComponent(BoxShape).isPointerBlocker = false
      this.wall4.getComponent(BoxShape).isPointerBlocker = false
    } else {
      this.platform.addComponent(new Material())
      this.platform.getComponent(Material).albedoColor = new Color4(
        1,
        1,
        1,
        0.4
      )
      this.conePlatform1.addComponent(new Material())
      this.conePlatform1.getComponent(Material).albedoColor = new Color4(
        0,
        1,
        1,
        0.4
      )
      this.conePlatform2.addComponent(new Material())
      this.conePlatform2.getComponent(Material).albedoColor = new Color4(
        0,
        0,
        1,
        0.4
      )
      this.conePlatform3.addComponent(new Material())
      this.conePlatform3.getComponent(Material).albedoColor = new Color4(
        1,
        0,
        1,
        0.4
      )
      this.conePlatform4.addComponent(new Material())
      this.conePlatform4.getComponent(Material).albedoColor = new Color4(
        1,
        1,
        0,
        0.4
      )

      this.wall1.addComponent(new Material())
      this.wall1.getComponent(Material).albedoColor = new Color4(0, 0, 0, 0.4)
      this.wall2.addComponent(new Material())
      this.wall2.getComponent(Material).albedoColor = new Color4(0, 0, 0, 0.4)
      this.wall3.addComponent(new Material())
      this.wall3.getComponent(Material).albedoColor = new Color4(0, 0, 0, 0.4)
      this.wall4.addComponent(new Material())
      this.wall4.getComponent(Material).albedoColor = new Color4(0, 0, 0, 0.4)
    }
  }
  activatePlatform() {
    this.platform.getComponent(BoxShape).withCollisions = true
    this.conePlatform1.getComponent(ConeShape).withCollisions = true
    this.conePlatform2.getComponent(ConeShape).withCollisions = true
    this.conePlatform3.getComponent(ConeShape).withCollisions = true
    this.conePlatform4.getComponent(ConeShape).withCollisions = true
    this.wall1.getComponent(BoxShape).withCollisions = true
    this.wall2.getComponent(BoxShape).withCollisions = true
    this.wall3.getComponent(BoxShape).withCollisions = true
    this.wall4.getComponent(BoxShape).withCollisions = true
    //this.updatePosToPlayer()
  }
  deActivatePlatform() {
    this.platform.getComponent(BoxShape).withCollisions = false
    this.conePlatform1.getComponent(ConeShape).withCollisions = false
    this.conePlatform2.getComponent(ConeShape).withCollisions = false
    this.conePlatform3.getComponent(ConeShape).withCollisions = false
    this.conePlatform4.getComponent(ConeShape).withCollisions = false
    this.wall1.getComponent(BoxShape).withCollisions = false
    this.wall2.getComponent(BoxShape).withCollisions = false
    this.wall3.getComponent(BoxShape).withCollisions = false
    this.wall4.getComponent(BoxShape).withCollisions = false
    //this.updatePosToPlayer()
  }
}

/*
export class RocketBoard extends Entity {
  startPos: Vector3
  rocketFlames: Entity
  rocketBoosterSound: Sound
  body: CANNON.Body
  constructor(startPos: Vector3) {
    super()
    engine.addEntity(this)
    this.startPos = startPos
    this.addComponent(
      new Transform({
        position: startPos,
      })
    )
    this.addComponent(new GLTFShape('models/rocketBoard.glb'))

    this.rocketFlames = new Entity()
    this.rocketFlames.addComponent(
      new Transform({ scale: new Vector3(0, 0, 0) })
    )
    this.rocketFlames.addComponent(new GLTFShape('models/rocketFlames.glb'))
    this.rocketFlames.setParent(this)

    this.rocketBoosterSound = new Sound(
      new AudioClip('sounds/rocketBooster.mp3'),
      true
    )
  }

  // Activate booster animation
  activateRocketBooster(isOn: boolean) {
    if (isOn) {
      this.rocketBoosterSound.getComponent(AudioSource).playing = true
      this.rocketFlames.getComponent(Transform).scale.setAll(1)
    } else {
      this.rocketBoosterSound.getComponent(AudioSource).playing = false
      this.rocketFlames.getComponent(Transform).scale.setAll(0)
    }
  }
  respawn() {
    let newBoardPos = Camera.instance.position.clone().add(new Vector3(3, 3, 0))
    log('new pos to ', newBoardPos)

    this.body.angularVelocity.setZero()
    this.body.velocity = CANNON.Vec3.ZERO
    this.body.position = new CANNON.Vec3(
      newBoardPos.x,
      newBoardPos.y,
      newBoardPos.z
    )
    this.getComponent(Transform).position.copyFrom(this.body.position)
  }

  addOneTimeTrigger() {
    this.addComponent(
      new utils.TriggerComponent(
        new utils.TriggerBoxShape(new Vector3(2, 2, 2), new Vector3(0, 1.5, 0)),
        {
          onCameraEnter: () => {
            reportGetOnBoard()

            this.getComponent(utils.TriggerComponent).enabled = false
            this.removeComponent(utils.TriggerComponent)
          },
        }
      )
    )
  }
}
*/
