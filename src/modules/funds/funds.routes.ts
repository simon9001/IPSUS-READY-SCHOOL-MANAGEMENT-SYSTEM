import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requireAuth, requirePermission } from '../../common/auth.js'
import { fundsController } from './funds.controller.js'
import { createFundSchema, updateFundSchema } from './funds.schema.js'

export const fundsRoutes = new Hono()

// Funds are cross-module reference data (Assets, Inventory, Budgets, Payroll,
// Procurement all need them to populate fund pickers when posting their own
// permitted transactions) — not exclusive to the ledger module, so any
// authenticated staff member can view them. Same reasoning as
// periods.routes.ts. Only 'ledger.funds.manage' can create/edit funds.
fundsRoutes.get('/', requireAuth(), fundsController.list)
fundsRoutes.get('/:id', requireAuth(), fundsController.getById)
fundsRoutes.post('/', requirePermission('ledger.funds.manage'), zValidator('json', createFundSchema), fundsController.create)
fundsRoutes.patch('/:id', requirePermission('ledger.funds.manage'), zValidator('json', updateFundSchema), fundsController.update)
fundsRoutes.post('/:id/deactivate', requirePermission('ledger.funds.manage'), fundsController.deactivate)
