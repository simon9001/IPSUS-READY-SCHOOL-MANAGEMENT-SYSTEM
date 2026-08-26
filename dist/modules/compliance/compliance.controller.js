import { complianceService } from './compliance.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const complianceController = {
    list: async (c) => ok(c, await complianceService.list()),
    getById: async (c) => ok(c, await complianceService.getById(Number(c.req.param('id')))),
    generate: async (c) => created(c, await complianceService.generate(getValidated(c, 'json'))),
    submit: async (c) => {
        const { referenceNumber, submittedBy } = getValidated(c, 'json');
        return ok(c, await complianceService.submit(Number(c.req.param('id')), referenceNumber, submittedBy));
    },
};
