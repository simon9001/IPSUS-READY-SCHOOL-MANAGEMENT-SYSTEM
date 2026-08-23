import { accountsRepository } from './accounts.repository.js'
import { NotFoundError, ConflictError } from '../../common/errors.js'
import type { CreateAccountInput, UpdateAccountInput } from './accounts.schema.js'

export const accountsService = {
  list: () => accountsRepository.findAll(),

  async getById(id: number) {
    const account = await accountsRepository.findById(id)
    if (!account) throw new NotFoundError(`Account ${id} not found`)
    return account
  },

  async create(input: CreateAccountInput) {
    const existing = await accountsRepository.findByCode(input.code)
    if (existing) throw new ConflictError(`Account code ${input.code} already exists`)
    return accountsRepository.create(input)
  },

  async update(id: number, input: UpdateAccountInput) {
    await this.getById(id)
    return accountsRepository.update(id, input)
  },

  async deactivate(id: number) {
    await this.getById(id)
    return accountsRepository.deactivate(id)
  },
}
