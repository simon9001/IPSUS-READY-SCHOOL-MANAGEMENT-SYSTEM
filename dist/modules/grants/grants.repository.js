import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { grantDisbursements, grantTypes } from '../../db/schema/index.js';
export const grantsRepository = {
    findAllTypes: () => db.select().from(grantTypes),
    findTypeById: (id) => db.select().from(grantTypes).where(eq(grantTypes.id, id)).then((rows) => rows[0]),
    createType: (data) => db.insert(grantTypes).values(data).returning().then((rows) => rows[0]),
    findAllDisbursements: () => db.select().from(grantDisbursements).orderBy(grantDisbursements.dateReceived),
    findDisbursementById: (id) => db.select().from(grantDisbursements).where(eq(grantDisbursements.id, id)).then((rows) => rows[0]),
    createDisbursement: (data) => db.insert(grantDisbursements).values(data).returning().then((rows) => rows[0]),
    attachJournalEntry: (id, journalEntryId) => db
        .update(grantDisbursements)
        .set({ journalEntryId })
        .where(eq(grantDisbursements.id, id))
        .returning()
        .then((rows) => rows[0]),
};
