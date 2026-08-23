import type { guardianStudents } from '../../db/schema/index.js'

export type GuardianStudent = typeof guardianStudents.$inferSelect
export type NewGuardianStudent = typeof guardianStudents.$inferInsert
