import { orchidORM } from 'orchid-orm/node-postgres'
import { config } from '../config/env.js'
import { UserTable } from './tables/user.table.js'

export const db = orchidORM(
  {
    databaseURL: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000
  },
  {
    users: UserTable
  }
)
