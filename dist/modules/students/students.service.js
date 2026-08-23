import { studentsRepository } from './students.repository.js';
import { ConflictError, NotFoundError } from '../../common/errors.js';
export const studentsService = {
    listClasses: () => studentsRepository.findAllClasses(),
    createClass: (input) => studentsRepository.createClass(input),
    listStreams: (classId) => studentsRepository.findStreamsByClass(classId),
    createStream: (input) => studentsRepository.createStream(input),
    list: () => studentsRepository.findAll(),
    listByClass: (classId) => studentsRepository.findByClass(classId),
    async getById(id) {
        const student = await studentsRepository.findById(id);
        if (!student)
            throw new NotFoundError(`Student ${id} not found`);
        return student;
    },
    async create(input) {
        const existing = await studentsRepository.findByAdmissionNo(input.admissionNo);
        if (existing)
            throw new ConflictError(`Admission number ${input.admissionNo} already exists`);
        return studentsRepository.create(input);
    },
    async update(id, input) {
        await this.getById(id);
        return studentsRepository.update(id, input);
    },
};
