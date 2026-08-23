import type { staff } from '../../db/schema/index.js'

export type Staff = typeof staff.$inferSelect
export type NewStaff = typeof staff.$inferInsert
