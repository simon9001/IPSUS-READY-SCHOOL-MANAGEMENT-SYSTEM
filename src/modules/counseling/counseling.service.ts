import { counselingRepository } from './counseling.repository.js'
import { NotFoundError } from '../../common/errors.js'
import type { CreateCounselingSessionInput } from './counseling.schema.js'

export const counselingService = {
  listByStudent: (studentId: number) => counselingRepository.findByStudent(studentId),

  async getById(id: number) {
    const session = await counselingRepository.findById(id)
    if (!session) throw new NotFoundError(`Counseling session ${id} not found`)
    return session
  },

  create: (input: CreateCounselingSessionInput) => counselingRepository.create(input),
}
