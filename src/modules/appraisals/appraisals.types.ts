import type { staffAppraisals } from '../../db/schema/index.js'

export type StaffAppraisal = typeof staffAppraisals.$inferSelect
export type NewStaffAppraisal = typeof staffAppraisals.$inferInsert
