import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { payrollController } from './payroll.controller.js'
import {
  addSalaryComponentSchema,
  createEmployeeSchema,
  createPayrollRunSchema,
  processPayrollRunSchema,
} from './payroll.schema.js'

export const payrollRoutes = new Hono()

payrollRoutes.get('/employees', requirePermission('payroll.view'), payrollController.listEmployees)
payrollRoutes.get('/employees/:id', requirePermission('payroll.view'), payrollController.getEmployeeById)
payrollRoutes.post('/employees', requirePermission('payroll.manage'), zValidator('json', createEmployeeSchema), payrollController.createEmployee)

payrollRoutes.get('/employees/:employeeId/components', requirePermission('payroll.view'), payrollController.listSalaryComponents)
payrollRoutes.post(
  '/employees/:employeeId/components',
  requirePermission('payroll.manage'),
  zValidator('json', addSalaryComponentSchema),
  payrollController.addSalaryComponent,
)

payrollRoutes.get('/runs', requirePermission('payroll.view'), payrollController.listRuns)
payrollRoutes.get('/runs/:id', requirePermission('payroll.view'), payrollController.getRunById)
payrollRoutes.post('/runs', requirePermission('payroll.manage'), zValidator('json', createPayrollRunSchema), payrollController.createRun)
payrollRoutes.post('/runs/:id/process', requirePermission('payroll.process'), zValidator('json', processPayrollRunSchema), payrollController.processRun)
