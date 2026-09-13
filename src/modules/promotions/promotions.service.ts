import { promotionsRepository } from './promotions.repository.js'
import { studentsRepository } from '../students/students.repository.js'
import { NotFoundError, ValidationError } from '../../common/errors.js'
import { recordAudit } from '../../common/audit.js'
import type { RecordPromotionInput } from './promotions.schema.js'

export const promotionsService = {
  listByStudent: (studentId: number) => promotionsRepository.findByStudent(studentId),

  async record(input: RecordPromotionInput, actorUserId: number) {
    const student = await studentsRepository.findById(input.studentId)
    if (!student) throw new NotFoundError(`Student ${input.studentId} not found`)

    if (input.outcome === 'promoted' && !input.toClassId) {
      throw new ValidationError('toClassId is required when outcome is "promoted"')
    }

    const promotion = await promotionsRepository.create(input)

    if (input.outcome === 'promoted' && input.toClassId) {
      await studentsRepository.update(input.studentId, { classId: input.toClassId, streamId: null })
    } else if (input.outcome === 'transferred' || input.outcome === 'graduated' || input.outcome === 'withdrawn') {
      await studentsRepository.update(input.studentId, { status: input.outcome })
    }

    // Before-data is the student's placement at the moment of the decision, so
    // the log shows exactly which class/status the promotion moved them from.
    await recordAudit({
      userId: actorUserId,
      action: 'student.promotion',
      entityType: 'student',
      entityId: input.studentId,
      beforeData: { classId: student.classId, streamId: student.streamId, status: student.status },
      afterData: promotion,
    })

    return promotion
  },
}
