import { promotionsRepository } from './promotions.repository.js';
import { studentsRepository } from '../students/students.repository.js';
import { NotFoundError, ValidationError } from '../../common/errors.js';
export const promotionsService = {
    listByStudent: (studentId) => promotionsRepository.findByStudent(studentId),
    async record(input) {
        const student = await studentsRepository.findById(input.studentId);
        if (!student)
            throw new NotFoundError(`Student ${input.studentId} not found`);
        if (input.outcome === 'promoted' && !input.toClassId) {
            throw new ValidationError('toClassId is required when outcome is "promoted"');
        }
        const promotion = await promotionsRepository.create(input);
        if (input.outcome === 'promoted' && input.toClassId) {
            await studentsRepository.update(input.studentId, { classId: input.toClassId, streamId: null });
        }
        else if (input.outcome === 'transferred' || input.outcome === 'graduated' || input.outcome === 'withdrawn') {
            await studentsRepository.update(input.studentId, { status: input.outcome });
        }
        return promotion;
    },
};
