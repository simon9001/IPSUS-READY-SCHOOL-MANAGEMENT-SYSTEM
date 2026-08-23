import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { employees, payrollRuns, payslips, salaryComponents } from '../../db/schema/index.js'
import type { NewEmployee, NewPayrollRun, NewPayslip, NewSalaryComponent } from './payroll.types.js'

export const payrollRepository = {
  findAllEmployees: () => db.select().from(employees),
  findEmployeeById: (id: number) =>
    db.select().from(employees).where(eq(employees.id, id)).then((rows) => rows[0]),
  findActiveEmployees: () => db.select().from(employees).where(eq(employees.status, 'active')),
  createEmployee: (data: NewEmployee) =>
    db.insert(employees).values(data).returning().then((rows) => rows[0]),

  findComponentsByEmployee: (employeeId: number) =>
    db.select().from(salaryComponents).where(eq(salaryComponents.employeeId, employeeId)),
  addComponent: (data: NewSalaryComponent) =>
    db.insert(salaryComponents).values(data).returning().then((rows) => rows[0]),

  findAllRuns: () => db.select().from(payrollRuns),
  findRunById: (id: number) =>
    db.select().from(payrollRuns).where(eq(payrollRuns.id, id)).then((rows) => rows[0]),
  createRun: (data: NewPayrollRun) =>
    db.insert(payrollRuns).values(data).returning().then((rows) => rows[0]),
  updateRunStatus: (id: number, status: 'processed' | 'posted', extra: Record<string, unknown> = {}) =>
    db.update(payrollRuns).set({ status, ...extra }).where(eq(payrollRuns.id, id)).returning().then((rows) => rows[0]),

  findPayslipsByRun: (payrollRunId: number) =>
    db.select().from(payslips).where(eq(payslips.payrollRunId, payrollRunId)),
  createPayslip: (data: NewPayslip) =>
    db.insert(payslips).values(data).returning().then((rows) => rows[0]),
}
