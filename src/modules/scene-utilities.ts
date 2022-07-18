/**
 * make sure its downloaded and ready to use 
 * ALSO a workaround bug where if not loaded on scene load sometimes it wont load at all or all purple
 * 
 * @param shape 
 * @param name 
 */
export function loadOnSceneStartThenRemove(shape:Shape,name?:string){
    log("loadOnSceneStartThenRemove adding ",name)
    const entity = new Entity()
    entity.addComponent(new Transform({position:new Vector3(24,2,24)}))
    entity.addComponent(shape);
    engine.addEntity(entity)

    onSceneReadyObservable.add(() => {
        log("loadOnSceneStartThenRemove removing ",name)
        engine.removeEntity(entity)
      })
}

/**
 * 
 * @param entity entity to be added to engine
 * @returns true if added to engine, false if not
 */
export function engineAddEntity(entity:IEntity):boolean{
  if(entity && !entity.alive){
    engine.addEntity(entity)
    return true
  } 
  return false;
}