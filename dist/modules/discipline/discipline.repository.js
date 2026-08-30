import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { disciplineRecords } from '../../db/schema/index.js';
export const disciplineRepository = {
    findRecent: (limit) => db.select().from(disciplineRecords).orderBy(desc(disciplineRecords.createdAt)).limit(limit),
    findByStudent: (studentId) => db.select().from(disciplineRecords).where(eq(disciplineRecords.studentId, studentId)),
    findById: (id) => db.select().from(disciplineRecords).where(eq(disciplineRecords.id, id)).then((rows) => rows[0]),
    create: (data) => db.insert(disciplineRecords).values(data).returning().then((rows) => rows[0]),
};
