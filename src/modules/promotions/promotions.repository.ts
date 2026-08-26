import { and, between, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { promotions } from '../../db/schema/index.js'
import type { NewPromotion } from './promotions.types.js'

export const promotionsRepository = {
  findByStudent: (studentId: number) => db.select().from(promotions).where(eq(promotions.studentId, studentId)),
  findInDateRange: (startDate: string, endDate: string) =>
    db.select().from(promotions).where(and(between(promotions.decisionDate, startDate, endDate))),
  create: (data: NewPromotion) => db.insert(promotions).values(data).returning().then((rows) => rows[0]),
}
