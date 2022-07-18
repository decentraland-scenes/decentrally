import { IDatabase, IMetricsComponent as IBaseMetricsComponent } from "@well-known-components/interfaces"
import { metricDeclarations } from "./metrics"
import admin /*, { Request, Response }*/ from 'firebase-admin'

/**
 * @public
 */
export interface IFireStoreComponent extends IDatabase {
  start(): Promise<void>
  
  query<T>(sql: string): Promise<IDatabase.IQueryResult<T>>
  //query<T>(sql: SQLStatement, durationQueryNameLabel?: string): Promise<IDatabase.IQueryResult<T>>
  //streamQuery<T = any>(sql: SQLStatement, config?: { batchSize?: number }): AsyncGenerator<T>*/
  getDb(): admin.firestore.Firestore

  stop(): Promise<void>
}

/**
 * @public
 */
export namespace IFireStoreComponent {
  /**
   * @public
   */
  export type Composable = {
    firestore: IFireStoreComponent
  }
}

/**
 * @public
 */
export type IMetricsComponent = IBaseMetricsComponent<keyof typeof metricDeclarations>
