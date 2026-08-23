import { pgTable, serial, varchar, integer, numeric, date, boolean, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { fiscalPeriods } from './periods.js';
import { journalEntries } from './journal.js';
import { users } from './identity.js';
export const employmentTypeEnum = pgEnum('employment_type', ['permanent', 'contract', 'casual']);
export const employeeStatusEnum = pgEnum('employee_status', ['active', 'on_leave', 'terminated']);
// BOM-employed staff only (support/subordinate staff) — TSC teachers are on
// a separate government payroll and are not paid through this system.
export const employees = pgTable('employees', {
    id: serial('id').primaryKey(),
    staffNo: varchar('staff_no', { length: 30 }).notNull().unique(),
    fullName: varchar('full_name', { length: 150 }).notNull(),
    idNumber: varchar('id_number', { length: 20 }),
    kraPin: varchar('kra_pin', { length: 20 }),
    nssfNo: varchar('nssf_no', { length: 30 }),
    shifNo: varchar('shif_no', { length: 30 }),
    jobTitle: varchar('job_title', { length: 100 }),
    employmentType: employmentTypeEnum('employment_type').notNull().default('permanent'),
    bankName: varchar('bank_name', { length: 100 }),
    bankAccountNo: varchar('bank_account_no', { length: 40 }),
    status: employeeStatusEnum('status').notNull().default('active'),
    employmentDate: date('employment_date').notNull(),
});
export const salaryComponentTypeEnum = pgEnum('salary_component_type', ['basic', 'allowance', 'deduction']);
export const salaryComponents = pgTable('salary_components', {
    id: serial('id').primaryKey(),
    employeeId: integer('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
    componentType: salaryComponentTypeEnum('component_type').notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    isPercentageOfBasic: boolean('is_percentage_of_basic').notNull().default(false),
});
export const payrollRunStatusEnum = pgEnum('payroll_run_status', ['draft', 'processed', 'posted']);
export const payrollRuns = pgTable('payroll_runs', {
    id: serial('id').primaryKey(),
    periodId: integer('period_id').notNull().references(() => fiscalPeriods.id),
    monthYear: varchar('month_year', { length: 7 }).notNull(), // "2026-01"
    status: payrollRunStatusEnum('status').notNull().default('draft'),
    processedBy: integer('processed_by').references(() => users.id),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    journalEntryId: integer('journal_entry_id').references(() => journalEntries.id), // Dr Salaries Exp / Cr PAYE, NSSF, SHIF, Net Pay Payable
});
export const payslips = pgTable('payslips', {
    id: serial('id').primaryKey(),
    payrollRunId: integer('payroll_run_id').notNull().references(() => payrollRuns.id, { onDelete: 'cascade' }),
    employeeId: integer('employee_id').notNull().references(() => employees.id),
    grossPay: numeric('gross_pay', { precision: 14, scale: 2 }).notNull(),
    paye: numeric('paye', { precision: 14, scale: 2 }).notNull().default('0'),
    nssf: numeric('nssf', { precision: 14, scale: 2 }).notNull().default('0'),
    shif: numeric('shif', { precision: 14, scale: 2 }).notNull().default('0'),
    otherDeductions: numeric('other_deductions', { precision: 14, scale: 2 }).notNull().default('0'),
    netPay: numeric('net_pay', { precision: 14, scale: 2 }).notNull(),
});
