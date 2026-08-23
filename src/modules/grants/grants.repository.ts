import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { grantDisbursements, grantTypes } from '../../db/schema/index.js'
import type { NewGrantDisbursement, NewGrantType } from './grants.types.js'

export const grantsRepository = {
  findAllTypes: () => db.select().from(grantTypes),

  findTypeById: (id: number) =>
    db.select().from(grantTypes).where(eq(grantTypes.id, id)).then((rows) => rows[0]),

  createType: (data: NewGrantType) =>
    db.insert(grantTypes).values(data).returning().then((rows) => rows[0]),

  findAllDisbursements: () => db.select().from(grantDisbursements).orderBy(grantDisbursements.dateReceived),

  findDisbursementById: (id: number) =>
    db.select().from(grantDisbursements).where(eq(grantDisbursements.id, id)).then((rows) => rows[0]),

  createDisbursement: (data: NewGrantDisbursement) =>
    db.insert(grantDisbursements).values(data).returning().then((rows) => rows[0]),

  attachJournalEntry: (id: number, journalEntryId: number) =>
    db
      .update(grantDisbursements)
      .set({ journalEntryId })
      .where(eq(grantDisbursements.id, id))
      .returning()
      .then((rows) => rows[0]),
}
