import { counselingRepository } from './counseling.repository.js';
import { NotFoundError } from '../../common/errors.js';
export const counselingService = {
    listByStudent: (studentId) => counselingRepository.findByStudent(studentId),
    async getById(id) {
        const session = await counselingRepository.findById(id);
        if (!session)
            throw new NotFoundError(`Counseling session ${id} not found`);
        return session;
    },
    create: (input) => counselingRepository.create(input),
};
