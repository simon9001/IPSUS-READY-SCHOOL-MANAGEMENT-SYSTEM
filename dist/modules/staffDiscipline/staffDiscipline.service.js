import { staffDisciplineRepository } from './staffDiscipline.repository.js';
import { NotFoundError } from '../../common/errors.js';
export const staffDisciplineService = {
    listRecent: (limit) => staffDisciplineRepository.findRecent(limit),
    listByStaff: (staffId) => staffDisciplineRepository.findByStaff(staffId),
    async getById(id) {
        const record = await staffDisciplineRepository.findById(id);
        if (!record)
            throw new NotFoundError(`Staff disciplinary record ${id} not found`);
        return record;
    },
    create: (input) => staffDisciplineRepository.create(input),
};
