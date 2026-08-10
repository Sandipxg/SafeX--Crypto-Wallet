import { db } from './db.js'
import pkg from 'pg'
import { config } from '../config/env.js'

const { Pool } = pkg

export const dbPool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

export { db }

export async function checkDbConnection(): Promise<boolean> {
  try {
    const client = await dbPool.connect()
    await client.query('SELECT 1')
    client.release()
    return true
  } catch (error) {
    console.error('[Orchid ORM / Postgres DB] Connection check failed:', error)
    return false
  }
}
