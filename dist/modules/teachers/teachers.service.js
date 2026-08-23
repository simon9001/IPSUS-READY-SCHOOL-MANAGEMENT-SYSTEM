import { teachersRepository } from './teachers.repository.js';
import { ConflictError, NotFoundError } from '../../common/errors.js';
export const teachersService = {
    list: () => teachersRepository.findAll(),
    async getById(id) {
        const teacher = await teachersRepository.findById(id);
        if (!teacher)
            throw new NotFoundError(`Teacher ${id} not found`);
        return teacher;
    },
    async create(input) {
        const existing = await teachersRepository.findByStaffNo(input.staffNo);
        if (existing)
            throw new ConflictError(`Staff number ${input.staffNo} already exists`);
        return teachersRepository.create(input);
    },
    async update(id, input) {
        await this.getById(id);
        return teachersRepository.update(id, input);
    },
};
