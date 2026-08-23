import { fundsRepository } from './funds.repository.js';
import { NotFoundError, ConflictError } from '../../common/errors.js';
export const fundsService = {
    list: () => fundsRepository.findAll(),
    async getById(id) {
        const fund = await fundsRepository.findById(id);
        if (!fund)
            throw new NotFoundError(`Fund ${id} not found`);
        return fund;
    },
    async create(input) {
        const existing = await fundsRepository.findByCode(input.code);
        if (existing)
            throw new ConflictError(`Fund code ${input.code} already exists`);
        return fundsRepository.create(input);
    },
    async update(id, input) {
        await this.getById(id);
        return fundsRepository.update(id, input);
    },
    async deactivate(id) {
        await this.getById(id);
        return fundsRepository.deactivate(id);
    },
};
