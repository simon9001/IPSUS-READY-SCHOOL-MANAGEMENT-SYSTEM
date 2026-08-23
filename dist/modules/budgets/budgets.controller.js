import { budgetsService } from './budgets.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const budgetsController = {
    list: async (c) => ok(c, await budgetsService.list()),
    getById: async (c) => ok(c, await budgetsService.getById(Number(c.req.param('id')))),
    create: async (c) => created(c, await budgetsService.create(getValidated(c, 'json'))),
    addLine: async (c) => created(c, await budgetsService.addLine(Number(c.req.param('id')), getValidated(c, 'json'))),
    approve: async (c) => {
        const { approvedBy } = getValidated(c, 'json');
        return ok(c, await budgetsService.approve(Number(c.req.param('id')), approvedBy));
    },
    budgetVsActual: async (c) => ok(c, await budgetsService.budgetVsActual(Number(c.req.param('id')))),
};
