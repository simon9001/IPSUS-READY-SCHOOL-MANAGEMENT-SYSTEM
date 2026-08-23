import { subjectsRepository } from './subjects.repository.js'
import { ConflictError, NotFoundError } from '../../common/errors.js'
import type { AssignTeacherInput, CreateSubjectInput, OfferSubjectToClassInput } from './subjects.schema.js'

export const subjectsService = {
  list: () => subjectsRepository.findAll(),

  async getById(id: number) {
    const subject = await subjectsRepository.findById(id)
    if (!subject) throw new NotFoundError(`Subject ${id} not found`)
    return subject
  },

  async create(input: CreateSubjectInput) {
    const existing = await subjectsRepository.findByCode(input.code)
    if (existing) throw new ConflictError(`Subject code ${input.code} already exists`)
    return subjectsRepository.create(input)
  },

  listOfferingsByClass: (classId: number) => subjectsRepository.findOfferingsByClass(classId),

  async offerToClass(input: OfferSubjectToClassInput) {
    const existing = await subjectsRepository.findOffering(input.classId, input.subjectId)
    if (existing) throw new ConflictError('This subject is already offered to this class')
    return subjectsRepository.offerToClass(input)
  },

  listAssignments: (classId: number, periodId: number) => subjectsRepository.findAssignments(classId, periodId),

  assignTeacher: (input: AssignTeacherInput) => subjectsRepository.assignTeacher(input),
}
