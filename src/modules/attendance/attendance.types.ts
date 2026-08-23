import type { attendanceRecords } from '../../db/schema/index.js'

export type AttendanceRecord = typeof attendanceRecords.$inferSelect
export type NewAttendanceRecord = typeof attendanceRecords.$inferInsert
