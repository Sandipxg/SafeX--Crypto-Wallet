import { orchidORM } from 'orchid-orm/node-postgres'
import { config } from '../config/env.js'

export const db = orchidORM(
  {
    databaseURL: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000
  },
  {}
)
