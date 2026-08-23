import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { accounts } from '../../db/schema/index.js'
import type { NewAccount } from './accounts.types.js'

export const accountsRepository = {
  findAll: () => db.select().from(accounts).orderBy(accounts.code),

  findById: (id: number) =>
    db.select().from(accounts).where(eq(accounts.id, id)).then((rows) => rows[0]),

  findByCode: (code: string) =>
    db.select().from(accounts).where(eq(accounts.code, code)).then((rows) => rows[0]),

  create: (data: NewAccount) =>
    db.insert(accounts).values(data).returning().then((rows) => rows[0]),

  update: (id: number, data: Partial<NewAccount>) =>
    db
      .update(accounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning()
      .then((rows) => rows[0]),

  deactivate: (id: number) =>
    db
      .update(accounts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning()
      .then((rows) => rows[0]),
}
