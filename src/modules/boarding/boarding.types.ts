import type { dormitories, bedAllocations, boardingAttendance } from '../../db/schema/index.js'

export type Dormitory = typeof dormitories.$inferSelect
export type NewDormitory = typeof dormitories.$inferInsert
export type BedAllocation = typeof bedAllocations.$inferSelect
export type NewBedAllocation = typeof bedAllocations.$inferInsert
export type BoardingAttendance = typeof boardingAttendance.$inferSelect
export type NewBoardingAttendance = typeof boardingAttendance.$inferInsert
