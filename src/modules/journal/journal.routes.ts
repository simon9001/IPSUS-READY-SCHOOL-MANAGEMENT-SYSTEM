import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { journalController } from './journal.controller.js'
import { approveJournalEntrySchema, createJournalEntrySchema, rejectJournalEntrySchema } from './journal.schema.js'

export const journalRoutes = new Hono()

journalRoutes.get('/', requirePermission('ledger.journal.view'), journalController.list)
journalRoutes.get('/:id', requirePermission('ledger.journal.view'), journalController.getById)
// Manual entries require approval before posting (maker-checker).
journalRoutes.post(
  '/',
  requirePermission('ledger.journal.create'),
  zValidator('json', createJournalEntrySchema),
  journalController.createManual,
)
// Posts immediately, skipping approval. Other modules call the service directly
// and never come through here, so this route needs the approver's permission:
// with only the creator's, it would be a way around maker-checker.
journalRoutes.post(
  '/system',
  requirePermission('ledger.journal.approve'),
  zValidator('json', createJournalEntrySchema),
  journalController.postSystem,
)
journalRoutes.post(
  '/:id/approve',
  requirePermission('ledger.journal.approve'),
  zValidator('json', approveJournalEntrySchema),
  journalController.approve,
)
journalRoutes.post(
  '/:id/reject',
  requirePermission('ledger.journal.approve'),
  zValidator('json', rejectJournalEntrySchema),
  journalController.reject,
)

export const reportsRoutes = new Hono()
reportsRoutes.get('/trial-balance', requirePermission('ledger.journal.view'), journalController.trialBalance)
