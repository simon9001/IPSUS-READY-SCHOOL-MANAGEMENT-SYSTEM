import { contractsRepository } from './contracts.repository.js';
import { NotFoundError } from '../../common/errors.js';
export const contractsService = {
    listByStaff: (staffId) => contractsRepository.findByStaff(staffId),
    async getById(id) {
        const contract = await contractsRepository.findById(id);
        if (!contract)
            throw new NotFoundError(`Contract ${id} not found`);
        return contract;
    },
    create: (input) => contractsRepository.create({ ...input, status: 'active' }),
    async updateStatus(id, input) {
        await this.getById(id);
        return contractsRepository.updateStatus(id, input.status);
    },
};
