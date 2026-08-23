import type { Context } from 'hono'
import { bankingService } from './banking.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type {
  CreateBankAccountInput,
  CreateReconciliationInput,
  IssueImprestInput,
  ReconcileInput,
  RetireImprestInput,
} from './banking.schema.js'

export const bankingController = {
  listAccounts: async (c: Context) => ok(c, await bankingService.listAccounts()),
  getAccountById: async (c: Context) => ok(c, await bankingService.getAccountById(Number(c.req.param('id')))),
  createAccount: async (c: Context) =>
    created(c, await bankingService.createAccount(getValidated<CreateBankAccountInput>(c, 'json'))),

  listReconciliations: async (c: Context) =>
    ok(c, await bankingService.listReconciliations(Number(c.req.param('bankAccountId')))),
  createReconciliation: async (c: Context) =>
    created(c, await bankingService.createReconciliation(getValidated<CreateReconciliationInput>(c, 'json'))),
  markReconciled: async (c: Context) => {
    const { reconciledBy } = getValidated<ReconcileInput>(c, 'json')
    return ok(c, await bankingService.markReconciled(Number(c.req.param('id')), reconciledBy))
  },

  listImprestRequests: async (c: Context) => ok(c, await bankingService.listImprestRequests()),
  getImprestRequestById: async (c: Context) =>
    ok(c, await bankingService.getImprestRequestById(Number(c.req.param('id')))),
  issueImprest: async (c: Context) =>
    created(c, await bankingService.issueImprest(getValidated<IssueImprestInput>(c, 'json'))),
  retireImprest: async (c: Context) =>
    created(
      c,
      await bankingService.retireImprest(Number(c.req.param('id')), getValidated<RetireImprestInput>(c, 'json')),
    ),
}
