import type { admissions } from '../../db/schema/index.js'

export type Admission = typeof admissions.$inferSelect
export type NewAdmission = typeof admissions.$inferInsert
