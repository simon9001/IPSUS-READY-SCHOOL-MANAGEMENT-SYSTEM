import { studentsRepository } from './students.repository.js';
import { ConflictError, NotFoundError } from '../../common/errors.js';
import { broadcastChange } from '../../common/events.js';
export const studentsService = {
    listClasses: () => studentsRepository.findAllClasses(),
    createClass: async (input) => {
        const created = await studentsRepository.createClass(input);
        broadcastChange('students', 'class_created');
        broadcastChange('dashboard', 'updated');
        return created;
    },
    listStreams: (classId) => studentsRepository.findStreamsByClass(classId),
    createStream: async (input) => {
        const created = await studentsRepository.createStream(input);
        broadcastChange('students', 'stream_created');
        return created;
    },
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
        const created = await studentsRepository.create(input);
        broadcastChange('students', 'created');
        broadcastChange('dashboard', 'updated');
        return created;
    },
    async update(id, input) {
        await this.getById(id);
        const updated = await studentsRepository.update(id, input);
        broadcastChange('students', 'updated');
        broadcastChange('dashboard', 'updated');
        return updated;
    },
};
