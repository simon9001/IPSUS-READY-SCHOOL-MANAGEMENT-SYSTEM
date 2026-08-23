import { appraisalsRepository } from './appraisals.repository.js';
import { NotFoundError } from '../../common/errors.js';
export const appraisalsService = {
    listByStaff: (staffId) => appraisalsRepository.findByStaff(staffId),
    async getById(id) {
        const appraisal = await appraisalsRepository.findById(id);
        if (!appraisal)
            throw new NotFoundError(`Appraisal ${id} not found`);
        return appraisal;
    },
    create: (input) => appraisalsRepository.create({ ...input, overallRating: input.overallRating !== undefined ? String(input.overallRating) : undefined }),
    async update(id, input) {
        await this.getById(id);
        return appraisalsRepository.update(id, { ...input, overallRating: input.overallRating !== undefined ? String(input.overallRating) : undefined });
    },
};
