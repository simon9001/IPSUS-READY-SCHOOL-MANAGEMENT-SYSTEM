import type { disciplinaryCases } from '../../db/schema/index.js'

export type DisciplinaryCase = typeof disciplinaryCases.$inferSelect
export type NewDisciplinaryCase = typeof disciplinaryCases.$inferInsert
