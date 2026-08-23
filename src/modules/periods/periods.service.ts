import { periodsRepository } from './periods.repository.js'
import { NotFoundError, ConflictError } from '../../common/errors.js'
import type { CreatePeriodInput, UpdatePeriodInput } from './periods.schema.js'

export const periodsService = {
  list: () => periodsRepository.findAll(),

  async getById(id: number) {
    const period = await periodsRepository.findById(id)
    if (!period) throw new NotFoundError(`Fiscal period ${id} not found`)
    return period
  },

  create: (input: CreatePeriodInput) => periodsRepository.create(input),

  async update(id: number, input: UpdatePeriodInput) {
    const period = await this.getById(id)
    if (period.status === 'closed') throw new ConflictError(`Period ${id} is closed and cannot be edited`)
    return periodsRepository.update(id, input)
  },

  async close(id: number) {
    const period = await this.getById(id)
    if (period.status === 'closed') throw new ConflictError(`Period ${id} is already closed`)
    return periodsRepository.close(id)
  },
}
