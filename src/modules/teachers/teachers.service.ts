import { teachersRepository } from './teachers.repository.js'
import { ConflictError, NotFoundError } from '../../common/errors.js'
import type { CreateTeacherInput, UpdateTeacherInput } from './teachers.schema.js'

export const teachersService = {
  list: () => teachersRepository.findAll(),

  async getById(id: number) {
    const teacher = await teachersRepository.findById(id)
    if (!teacher) throw new NotFoundError(`Teacher ${id} not found`)
    return teacher
  },

  async create(input: CreateTeacherInput) {
    const existing = await teachersRepository.findByStaffNo(input.staffNo)
    if (existing) throw new ConflictError(`Staff number ${input.staffNo} already exists`)
    return teachersRepository.create(input)
  },

  async update(id: number, input: UpdateTeacherInput) {
    await this.getById(id)
    return teachersRepository.update(id, input)
  },
}
