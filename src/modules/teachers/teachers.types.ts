import type { teachers } from '../../db/schema/index.js'

export type Teacher = typeof teachers.$inferSelect
export type NewTeacher = typeof teachers.$inferInsert
