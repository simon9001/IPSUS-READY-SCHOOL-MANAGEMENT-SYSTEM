import { accountsRepository } from './accounts.repository.js';
import { NotFoundError, ConflictError } from '../../common/errors.js';
export const accountsService = {
    list: () => accountsRepository.findAll(),
    async getById(id) {
        const account = await accountsRepository.findById(id);
        if (!account)
            throw new NotFoundError(`Account ${id} not found`);
        return account;
    },
    async create(input) {
        const existing = await accountsRepository.findByCode(input.code);
        if (existing)
            throw new ConflictError(`Account code ${input.code} already exists`);
        return accountsRepository.create(input);
    },
    async update(id, input) {
        await this.getById(id);
        return accountsRepository.update(id, input);
    },
    async deactivate(id) {
        await this.getById(id);
        return accountsRepository.deactivate(id);
    },
};
