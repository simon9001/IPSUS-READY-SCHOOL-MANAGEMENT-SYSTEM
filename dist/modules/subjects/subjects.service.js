import { subjectsRepository } from './subjects.repository.js';
import { ConflictError, NotFoundError } from '../../common/errors.js';
export const subjectsService = {
    list: () => subjectsRepository.findAll(),
    async getById(id) {
        const subject = await subjectsRepository.findById(id);
        if (!subject)
            throw new NotFoundError(`Subject ${id} not found`);
        return subject;
    },
    async create(input) {
        const existing = await subjectsRepository.findByCode(input.code);
        if (existing)
            throw new ConflictError(`Subject code ${input.code} already exists`);
        return subjectsRepository.create(input);
    },
    listStrands: (subjectId) => subjectsRepository.findStrandsBySubject(subjectId),
    async createStrand(input) {
        await this.getById(input.subjectId);
        const existing = await subjectsRepository.findStrandByName(input.subjectId, input.name);
        if (existing)
            throw new ConflictError(`Strand "${input.name}" already exists for this subject`);
        return subjectsRepository.createStrand(input);
    },
    listOfferingsByClass: (classId) => subjectsRepository.findOfferingsByClass(classId),
    async offerToClass(input) {
        const existing = await subjectsRepository.findOffering(input.classId, input.subjectId);
        if (existing)
            throw new ConflictError('This subject is already offered to this class');
        return subjectsRepository.offerToClass(input);
    },
    listAssignments: (classId, periodId) => subjectsRepository.findAssignments(classId, periodId),
    assignTeacher: (input) => subjectsRepository.assignTeacher(input),
};
