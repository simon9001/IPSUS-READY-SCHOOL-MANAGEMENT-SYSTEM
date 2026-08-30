import { contractsRepository } from './contracts.repository.js'
import { NotFoundError } from '../../common/errors.js'
import type { CreateContractInput, UpdateContractStatusInput } from './contracts.schema.js'

export const contractsService = {
  list: () => contractsRepository.findAll(),
  listByStaff: (staffId: number) => contractsRepository.findByStaff(staffId),

  async getById(id: number) {
    const contract = await contractsRepository.findById(id)
    if (!contract) throw new NotFoundError(`Contract ${id} not found`)
    return contract
  },

  create: (input: CreateContractInput) => contractsRepository.create({ ...input, status: 'active' }),

  async updateStatus(id: number, input: UpdateContractStatusInput) {
    await this.getById(id)
    return contractsRepository.updateStatus(id, input.status)
  },
}
