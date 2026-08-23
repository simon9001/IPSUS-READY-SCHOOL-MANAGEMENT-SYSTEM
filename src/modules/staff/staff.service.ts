import { staffRepository } from './staff.repository.js'
import { ConflictError, NotFoundError } from '../../common/errors.js'
import type { CreateStaffInput, UpdateStaffInput } from './staff.schema.js'

export const staffService = {
  list: () => staffRepository.findAll(),

  async getById(id: number) {
    const record = await staffRepository.findById(id)
    if (!record) throw new NotFoundError(`Staff ${id} not found`)
    return record
  },

  async create(input: CreateStaffInput) {
    const existing = await staffRepository.findByStaffNo(input.staffNo)
    if (existing) throw new ConflictError(`Staff number ${input.staffNo} already exists`)
    return staffRepository.create(input)
  },

  async update(id: number, input: UpdateStaffInput) {
    await this.getById(id)
    return staffRepository.update(id, input)
  },
}
