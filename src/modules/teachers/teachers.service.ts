import { teachersRepository } from './teachers.repository.js'
import { ConflictError, NotFoundError } from '../../common/errors.js'
import { recordAudit } from '../../common/audit.js'
import { foreignKeyBlocker, humanizeTable } from '../../common/deleteBlock.js'
import type { CreateTeacherInput, UpdateTeacherInput } from './teachers.schema.js'

export const teachersService = {
  list: () => teachersRepository.findAll(),

  async getById(id: number) {
    const teacher = await teachersRepository.findById(id)
    if (!teacher) throw new NotFoundError(`Teacher ${id} not found`)
    return teacher
  },

  async create(input: CreateTeacherInput, actorUserId: number) {
    const existing = await teachersRepository.findByStaffNo(input.staffNo)
    if (existing) throw new ConflictError(`Staff number ${input.staffNo} already exists`)
    const created = await teachersRepository.create(input)
    await recordAudit({ userId: actorUserId, action: 'teacher.create', entityType: 'teacher', entityId: created.id, afterData: created })
    return created
  },

  /** Deactivating a teacher is a status change to 'left'; the before/after
   *  data records it like any other edit. */
  async update(id: number, input: UpdateTeacherInput, actorUserId: number) {
    const before = await this.getById(id)
    const updated = await teachersRepository.update(id, input)
    await recordAudit({ userId: actorUserId, action: 'teacher.update', entityType: 'teacher', entityId: id, beforeData: before, afterData: updated })
    return updated
  },

  /** Deletes a teacher who has no history. Subject assignments, timetable
   *  entries and staff-registry links are all restrict-on-delete, so Postgres
   *  refuses while any exist; such a teacher should be set to 'left' instead. */
  async remove(id: number, actorUserId: number) {
    const before = await this.getById(id)
    try {
      await teachersRepository.remove(id)
    } catch (err) {
      const blocker = foreignKeyBlocker(err)
      if (!blocker) throw err
      throw new ConflictError(
        `Cannot delete ${before.fullName}: they have records in ${humanizeTable(blocker)}, which must be kept. Set their status to Left instead.`,
      )
    }
    await recordAudit({ userId: actorUserId, action: 'teacher.delete', entityType: 'teacher', entityId: id, beforeData: before })
    return { id }
  },
}
