import type { classes, streams, students } from '../../db/schema/index.js'

export type Class = typeof classes.$inferSelect
export type NewClass = typeof classes.$inferInsert
export type Stream = typeof streams.$inferSelect
export type NewStream = typeof streams.$inferInsert
export type Student = typeof students.$inferSelect
export type NewStudent = typeof students.$inferInsert
