import { journalService } from './journal.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const journalController = {
    list: async (c) => ok(c, await journalService.list()),
    getById: async (c) => ok(c, await journalService.getById(Number(c.req.param('id')))),
    createManual: async (c) => created(c, await journalService.createManualEntry(getValidated(c, 'json'))),
    postSystem: async (c) => created(c, await journalService.postSystemEntry(getValidated(c, 'json'))),
    approve: async (c) => {
        const { approverId } = getValidated(c, 'json');
        return ok(c, await journalService.approve(Number(c.req.param('id')), approverId));
    },
    reject: async (c) => {
        const { approverId, reason } = getValidated(c, 'json');
        return ok(c, await journalService.reject(Number(c.req.param('id')), approverId, reason));
    },
    trialBalance: async (c) => {
        const asOfDate = c.req.query('asOfDate') ?? new Date().toISOString().slice(0, 10);
        const fundIdParam = c.req.query('fundId');
        const fundId = fundIdParam ? Number(fundIdParam) : undefined;
        return ok(c, await journalService.trialBalance(asOfDate, fundId));
    },
};
