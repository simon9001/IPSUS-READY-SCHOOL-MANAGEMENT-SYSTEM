import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { fundsController } from './funds.controller.js'
import { createFundSchema, updateFundSchema } from './funds.schema.js'

export const fundsRoutes = new Hono()

fundsRoutes.get('/', requirePermission('ledger.journal.view'), fundsController.list)
fundsRoutes.get('/:id', requirePermission('ledger.journal.view'), fundsController.getById)
fundsRoutes.post('/', requirePermission('ledger.funds.manage'), zValidator('json', createFundSchema), fundsController.create)
fundsRoutes.patch('/:id', requirePermission('ledger.funds.manage'), zValidator('json', updateFundSchema), fundsController.update)
fundsRoutes.post('/:id/deactivate', requirePermission('ledger.funds.manage'), fundsController.deactivate)
