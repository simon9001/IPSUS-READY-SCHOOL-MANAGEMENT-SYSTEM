import { noticesRepository } from './notices.repository.js'
import { NotFoundError, ValidationError } from '../../common/errors.js'
import type { CreateNoticeInput } from './notices.schema.js'

export const noticesService = {
  list: () => noticesRepository.findAll(),

  async getById(id: number) {
    const notice = await noticesRepository.findById(id)
    if (!notice) throw new NotFoundError(`Notice ${id} not found`)
    return notice
  },

  create(input: CreateNoticeInput) {
    if (input.audience === 'class' && !input.classId) {
      throw new ValidationError('classId is required when audience is "class"')
    }
    const { publishNow, ...notice } = input
    return noticesRepository.create({ ...notice, publishedAt: publishNow ? new Date() : undefined })
  },

  listForParents: (classId?: number) => noticesRepository.findPublishedForAudience('parents', new Date().toISOString().slice(0, 10), classId),
  listForStaff: () => noticesRepository.findPublishedForAudience('staff', new Date().toISOString().slice(0, 10)),
}
