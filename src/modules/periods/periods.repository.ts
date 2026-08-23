import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { fiscalPeriods } from '../../db/schema/index.js'
import type { NewFiscalPeriod } from './periods.types.js'

export const periodsRepository = {
  findAll: () => db.select().from(fiscalPeriods).orderBy(fiscalPeriods.startDate),

  findById: (id: number) =>
    db.select().from(fiscalPeriods).where(eq(fiscalPeriods.id, id)).then((rows) => rows[0]),

  create: (data: NewFiscalPeriod) =>
    db.insert(fiscalPeriods).values(data).returning().then((rows) => rows[0]),

  update: (id: number, data: Partial<NewFiscalPeriod>) =>
    db.update(fiscalPeriods).set(data).where(eq(fiscalPeriods.id, id)).returning().then((rows) => rows[0]),

  close: (id: number) =>
    db
      .update(fiscalPeriods)
      .set({ status: 'closed', closedAt: new Date() })
      .where(eq(fiscalPeriods.id, id))
      .returning()
      .then((rows) => rows[0]),
}
