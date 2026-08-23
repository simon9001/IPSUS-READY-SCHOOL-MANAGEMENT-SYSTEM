import { grantsService } from './grants.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const grantsController = {
    listTypes: async (c) => ok(c, await grantsService.listTypes()),
    createType: async (c) => created(c, await grantsService.createType(getValidated(c, 'json'))),
    listDisbursements: async (c) => ok(c, await grantsService.listDisbursements()),
    getDisbursementById: async (c) => ok(c, await grantsService.getDisbursementById(Number(c.req.param('id')))),
    recordDisbursement: async (c) => created(c, await grantsService.recordDisbursement(getValidated(c, 'json'))),
};
