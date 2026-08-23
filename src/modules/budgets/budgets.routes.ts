import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { budgetsController } from './budgets.controller.js'
import { addBudgetLineSchema, approveBudgetSchema, createBudgetSchema } from './budgets.schema.js'

export const budgetsRoutes = new Hono()

budgetsRoutes.get('/', budgetsController.list)
budgetsRoutes.get('/:id', budgetsController.getById)
budgetsRoutes.get('/:id/budget-vs-actual', budgetsController.budgetVsActual)
budgetsRoutes.post('/', zValidator('json', createBudgetSchema), budgetsController.create)
budgetsRoutes.post('/:id/lines', zValidator('json', addBudgetLineSchema), budgetsController.addLine)
budgetsRoutes.post('/:id/approve', zValidator('json', approveBudgetSchema), budgetsController.approve)
