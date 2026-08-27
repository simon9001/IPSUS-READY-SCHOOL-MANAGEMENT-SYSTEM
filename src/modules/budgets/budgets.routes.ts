import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { budgetsController } from './budgets.controller.js'
import { addBudgetLineSchema, approveBudgetSchema, createBudgetSchema } from './budgets.schema.js'

export const budgetsRoutes = new Hono()

budgetsRoutes.get('/', requirePermission('budget.view'), budgetsController.list)
budgetsRoutes.get('/:id', requirePermission('budget.view'), budgetsController.getById)
budgetsRoutes.get('/:id/budget-vs-actual', requirePermission('budget.view'), budgetsController.budgetVsActual)
budgetsRoutes.post('/', requirePermission('budget.manage'), zValidator('json', createBudgetSchema), budgetsController.create)
budgetsRoutes.post('/:id/lines', requirePermission('budget.manage'), zValidator('json', addBudgetLineSchema), budgetsController.addLine)
budgetsRoutes.post('/:id/approve', requirePermission('budget.approve'), zValidator('json', approveBudgetSchema), budgetsController.approve)
