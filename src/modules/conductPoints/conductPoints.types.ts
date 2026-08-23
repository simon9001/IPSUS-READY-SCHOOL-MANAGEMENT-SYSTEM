import type { conductPointRules, conductPoints } from '../../db/schema/index.js'

export type ConductPointRule = typeof conductPointRules.$inferSelect
export type NewConductPointRule = typeof conductPointRules.$inferInsert
export type ConductPoint = typeof conductPoints.$inferSelect
export type NewConductPoint = typeof conductPoints.$inferInsert

export interface ConductScore {
  studentId: number
  periodId: number
  totalPoints: number
}
