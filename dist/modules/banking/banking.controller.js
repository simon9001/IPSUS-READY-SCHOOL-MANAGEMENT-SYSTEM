import { bankingService } from './banking.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const bankingController = {
    listAccounts: async (c) => ok(c, await bankingService.listAccounts()),
    getAccountById: async (c) => ok(c, await bankingService.getAccountById(Number(c.req.param('id')))),
    createAccount: async (c) => created(c, await bankingService.createAccount(getValidated(c, 'json'))),
    listReconciliations: async (c) => ok(c, await bankingService.listReconciliations(Number(c.req.param('bankAccountId')))),
    createReconciliation: async (c) => created(c, await bankingService.createReconciliation(getValidated(c, 'json'))),
    markReconciled: async (c) => {
        const { reconciledBy } = getValidated(c, 'json');
        return ok(c, await bankingService.markReconciled(Number(c.req.param('id')), reconciledBy));
    },
    listImprestRequests: async (c) => ok(c, await bankingService.listImprestRequests()),
    getImprestRequestById: async (c) => ok(c, await bankingService.getImprestRequestById(Number(c.req.param('id')))),
    issueImprest: async (c) => created(c, await bankingService.issueImprest(getValidated(c, 'json'))),
    retireImprest: async (c) => created(c, await bankingService.retireImprest(Number(c.req.param('id')), getValidated(c, 'json'))),
};
