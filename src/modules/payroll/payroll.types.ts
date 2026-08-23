import type { employees, salaryComponents, payrollRuns, payslips } from '../../db/schema/index.js'

export type Employee = typeof employees.$inferSelect
export type NewEmployee = typeof employees.$inferInsert
export type SalaryComponent = typeof salaryComponents.$inferSelect
export type NewSalaryComponent = typeof salaryComponents.$inferInsert
export type PayrollRun = typeof payrollRuns.$inferSelect
export type NewPayrollRun = typeof payrollRuns.$inferInsert
export type Payslip = typeof payslips.$inferSelect
export type NewPayslip = typeof payslips.$inferInsert
