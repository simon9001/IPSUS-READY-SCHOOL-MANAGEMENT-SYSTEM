import { contractsService } from './contracts.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const contractsController = {
    listByStaff: async (c) => ok(c, await contractsService.listByStaff(Number(c.req.param('staffId')))),
    getById: async (c) => ok(c, await contractsService.getById(Number(c.req.param('id')))),
    create: async (c) => created(c, await contractsService.create(getValidated(c, 'json'))),
    updateStatus: async (c) => ok(c, await contractsService.updateStatus(Number(c.req.param('id')), getValidated(c, 'json'))),
};
