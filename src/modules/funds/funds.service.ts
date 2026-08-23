import { fundsRepository } from './funds.repository.js'
import { NotFoundError, ConflictError } from '../../common/errors.js'
import type { CreateFundInput, UpdateFundInput } from './funds.schema.js'

export const fundsService = {
  list: () => fundsRepository.findAll(),

  async getById(id: number) {
    const fund = await fundsRepository.findById(id)
    if (!fund) throw new NotFoundError(`Fund ${id} not found`)
    return fund
  },

  async create(input: CreateFundInput) {
    const existing = await fundsRepository.findByCode(input.code)
    if (existing) throw new ConflictError(`Fund code ${input.code} already exists`)
    return fundsRepository.create(input)
  },

  async update(id: number, input: UpdateFundInput) {
    await this.getById(id)
    return fundsRepository.update(id, input)
  },

  async deactivate(id: number) {
    await this.getById(id)
    return fundsRepository.deactivate(id)
  },
}
