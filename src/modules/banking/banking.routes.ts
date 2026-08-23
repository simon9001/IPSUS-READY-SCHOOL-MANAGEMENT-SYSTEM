import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { bankingController } from './banking.controller.js'
import {
  createBankAccountSchema,
  createReconciliationSchema,
  issueImprestSchema,
  reconcileSchema,
  retireImprestSchema,
} from './banking.schema.js'

export const bankingRoutes = new Hono()

bankingRoutes.get('/accounts', bankingController.listAccounts)
bankingRoutes.get('/accounts/:id', bankingController.getAccountById)
bankingRoutes.post('/accounts', zValidator('json', createBankAccountSchema), bankingController.createAccount)

bankingRoutes.get('/accounts/:bankAccountId/reconciliations', bankingController.listReconciliations)
bankingRoutes.post('/reconciliations', zValidator('json', createReconciliationSchema), bankingController.createReconciliation)
bankingRoutes.post('/reconciliations/:id/reconcile', zValidator('json', reconcileSchema), bankingController.markReconciled)

bankingRoutes.get('/imprest', bankingController.listImprestRequests)
bankingRoutes.get('/imprest/:id', bankingController.getImprestRequestById)
bankingRoutes.post('/imprest', zValidator('json', issueImprestSchema), bankingController.issueImprest)
bankingRoutes.post('/imprest/:id/retire', zValidator('json', retireImprestSchema), bankingController.retireImprest)
