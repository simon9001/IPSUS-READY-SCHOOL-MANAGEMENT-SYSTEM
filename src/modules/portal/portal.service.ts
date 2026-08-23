import { guardiansService } from '../guardians/guardians.service.js'
import { feesService } from '../fees/fees.service.js'
import { examsService } from '../exams/exams.service.js'
import { attendanceService } from '../attendance/attendance.service.js'
import { noticesService } from '../notices/notices.service.js'
import type { FeeStatement } from './portal.types.js'

// Pure aggregation over other modules' services, scoped to the requesting
// guardian's own children — no tables of its own, so no repository layer.
export const portalService = {
  myChildren: (guardianUserId: number) => guardiansService.listStudentsForGuardian(guardianUserId),

  async feeStatement(guardianUserId: number, studentId: number): Promise<FeeStatement> {
    await guardiansService.assertGuardianOfStudent(guardianUserId, studentId)

    const invoices = await feesService.listInvoicesByStudent(studentId)
    const payments = await feesService.listPaymentsByStudent(studentId)

    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)

    return { studentId, totalInvoiced, totalPaid, balance: totalInvoiced - totalPaid, invoices, payments }
  },

  async reportCard(guardianUserId: number, studentId: number, examId: number) {
    await guardiansService.assertGuardianOfStudent(guardianUserId, studentId)
    return examsService.reportCard(examId, studentId)
  },

  async attendance(guardianUserId: number, studentId: number) {
    await guardiansService.assertGuardianOfStudent(guardianUserId, studentId)
    return attendanceService.listByStudent(studentId)
  },

  async notices(guardianUserId: number) {
    const children = await guardiansService.listStudentsForGuardian(guardianUserId)
    const classIds = [...new Set(children.map((c) => c.student.classId))]

    const byId = new Map()
    for (const notice of await noticesService.listForParents()) byId.set(notice.id, notice)
    for (const classId of classIds) {
      for (const notice of await noticesService.listForParents(classId)) byId.set(notice.id, notice)
    }
    return [...byId.values()]
  },
}
