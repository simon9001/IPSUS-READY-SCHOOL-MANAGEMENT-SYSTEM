import { staffDisciplineRepository } from './staffDiscipline.repository.js'
import { NotFoundError } from '../../common/errors.js'
import type { CreateStaffDisciplineRecordInput } from './staffDiscipline.schema.js'

export const staffDisciplineService = {
  listByStaff: (staffId: number) => staffDisciplineRepository.findByStaff(staffId),

  async getById(id: number) {
    const record = await staffDisciplineRepository.findById(id)
    if (!record) throw new NotFoundError(`Staff disciplinary record ${id} not found`)
    return record
  },

  create: (input: CreateStaffDisciplineRecordInput) => staffDisciplineRepository.create(input),
}
