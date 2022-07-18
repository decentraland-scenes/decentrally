//import { DataChange } from "colyseus.js"

export type ColyseusListenCallback<V>=(currentValue:V, previousValue:V)=>void

export type ColyseusCallbacks<V>={
    
    listen:<T>(prop:string, callback:ColyseusListenCallback<T>)=>void
}
export type ColyseusCallbacksCollection<K,V>=ColyseusCallbacks<V>&{
    onAdd: (instance:V, key:K)=>void
    onRemove: (instance:V, key:K)=>void
    onChange: (instance:V, key:K)=>void
}
export type ColyseusCallbacksArray<K,V>=ColyseusCallbacksCollection<K,V>&Array<V>&{
}
export type ColyseusCallbacksMap<K,V>=ColyseusCallbacksCollection<K,V>&Map<K,V>&{
}

export type ColyseusCallbacksReferences<V>=ColyseusCallbacks<V>&{
    //onChange: (changes:DataChange[])=>void TODO how to implement this sever side?
}