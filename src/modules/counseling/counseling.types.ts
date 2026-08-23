import type { counselingSessions } from '../../db/schema/index.js'

export type CounselingSession = typeof counselingSessions.$inferSelect
export type NewCounselingSession = typeof counselingSessions.$inferInsert
