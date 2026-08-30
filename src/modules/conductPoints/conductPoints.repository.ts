import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { conductPointRules, conductPoints } from '../../db/schema/index.js'
import type { NewConductPoint, NewConductPointRule } from './conductPoints.types.js'

export const conductPointsRepository = {
  findRecent: (limit: number) => db.select().from(conductPoints).orderBy(desc(conductPoints.awardedAt)).limit(limit),
  findAllRules: () => db.select().from(conductPointRules),
  findRuleById: (id: number) =>
    db.select().from(conductPointRules).where(eq(conductPointRules.id, id)).then((rows) => rows[0]),
  createRule: (data: NewConductPointRule) =>
    db.insert(conductPointRules).values(data).returning().then((rows) => rows[0]),

  findByStudent: (studentId: number) => db.select().from(conductPoints).where(eq(conductPoints.studentId, studentId)),
  award: (data: NewConductPoint) => db.insert(conductPoints).values(data).returning().then((rows) => rows[0]),

  async scoreForPeriod(studentId: number, periodId: number) {
    const [row] = await db
      .select({ total: sql<number>`coalesce(sum(${conductPoints.points}), 0)::int` })
      .from(conductPoints)
      .where(and(eq(conductPoints.studentId, studentId), eq(conductPoints.periodId, periodId)))
    return row?.total ?? 0
  },
}
