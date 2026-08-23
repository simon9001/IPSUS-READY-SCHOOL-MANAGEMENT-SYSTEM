import { pgTable, serial, varchar, integer, pgEnum, timestamp } from 'drizzle-orm/pg-core'
import { employees } from './payroll.js'

export const teacherStatusEnum = pgEnum('teacher_status', ['active', 'on_leave', 'left'])

// Covers both TSC-employed teachers (tscNumber set, employeeId null — they
// are not on the BOM payroll) and BOM-employed teaching staff (employeeId
// links to payroll.employees).
export const teachers = pgTable('teachers', {
  id: serial('id').primaryKey(),
  staffNo: varchar('staff_no', { length: 30 }).notNull().unique(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  tscNumber: varchar('tsc_number', { length: 30 }),
  employeeId: integer('employee_id').references(() => employees.id),
  email: varchar('email', { length: 150 }),
  phone: varchar('phone', { length: 30 }),
  status: teacherStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
