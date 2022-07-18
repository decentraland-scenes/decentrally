
export class CarData {
    id:string //use to share multi player without passing ALL the data unless we want to support modify your own car
    name:string
    mesh:string        
    driverMesh: string      
    wheelMesh: string        
    frontWheelR: Vector3
    frontWheelL: Vector3
    rearWheelR: Vector3
    rearWheelL: Vector3
    exhaustScale: Vector3
    exhaustPos: Vector3      
    driverPos: Vector3  
    driverScale: Vector3    
}



 
export const mercedes:CarData = {
    id: "mercedes",
    name: "Mercedes",
    mesh: "models/car_mercedes.glb",        
    driverMesh: "models/driver.glb",        
    wheelMesh: "models/wheel_mercedes.glb",        
    frontWheelR: new Vector3( 0.18, 0.07, 0.38),
    frontWheelL: new Vector3(-0.18, 0.07, 0.38),
    rearWheelR: new Vector3(  0.18, 0.07, -0.23),
    rearWheelL: new Vector3( -0.18, 0.07, -0.23),
    exhaustScale: new Vector3(0.1, 0.05, 0.1),
    exhaustPos: new Vector3(0.12, 0.05, -0.45),   
    driverPos: new Vector3(0, 0.1, -0.1),   
    driverScale: new Vector3(0.75, 0.75, 0.75)
};


export const mercedesAltTest:CarData = {
    id: "mercedes-alt-test",
    name: "Mercedes Alt Test",
    mesh: "models/car_mercedes_test.glb",        
    driverMesh: "models/driver_test.glb",        
    wheelMesh: "models/wheel_mercedes_test.glb",        
    frontWheelR: new Vector3( 0.18,0.07,0.38),
    frontWheelL: new Vector3(-0.18,0.07,0.38),
    rearWheelR: new Vector3(  0.18,0.07,-0.23),
    rearWheelL: new Vector3( -0.18,0.07,-0.23),
    exhaustScale: new Vector3(0.1, 0.05, 0.1),
    exhaustPos: new Vector3(0.12, 0.05, -0.45),   
    driverPos: new Vector3(0, 0.1, -0.1),   
    driverScale: new Vector3(0.75,0.75,0.75)
};

export const roadster:CarData = {
    id: "roadster",
    name: "Desert Roadster",
    mesh: "models/car_roadster_body.glb",        
    driverMesh: "models/driver_test.glb",        
    wheelMesh: "models/car_roadster_wheel.glb",        
    frontWheelR: new Vector3( 0.209,0.07,0.442),
    frontWheelL: new Vector3(-0.209,0.07,0.442),
    rearWheelR: new Vector3(  0.209,0.07,-0.267),
    rearWheelL: new Vector3( -0.209,0.07,-0.267),
    exhaustScale: new Vector3(0.1, 0.05, 0.1),
    exhaustPos: new Vector3(0.209, 0.24, -0.3),   
    driverPos: new Vector3(0, 0.1, -0.11),   
    driverScale: new Vector3(0.75,0.75,0.75)
};

export const ALL_CAR_MODELS:CarData[] = [ mercedes, mercedesAltTest ]
export function findCarModelById(id:string,theDefault?:CarData):CarData{
    log("findCarModelById",id,theDefault)
    for(const p in ALL_CAR_MODELS){
        if(id == ALL_CAR_MODELS[p].id){
            return ALL_CAR_MODELS[p]
        }
    }
    return theDefault
}

// export const f1:CarData = {
//     mesh: "models/car_mercedes.glb",        
//     driverMesh: "models/driver.glb",        
//     wheelMesh: "models/wheel_mercedes.glb",        
//     frontWheelR: new Vector3( 0.18,0.07,0.38),
//     frontWheelL: new Vector3(-0.18,0.07,0.38),
//     rearWheelR: new Vector3(  0.18,0.07,-0.23),
//     rearWheelL: new Vector3( -0.18,0.07,-0.23),
//     exhaustScale: new Vector3(0.1, 0.05, 0.1),
//     exhaustPos: new Vector3(0.12, 0.05, -0.45),   
//     driverPos: new Vector3(0, 0.1, -0.1),   
//     driverScale: new Vector3(0.75,0.75,0.75)
// };

export const defaultCar = roadster
  
  
  