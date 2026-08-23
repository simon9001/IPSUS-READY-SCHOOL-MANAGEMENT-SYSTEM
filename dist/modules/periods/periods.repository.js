import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { fiscalPeriods } from '../../db/schema/index.js';
export const periodsRepository = {
    findAll: () => db.select().from(fiscalPeriods).orderBy(fiscalPeriods.startDate),
    findById: (id) => db.select().from(fiscalPeriods).where(eq(fiscalPeriods.id, id)).then((rows) => rows[0]),
    create: (data) => db.insert(fiscalPeriods).values(data).returning().then((rows) => rows[0]),
    update: (id, data) => db.update(fiscalPeriods).set(data).where(eq(fiscalPeriods.id, id)).returning().then((rows) => rows[0]),
    close: (id) => db
        .update(fiscalPeriods)
        .set({ status: 'closed', closedAt: new Date() })
        .where(eq(fiscalPeriods.id, id))
        .returning()
        .then((rows) => rows[0]),
};
