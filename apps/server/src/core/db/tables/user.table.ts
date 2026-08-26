import { BaseTable } from '../baseTable.js'

export class UserTable extends BaseTable {
  readonly table = 'users'
  columns = this.setColumns((t) => ({
    id: t.uuid().primaryKey().default(t.sql`gen_random_uuid()`),
    walletAddress: t.string().unique(),
    publicKey: t.string(),
    createdAt: t.timestamp().default(t.sql`now()`),
    updatedAt: t.timestamp().default(t.sql`now()`),
  }))
}
