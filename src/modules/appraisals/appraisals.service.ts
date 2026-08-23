import { appraisalsRepository } from './appraisals.repository.js'
import { NotFoundError } from '../../common/errors.js'
import type { CreateAppraisalInput, UpdateAppraisalInput } from './appraisals.schema.js'

export const appraisalsService = {
  listByStaff: (staffId: number) => appraisalsRepository.findByStaff(staffId),

  async getById(id: number) {
    const appraisal = await appraisalsRepository.findById(id)
    if (!appraisal) throw new NotFoundError(`Appraisal ${id} not found`)
    return appraisal
  },

  create: (input: CreateAppraisalInput) =>
    appraisalsRepository.create({ ...input, overallRating: input.overallRating !== undefined ? String(input.overallRating) : undefined }),

  async update(id: number, input: UpdateAppraisalInput) {
    await this.getById(id)
    return appraisalsRepository.update(id, { ...input, overallRating: input.overallRating !== undefined ? String(input.overallRating) : undefined })
  },
}
