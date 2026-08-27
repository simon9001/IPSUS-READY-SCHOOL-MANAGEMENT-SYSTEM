import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { journalController } from './journal.controller.js'
import { approveJournalEntrySchema, createJournalEntrySchema, rejectJournalEntrySchema } from './journal.schema.js'

export const journalRoutes = new Hono()

journalRoutes.get('/', requirePermission('ledger.journal.view'), journalController.list)
journalRoutes.get('/:id', requirePermission('ledger.journal.view'), journalController.getById)
// Manual entries require approval before posting (maker-checker).
journalRoutes.post('/', requirePermission('ledger.journal.create'), zValidator('json', createJournalEntrySchema), journalController.createManual)
// System modules (fees, payroll, procurement, assets, grants) post directly.
journalRoutes.post('/system', requirePermission('ledger.journal.create'), zValidator('json', createJournalEntrySchema), journalController.postSystem)
journalRoutes.post('/:id/approve', requirePermission('ledger.journal.approve'), zValidator('json', approveJournalEntrySchema), journalController.approve)
journalRoutes.post('/:id/reject', requirePermission('ledger.journal.approve'), zValidator('json', rejectJournalEntrySchema), journalController.reject)

export const reportsRoutes = new Hono()
reportsRoutes.get('/trial-balance', requirePermission('ledger.journal.view'), journalController.trialBalance)
