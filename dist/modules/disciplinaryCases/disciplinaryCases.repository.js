import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { disciplinaryCases } from '../../db/schema/index.js';
export const disciplinaryCasesRepository = {
    findAll: () => db.select().from(disciplinaryCases),
    findByStudent: (studentId) => db.select().from(disciplinaryCases).where(eq(disciplinaryCases.studentId, studentId)),
    findById: (id) => db.select().from(disciplinaryCases).where(eq(disciplinaryCases.id, id)).then((rows) => rows[0]),
    create: (data) => db.insert(disciplinaryCases).values(data).returning().then((rows) => rows[0]),
    update: (id, data) => db.update(disciplinaryCases).set(data).where(eq(disciplinaryCases.id, id)).returning().then((rows) => rows[0]),
};
