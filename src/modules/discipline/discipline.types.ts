import type { disciplineRecords } from '../../db/schema/index.js'

export type DisciplineRecord = typeof disciplineRecords.$inferSelect
export type NewDisciplineRecord = typeof disciplineRecords.$inferInsert
