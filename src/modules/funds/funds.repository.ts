import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { funds } from '../../db/schema/index.js'
import type { NewFund } from './funds.types.js'

export const fundsRepository = {
  findAll: () => db.select().from(funds).orderBy(funds.code),

  findById: (id: number) =>
    db.select().from(funds).where(eq(funds.id, id)).then((rows) => rows[0]),

  findByCode: (code: string) =>
    db.select().from(funds).where(eq(funds.code, code)).then((rows) => rows[0]),

  create: (data: NewFund) =>
    db.insert(funds).values(data).returning().then((rows) => rows[0]),

  update: (id: number, data: Partial<NewFund>) =>
    db
      .update(funds)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(funds.id, id))
      .returning()
      .then((rows) => rows[0]),

  deactivate: (id: number) =>
    db
      .update(funds)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(funds.id, id))
      .returning()
      .then((rows) => rows[0]),
}
