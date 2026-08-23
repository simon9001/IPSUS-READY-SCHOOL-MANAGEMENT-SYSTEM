import { leaveService } from './leave.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const leaveController = {
    listTypes: async (c) => ok(c, await leaveService.listTypes()),
    createType: async (c) => created(c, await leaveService.createType(getValidated(c, 'json'))),
    list: async (c) => ok(c, await leaveService.list()),
    listByStaff: async (c) => ok(c, await leaveService.listByStaff(Number(c.req.param('staffId')))),
    getById: async (c) => ok(c, await leaveService.getById(Number(c.req.param('id')))),
    balance: async (c) => ok(c, await leaveService.balance(Number(c.req.param('staffId')), Number(c.req.query('leaveTypeId')), Number(c.req.query('year') ?? new Date().getFullYear()))),
    apply: async (c) => created(c, await leaveService.apply(getValidated(c, 'json'))),
    approve: async (c) => {
        const { approverId } = getValidated(c, 'json');
        return ok(c, await leaveService.approve(Number(c.req.param('id')), approverId));
    },
    reject: async (c) => {
        const { approverId } = getValidated(c, 'json');
        return ok(c, await leaveService.reject(Number(c.req.param('id')), approverId));
    },
};
