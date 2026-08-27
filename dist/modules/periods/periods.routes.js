import { Hono } from 'hono';
import { zValidator } from '../../common/validate.js';
import { requireAuth, requirePermission } from '../../common/auth.js';
import { periodsController } from './periods.controller.js';
import { createPeriodSchema, updatePeriodSchema } from './periods.schema.js';
export const periodsRoutes = new Hono();
// Fiscal terms are cross-module reference data (Fees, Subjects, Exams,
// Admissions enrollment, Budgets, Payroll all read this) — not finance-
// specific, so any authenticated staff member can view them; only the
// Bursar/Registrar-level 'ledger.periods.manage' can open/close a term.
periodsRoutes.get('/', requireAuth(), periodsController.list);
periodsRoutes.get('/:id', requireAuth(), periodsController.getById);
periodsRoutes.post('/', requirePermission('ledger.periods.manage'), zValidator('json', createPeriodSchema), periodsController.create);
periodsRoutes.patch('/:id', requirePermission('ledger.periods.manage'), zValidator('json', updatePeriodSchema), periodsController.update);
periodsRoutes.post('/:id/close', requirePermission('ledger.periods.manage'), periodsController.close);
