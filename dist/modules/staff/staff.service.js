import { staffRepository } from './staff.repository.js';
import { ConflictError, NotFoundError } from '../../common/errors.js';
export const staffService = {
    list: () => staffRepository.findAll(),
    async getById(id) {
        const record = await staffRepository.findById(id);
        if (!record)
            throw new NotFoundError(`Staff ${id} not found`);
        return record;
    },
    async create(input) {
        const existing = await staffRepository.findByStaffNo(input.staffNo);
        if (existing)
            throw new ConflictError(`Staff number ${input.staffNo} already exists`);
        return staffRepository.create(input);
    },
    async update(id, input) {
        await this.getById(id);
        return staffRepository.update(id, input);
    },
};
