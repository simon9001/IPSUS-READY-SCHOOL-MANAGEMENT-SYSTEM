import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { conductPointRules, conductPoints } from '../../db/schema/index.js';
export const conductPointsRepository = {
    findAllRules: () => db.select().from(conductPointRules),
    findRuleById: (id) => db.select().from(conductPointRules).where(eq(conductPointRules.id, id)).then((rows) => rows[0]),
    createRule: (data) => db.insert(conductPointRules).values(data).returning().then((rows) => rows[0]),
    findByStudent: (studentId) => db.select().from(conductPoints).where(eq(conductPoints.studentId, studentId)),
    award: (data) => db.insert(conductPoints).values(data).returning().then((rows) => rows[0]),
    async scoreForPeriod(studentId, periodId) {
        const [row] = await db
            .select({ total: sql `coalesce(sum(${conductPoints.points}), 0)::int` })
            .from(conductPoints)
            .where(and(eq(conductPoints.studentId, studentId), eq(conductPoints.periodId, periodId)));
        return row?.total ?? 0;
    },
};
