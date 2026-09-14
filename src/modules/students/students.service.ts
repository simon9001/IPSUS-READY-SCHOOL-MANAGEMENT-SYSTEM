import { studentsRepository } from './students.repository.js'
import { ConflictError, NotFoundError } from '../../common/errors.js'
import { broadcastChange } from '../../common/events.js'
import { recordAudit } from '../../common/audit.js'
import { foreignKeyBlocker, humanizeTable } from '../../common/deleteBlock.js'
import type { CreateClassInput, CreateStreamInput, CreateStudentInput, UpdateStudentInput } from './students.schema.js'

export const studentsService = {
  listClasses: () => studentsRepository.findAllClasses(),
  createClass: async (input: CreateClassInput, actorUserId: number) => {
    const created = await studentsRepository.createClass(input)
    await recordAudit({ userId: actorUserId, action: 'class.create', entityType: 'class', entityId: created.id, afterData: created })
    broadcastChange('students', 'class_created')
    broadcastChange('dashboard', 'updated')
    return created
  },

  listStreams: (classId: number) => studentsRepository.findStreamsByClass(classId),
  createStream: async (input: CreateStreamInput, actorUserId: number) => {
    const created = await studentsRepository.createStream(input)
    await recordAudit({ userId: actorUserId, action: 'stream.create', entityType: 'stream', entityId: created.id, afterData: created })
    broadcastChange('students', 'stream_created')
    return created
  },

  list: () => studentsRepository.findAll(),
  listByClass: (classId: number) => studentsRepository.findByClass(classId),

  async getById(id: number) {
    const student = await studentsRepository.findById(id)
    if (!student) throw new NotFoundError(`Student ${id} not found`)
    return student
  },

  async create(input: CreateStudentInput, actorUserId: number) {
    const existing = await studentsRepository.findByAdmissionNo(input.admissionNo)
    if (existing) throw new ConflictError(`Admission number ${input.admissionNo} already exists`)
    const created = await studentsRepository.create(input)
    await recordAudit({ userId: actorUserId, action: 'student.create', entityType: 'student', entityId: created.id, afterData: created })
    broadcastChange('students', 'created')
    broadcastChange('dashboard', 'updated')
    return created
  },

  async update(id: number, input: UpdateStudentInput, actorUserId: number) {
    const before = await this.getById(id)
    // The edit form lets an admission number be corrected, so guard its
    // uniqueness here as create does; otherwise a clash surfaces as a raw 500.
    if (input.admissionNo && input.admissionNo !== before.admissionNo) {
      const clash = await studentsRepository.findByAdmissionNo(input.admissionNo)
      if (clash) throw new ConflictError(`Admission number ${input.admissionNo} already exists`)
    }
    const updated = await studentsRepository.update(id, input)
    await recordAudit({ userId: actorUserId, action: 'student.update', entityType: 'student', entityId: id, beforeData: before, afterData: updated })
    broadcastChange('students', 'updated')
    broadcastChange('dashboard', 'updated')
    return updated
  },

  /**
   * Deletes a student with no history. The database decides what counts as
   * history: every table referencing a student is restrict-on-delete, so
   * Postgres refuses while any of them holds a row, including tables added
   * later. The admission that created an enrolled student is the one reference
   * the repository clears first, because that link is not history of its own.
   */
  async remove(id: number, actorUserId: number) {
    const before = await this.getById(id)
    try {
      await studentsRepository.removeWithAdmissionUnlink(id)
    } catch (err) {
      const blocker = foreignKeyBlocker(err)
      if (!blocker) throw err
      throw new ConflictError(
        `Cannot delete ${before.firstName} ${before.lastName}: they have records in ${humanizeTable(blocker)}, which must be kept. Only a student with no history can be deleted.`,
      )
    }
    await recordAudit({ userId: actorUserId, action: 'student.delete', entityType: 'student', entityId: id, beforeData: before })
    broadcastChange('students', 'deleted')
    broadcastChange('dashboard', 'updated')
    return { id }
  },

  countActiveByClass: () => studentsRepository.countActiveByClass(),
}
