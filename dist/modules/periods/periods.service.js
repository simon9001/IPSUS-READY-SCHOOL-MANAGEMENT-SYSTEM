import { periodsRepository } from './periods.repository.js';
import { NotFoundError, ConflictError } from '../../common/errors.js';
export const periodsService = {
    list: () => periodsRepository.findAll(),
    async getById(id) {
        const period = await periodsRepository.findById(id);
        if (!period)
            throw new NotFoundError(`Fiscal period ${id} not found`);
        return period;
    },
    create: (input) => periodsRepository.create(input),
    async update(id, input) {
        const period = await this.getById(id);
        if (period.status === 'closed')
            throw new ConflictError(`Period ${id} is closed and cannot be edited`);
        return periodsRepository.update(id, input);
    },
    async close(id) {
        const period = await this.getById(id);
        if (period.status === 'closed')
            throw new ConflictError(`Period ${id} is already closed`);
        return periodsRepository.close(id);
    },
};
