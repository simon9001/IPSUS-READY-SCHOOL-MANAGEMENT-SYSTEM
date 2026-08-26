import { and, between, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { promotions } from '../../db/schema/index.js';
export const promotionsRepository = {
    findByStudent: (studentId) => db.select().from(promotions).where(eq(promotions.studentId, studentId)),
    findInDateRange: (startDate, endDate) => db.select().from(promotions).where(and(between(promotions.decisionDate, startDate, endDate))),
    create: (data) => db.insert(promotions).values(data).returning().then((rows) => rows[0]),
};
