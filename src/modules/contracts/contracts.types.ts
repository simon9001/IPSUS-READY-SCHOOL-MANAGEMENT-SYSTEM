import type { staffContracts } from '../../db/schema/index.js'

export type StaffContract = typeof staffContracts.$inferSelect
export type NewStaffContract = typeof staffContracts.$inferInsert
