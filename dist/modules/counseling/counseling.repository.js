import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { counselingSessions } from '../../db/schema/index.js';
export const counselingRepository = {
    findByStudent: (studentId) => db.select().from(counselingSessions).where(eq(counselingSessions.studentId, studentId)),
    findById: (id) => db.select().from(counselingSessions).where(eq(counselingSessions.id, id)).then((rows) => rows[0]),
    create: (data) => db.insert(counselingSessions).values(data).returning().then((rows) => rows[0]),
};
