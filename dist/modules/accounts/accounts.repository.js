import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { accounts } from '../../db/schema/index.js';
export const accountsRepository = {
    findAll: () => db.select().from(accounts).orderBy(accounts.code),
    findById: (id) => db.select().from(accounts).where(eq(accounts.id, id)).then((rows) => rows[0]),
    findByCode: (code) => db.select().from(accounts).where(eq(accounts.code, code)).then((rows) => rows[0]),
    create: (data) => db.insert(accounts).values(data).returning().then((rows) => rows[0]),
    update: (id, data) => db
        .update(accounts)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(accounts.id, id))
        .returning()
        .then((rows) => rows[0]),
    deactivate: (id) => db
        .update(accounts)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(accounts.id, id))
        .returning()
        .then((rows) => rows[0]),
};
