import { Hono } from 'hono';
import { zValidator } from '../../common/validate.js';
import { journalController } from './journal.controller.js';
import { approveJournalEntrySchema, createJournalEntrySchema, rejectJournalEntrySchema } from './journal.schema.js';
export const journalRoutes = new Hono();
journalRoutes.get('/', journalController.list);
journalRoutes.get('/:id', journalController.getById);
// Manual entries require approval before posting (maker-checker).
journalRoutes.post('/', zValidator('json', createJournalEntrySchema), journalController.createManual);
// System modules (fees, payroll, procurement, assets, grants) post directly.
journalRoutes.post('/system', zValidator('json', createJournalEntrySchema), journalController.postSystem);
journalRoutes.post('/:id/approve', zValidator('json', approveJournalEntrySchema), journalController.approve);
journalRoutes.post('/:id/reject', zValidator('json', rejectJournalEntrySchema), journalController.reject);
export const reportsRoutes = new Hono();
reportsRoutes.get('/trial-balance', journalController.trialBalance);
