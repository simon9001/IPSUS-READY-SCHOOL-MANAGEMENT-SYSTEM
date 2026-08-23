import type { staffDisciplinaryRecords } from '../../db/schema/index.js'

export type StaffDisciplinaryRecord = typeof staffDisciplinaryRecords.$inferSelect
export type NewStaffDisciplinaryRecord = typeof staffDisciplinaryRecords.$inferInsert
