import type { Context } from 'hono'
import { payrollService } from './payroll.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type {
  AddSalaryComponentInput,
  CreateEmployeeInput,
  CreatePayrollRunInput,
  ProcessPayrollRunInput,
} from './payroll.schema.js'

export const payrollController = {
  listEmployees: async (c: Context) => ok(c, await payrollService.listEmployees()),
  getEmployeeById: async (c: Context) => ok(c, await payrollService.getEmployeeById(Number(c.req.param('id')))),
  createEmployee: async (c: Context) =>
    created(c, await payrollService.createEmployee(getValidated<CreateEmployeeInput>(c, 'json'))),

  listSalaryComponents: async (c: Context) =>
    ok(c, await payrollService.listSalaryComponents(Number(c.req.param('employeeId')))),
  addSalaryComponent: async (c: Context) =>
    created(
      c,
      await payrollService.addSalaryComponent(Number(c.req.param('employeeId')), getValidated<AddSalaryComponentInput>(c, 'json')),
    ),

  listRuns: async (c: Context) => ok(c, await payrollService.listRuns()),
  getRunById: async (c: Context) => ok(c, await payrollService.getRunById(Number(c.req.param('id')))),
  createRun: async (c: Context) =>
    created(c, await payrollService.createRun(getValidated<CreatePayrollRunInput>(c, 'json'))),
  processRun: async (c: Context) =>
    created(c, await payrollService.processRun(Number(c.req.param('id')), getValidated<ProcessPayrollRunInput>(c, 'json'))),
}
