import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { funds } from '../../db/schema/index.js';
export const fundsRepository = {
    findAll: () => db.select().from(funds).orderBy(funds.code),
    findById: (id) => db.select().from(funds).where(eq(funds.id, id)).then((rows) => rows[0]),
    findByCode: (code) => db.select().from(funds).where(eq(funds.code, code)).then((rows) => rows[0]),
    create: (data) => db.insert(funds).values(data).returning().then((rows) => rows[0]),
    update: (id, data) => db
        .update(funds)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(funds.id, id))
        .returning()
        .then((rows) => rows[0]),
    deactivate: (id) => db
        .update(funds)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(funds.id, id))
        .returning()
        .then((rows) => rows[0]),
};
