import type { complianceReports } from '../../db/schema/index.js'

export type ComplianceReport = typeof complianceReports.$inferSelect
export type NewComplianceReport = typeof complianceReports.$inferInsert

export interface NemisEnrollmentData {
  periodId: number
  totalActiveStudents: number
  byClass: { classId: number; className: string; count: number }[]
  byGender: { gender: string; count: number }[]
  byBoardingStatus: { boardingStatus: string; count: number }[]
  newAdmissionsInPeriod: number
  exitsInPeriod: { outcome: string; count: number }[]
}

export interface TscStaffingData {
  periodId: number
  totalActiveTeachers: number
  tscEmployedCount: number
  bomEmployedCount: number
  distinctSubjectsCovered: number
  studentTeacherRatio: number | null
}

export interface MoeCapitationData {
  periodId: number
  asOfDate: string
  amountReceivedInPeriod: number
  fundBalanceAsOfDate: { accountCode: string; accountName: string; balance: number }[]
}
