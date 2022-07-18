// This file is the "test-environment" analogous for src/components.ts
// Here we define the test components to be used in the testing environment

import { createRunner, createLocalFetchCompoment } from "@well-known-components/test-helpers"

import { main } from "../src/service"
import { TestComponents } from "../src/types"
import { initComponents as originalInitComponents } from "../src/components"

import admin /*, { Request, Response }*/ from 'firebase-admin'
import { IFireStoreComponent } from "../src/firebase"
import { IDatabase } from "@well-known-components/interfaces"

/**
 * Behaves like Jest "describe" function, used to describe a test for a
 * use case, it creates a whole new program and components to run an
 * isolated test.
 *
 * State is persistent within the steps of the test.
 */
export const test = createRunner<TestComponents>({
  main,
  initComponents,
})

function createTestFirebaseComponent(): IFireStoreComponent {
  return {
    async start(): Promise<void> {
      
    },
    //query<T>(sql: string): Promise<IDatabase.IQueryResult<T>>
    query<T>(sql: any, durationQueryNameLabel?: any): Promise<IDatabase.IQueryResult<T>> | Promise<IDatabase.IQueryResult<T>> {
      throw new Error("Method not implemented.")
    },
    getDb(): admin.firestore.Firestore {
      if(!this.db){ throw new Error("db not initialized")}
      return this.db
    },
    async stop(): Promise<void> {
      
    }
  }
}



async function initComponents(): Promise<TestComponents> {
  const components = await originalInitComponents()

  const { config } = components

  //const { firebase } = stubComponents
  //firebase.somemethod.withArgs(1, 2, 3).resolves({asd})
  // test function that calls firebase.somemethod

  const retVal = {
    ...components,
    localFetch: await createLocalFetchCompoment(config),
  }
  
  retVal.firebase = createTestFirebaseComponent()

  return retVal
}

