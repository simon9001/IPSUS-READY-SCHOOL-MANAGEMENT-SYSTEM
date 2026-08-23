import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { payrollController } from './payroll.controller.js'
import {
  addSalaryComponentSchema,
  createEmployeeSchema,
  createPayrollRunSchema,
  processPayrollRunSchema,
} from './payroll.schema.js'

export const payrollRoutes = new Hono()

payrollRoutes.get('/employees', payrollController.listEmployees)
payrollRoutes.get('/employees/:id', payrollController.getEmployeeById)
payrollRoutes.post('/employees', zValidator('json', createEmployeeSchema), payrollController.createEmployee)

payrollRoutes.get('/employees/:employeeId/components', payrollController.listSalaryComponents)
payrollRoutes.post(
  '/employees/:employeeId/components',
  zValidator('json', addSalaryComponentSchema),
  payrollController.addSalaryComponent,
)

payrollRoutes.get('/runs', payrollController.listRuns)
payrollRoutes.get('/runs/:id', payrollController.getRunById)
payrollRoutes.post('/runs', zValidator('json', createPayrollRunSchema), payrollController.createRun)
payrollRoutes.post('/runs/:id/process', zValidator('json', processPayrollRunSchema), payrollController.processRun)
