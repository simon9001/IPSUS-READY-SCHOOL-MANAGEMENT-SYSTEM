import { studentsRepository } from './students.repository.js'
import { ConflictError, NotFoundError } from '../../common/errors.js'
import type { CreateClassInput, CreateStreamInput, CreateStudentInput, UpdateStudentInput } from './students.schema.js'

export const studentsService = {
  listClasses: () => studentsRepository.findAllClasses(),
  createClass: (input: CreateClassInput) => studentsRepository.createClass(input),

  listStreams: (classId: number) => studentsRepository.findStreamsByClass(classId),
  createStream: (input: CreateStreamInput) => studentsRepository.createStream(input),

  list: () => studentsRepository.findAll(),
  listByClass: (classId: number) => studentsRepository.findByClass(classId),

  async getById(id: number) {
    const student = await studentsRepository.findById(id)
    if (!student) throw new NotFoundError(`Student ${id} not found`)
    return student
  },

  async create(input: CreateStudentInput) {
    const existing = await studentsRepository.findByAdmissionNo(input.admissionNo)
    if (existing) throw new ConflictError(`Admission number ${input.admissionNo} already exists`)
    return studentsRepository.create(input)
  },

  async update(id: number, input: UpdateStudentInput) {
    await this.getById(id)
    return studentsRepository.update(id, input)
  },
}
