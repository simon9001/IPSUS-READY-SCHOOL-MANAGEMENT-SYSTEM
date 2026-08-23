import { payrollService } from './payroll.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const payrollController = {
    listEmployees: async (c) => ok(c, await payrollService.listEmployees()),
    getEmployeeById: async (c) => ok(c, await payrollService.getEmployeeById(Number(c.req.param('id')))),
    createEmployee: async (c) => created(c, await payrollService.createEmployee(getValidated(c, 'json'))),
    listSalaryComponents: async (c) => ok(c, await payrollService.listSalaryComponents(Number(c.req.param('employeeId')))),
    addSalaryComponent: async (c) => created(c, await payrollService.addSalaryComponent(Number(c.req.param('employeeId')), getValidated(c, 'json'))),
    listRuns: async (c) => ok(c, await payrollService.listRuns()),
    getRunById: async (c) => ok(c, await payrollService.getRunById(Number(c.req.param('id')))),
    createRun: async (c) => created(c, await payrollService.createRun(getValidated(c, 'json'))),
    processRun: async (c) => created(c, await payrollService.processRun(Number(c.req.param('id')), getValidated(c, 'json'))),
};
