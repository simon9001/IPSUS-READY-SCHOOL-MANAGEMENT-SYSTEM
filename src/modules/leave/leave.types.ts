import type { leaveTypes, leaveRequests } from '../../db/schema/index.js'

export type LeaveType = typeof leaveTypes.$inferSelect
export type NewLeaveType = typeof leaveTypes.$inferInsert
export type LeaveRequest = typeof leaveRequests.$inferSelect
export type NewLeaveRequest = typeof leaveRequests.$inferInsert

export interface LeaveBalance {
  staffId: number
  leaveTypeId: number
  year: number
  daysAllocated: number
  daysTaken: number
  daysRemaining: number
}
