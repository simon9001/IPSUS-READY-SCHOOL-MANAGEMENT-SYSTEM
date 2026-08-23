import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { employees, payrollRuns, payslips, salaryComponents } from '../../db/schema/index.js';
export const payrollRepository = {
    findAllEmployees: () => db.select().from(employees),
    findEmployeeById: (id) => db.select().from(employees).where(eq(employees.id, id)).then((rows) => rows[0]),
    findActiveEmployees: () => db.select().from(employees).where(eq(employees.status, 'active')),
    createEmployee: (data) => db.insert(employees).values(data).returning().then((rows) => rows[0]),
    findComponentsByEmployee: (employeeId) => db.select().from(salaryComponents).where(eq(salaryComponents.employeeId, employeeId)),
    addComponent: (data) => db.insert(salaryComponents).values(data).returning().then((rows) => rows[0]),
    findAllRuns: () => db.select().from(payrollRuns),
    findRunById: (id) => db.select().from(payrollRuns).where(eq(payrollRuns.id, id)).then((rows) => rows[0]),
    createRun: (data) => db.insert(payrollRuns).values(data).returning().then((rows) => rows[0]),
    updateRunStatus: (id, status, extra = {}) => db.update(payrollRuns).set({ status, ...extra }).where(eq(payrollRuns.id, id)).returning().then((rows) => rows[0]),
    findPayslipsByRun: (payrollRunId) => db.select().from(payslips).where(eq(payslips.payrollRunId, payrollRunId)),
    createPayslip: (data) => db.insert(payslips).values(data).returning().then((rows) => rows[0]),
};
