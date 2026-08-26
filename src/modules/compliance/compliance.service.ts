import { complianceRepository } from './compliance.repository.js'
import { studentsRepository } from '../students/students.repository.js'
import { admissionsRepository } from '../admissions/admissions.repository.js'
import { promotionsRepository } from '../promotions/promotions.repository.js'
import { teachersRepository } from '../teachers/teachers.repository.js'
import { subjectsRepository } from '../subjects/subjects.repository.js'
import { periodsRepository } from '../periods/periods.repository.js'
import { grantsRepository } from '../grants/grants.repository.js'
import { journalService } from '../journal/journal.service.js'
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors.js'
import type { GenerateReportInput } from './compliance.schema.js'
import type { MoeCapitationData, NemisEnrollmentData, TscStaffingData } from './compliance.types.js'

async function compileNemisEnrollment(periodId: number): Promise<NemisEnrollmentData> {
  const period = await periodsRepository.findById(periodId)
  if (!period) throw new NotFoundError(`Fiscal period ${periodId} not found`)

  const [allStudents, allClasses, allAdmissions, exits] = await Promise.all([
    studentsRepository.findAll(),
    studentsRepository.findAllClasses(),
    admissionsRepository.findAll(),
    promotionsRepository.findInDateRange(period.startDate, period.endDate),
  ])

  const active = allStudents.filter((s) => s.status === 'active')
  const classNameById = new Map(allClasses.map((c) => [c.id, c.name]))

  const byClassMap = new Map<number, number>()
  const byGenderMap = new Map<string, number>()
  const byBoardingMap = new Map<string, number>()
  for (const s of active) {
    byClassMap.set(s.classId, (byClassMap.get(s.classId) ?? 0) + 1)
    const gender = s.gender ?? 'unspecified'
    byGenderMap.set(gender, (byGenderMap.get(gender) ?? 0) + 1)
    byBoardingMap.set(s.boardingStatus, (byBoardingMap.get(s.boardingStatus) ?? 0) + 1)
  }

  const newAdmissionsInPeriod = allAdmissions.filter(
    (a) => a.status === 'enrolled' && a.enrolledAt && a.enrolledAt.toISOString().slice(0, 10) >= period.startDate && a.enrolledAt.toISOString().slice(0, 10) <= period.endDate,
  ).length

  const exitsMap = new Map<string, number>()
  for (const p of exits) {
    if (p.outcome === 'graduated' || p.outcome === 'withdrawn' || p.outcome === 'transferred') {
      exitsMap.set(p.outcome, (exitsMap.get(p.outcome) ?? 0) + 1)
    }
  }

  return {
    periodId,
    totalActiveStudents: active.length,
    byClass: [...byClassMap.entries()].map(([classId, count]) => ({ classId, className: classNameById.get(classId) ?? `#${classId}`, count })),
    byGender: [...byGenderMap.entries()].map(([gender, count]) => ({ gender, count })),
    byBoardingStatus: [...byBoardingMap.entries()].map(([boardingStatus, count]) => ({ boardingStatus, count })),
    newAdmissionsInPeriod,
    exitsInPeriod: [...exitsMap.entries()].map(([outcome, count]) => ({ outcome, count })),
  }
}

async function compileTscStaffing(periodId: number): Promise<TscStaffingData> {
  const [allTeachers, allClasses, allStudents] = await Promise.all([
    teachersRepository.findAll(),
    studentsRepository.findAllClasses(),
    studentsRepository.findAll(),
  ])

  const activeTeachers = allTeachers.filter((t) => t.status === 'active')
  const tscCount = activeTeachers.filter((t) => t.tscNumber).length
  const bomCount = activeTeachers.filter((t) => t.employeeId).length

  const subjectIds = new Set<number>()
  for (const cls of allClasses) {
    const assignments = await subjectsRepository.findAssignments(cls.id, periodId)
    for (const a of assignments) subjectIds.add(a.subjectId)
  }

  const activeStudentCount = allStudents.filter((s) => s.status === 'active').length

  return {
    periodId,
    totalActiveTeachers: activeTeachers.length,
    tscEmployedCount: tscCount,
    bomEmployedCount: bomCount,
    distinctSubjectsCovered: subjectIds.size,
    studentTeacherRatio: activeTeachers.length > 0 ? Math.round((activeStudentCount / activeTeachers.length) * 10) / 10 : null,
  }
}

/**
 * Reports the Capitation fund's cumulative trial balance as of the period
 * end date (opening + receipts - expenditure to date), not an isolated
 * in-period delta — a simpler, still legitimate utilization snapshot.
 */
async function compileMoeCapitation(periodId: number): Promise<MoeCapitationData> {
  const period = await periodsRepository.findById(periodId)
  if (!period) throw new NotFoundError(`Fiscal period ${periodId} not found`)

  const allDisbursements = await grantsRepository.findAllDisbursements()
  const inPeriod = allDisbursements.filter((d) => d.dateReceived >= period.startDate && d.dateReceived <= period.endDate)
  const amountReceivedInPeriod = inPeriod.reduce((sum, d) => sum + Number(d.amountReceived), 0)

  const capitationType = (await grantsRepository.findAllTypes()).find((t) => t.name.toLowerCase().includes('capitation'))
  const trialBalance = capitationType
    ? await journalService.trialBalance(period.endDate, capitationType.fundId)
    : await journalService.trialBalance(period.endDate)

  return {
    periodId,
    asOfDate: period.endDate,
    amountReceivedInPeriod,
    fundBalanceAsOfDate: trialBalance.rows.map((r) => ({ accountCode: r.code, accountName: r.name, balance: r.balance })),
  }
}

export const complianceService = {
  list: () => complianceRepository.findAll(),

  async getById(id: number) {
    const report = await complianceRepository.findById(id)
    if (!report) throw new NotFoundError(`Compliance report ${id} not found`)
    return report
  },

  async generate(input: GenerateReportInput) {
    let reportData: NemisEnrollmentData | TscStaffingData | MoeCapitationData
    switch (input.reportType) {
      case 'nemis_enrollment':
        reportData = await compileNemisEnrollment(input.periodId)
        break
      case 'tsc_staffing':
        reportData = await compileTscStaffing(input.periodId)
        break
      case 'moe_capitation':
        reportData = await compileMoeCapitation(input.periodId)
        break
      default:
        throw new ValidationError('Unknown report type')
    }

    return complianceRepository.create({
      reportType: input.reportType,
      periodId: input.periodId,
      reportData,
      status: 'draft',
      generatedBy: input.generatedBy,
    })
  },

  async submit(id: number, referenceNumber: string, submittedBy: number) {
    const report = await this.getById(id)
    if (report.status === 'submitted') throw new ConflictError(`Report ${id} is already submitted`)
    return complianceRepository.submit(id, referenceNumber, submittedBy)
  },
}
