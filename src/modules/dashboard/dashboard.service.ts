import { journalService } from '../journal/journal.service.js'
import { feesService } from '../fees/fees.service.js'
import { studentsRepository } from '../students/students.repository.js'
import { examsService } from '../exams/exams.service.js'
import type { DashboardSummary } from './dashboard.types.js'

export const dashboardService = {
  async summary(asOfDate: string): Promise<DashboardSummary> {
    const [trialBalance, invoices, allStudents, allClasses, allExams] = await Promise.all([
      journalService.trialBalance(asOfDate),
      feesService.listInvoices(),
      studentsRepository.findAll(),
      studentsRepository.findAllClasses(),
      examsService.listExams(),
    ])

    const invoiceCountByStatusMap = new Map<string, number>()
    let totalInvoiced = 0
    for (const inv of invoices) {
      invoiceCountByStatusMap.set(inv.status, (invoiceCountByStatusMap.get(inv.status) ?? 0) + 1)
      totalInvoiced += Number(inv.totalAmount)
    }

    const activeStudents = allStudents.filter((s) => s.status === 'active')
    const classNameById = new Map(allClasses.map((c) => [c.id, c.name]))
    const byClassMap = new Map<number, number>()
    for (const s of activeStudents) byClassMap.set(s.classId, (byClassMap.get(s.classId) ?? 0) + 1)

    const sortedExams = [...allExams].sort((a, b) => b.id - a.id)
    let mostRecentExam: DashboardSummary['academic']['mostRecentExam'] = null
    for (const exam of sortedExams) {
      const results = await examsService.getResultsForExam(exam.id)
      if (results.length > 0) {
        const meanMarks = results.reduce((sum, r) => sum + Number(r.marks), 0) / results.length
        mostRecentExam = { examId: exam.id, examName: exam.name, overallMeanMarks: Math.round(meanMarks * 10) / 10 }
        break
      }
    }

    return {
      asOfDate,
      financial: {
        totalDebit: trialBalance.totalDebit,
        totalCredit: trialBalance.totalCredit,
        isBalanced: trialBalance.isBalanced,
        totalInvoiced,
        invoiceCountByStatus: [...invoiceCountByStatusMap.entries()].map(([status, count]) => ({ status, count })),
      },
      enrollment: {
        totalActiveStudents: activeStudents.length,
        byClass: [...byClassMap.entries()].map(([classId, count]) => ({ classId, className: classNameById.get(classId) ?? `#${classId}`, count })),
      },
      academic: {
        totalExamsRecorded: allExams.length,
        mostRecentExam,
      },
    }
  },
}
