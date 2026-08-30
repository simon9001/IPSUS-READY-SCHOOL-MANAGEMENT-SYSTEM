import { Hono } from 'hono';
import { zValidator } from '../../common/validate.js';
import { requireAuth, requirePermission } from '../../common/auth.js';
import { accountsController } from './accounts.controller.js';
import { createAccountSchema, updateAccountSchema } from './accounts.schema.js';
export const accountsRoutes = new Hono();
// The chart of accounts is cross-module reference data (Assets, Inventory,
// Budgets, Payroll, Procurement all need it to populate account pickers when
// posting their own permitted transactions) — not exclusive to the ledger
// module, so any authenticated staff member can view it. Same reasoning as
// periods.routes.ts. Only 'ledger.accounts.manage' can create/edit accounts.
accountsRoutes.get('/', requireAuth(), accountsController.list);
accountsRoutes.get('/:id', requireAuth(), accountsController.getById);
accountsRoutes.post('/', requirePermission('ledger.accounts.manage'), zValidator('json', createAccountSchema), accountsController.create);
accountsRoutes.patch('/:id', requirePermission('ledger.accounts.manage'), zValidator('json', updateAccountSchema), accountsController.update);
accountsRoutes.post('/:id/deactivate', requirePermission('ledger.accounts.manage'), accountsController.deactivate);
