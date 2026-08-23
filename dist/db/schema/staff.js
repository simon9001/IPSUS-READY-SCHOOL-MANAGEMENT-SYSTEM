import { pgTable, serial, varchar, integer, date, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { employees } from './payroll.js';
import { teachers } from './teachers.js';
export const staffCategoryEnum = pgEnum('staff_category', ['teaching', 'non_teaching']);
export const employmentBodyEnum = pgEnum('employment_body', ['tsc', 'bom']);
export const staffStatusEnum = pgEnum('staff_status', ['active', 'on_leave', 'suspended', 'left']);
// The canonical HR record for every person working at the school — teaching
// and non-teaching, TSC and BOM. employeeId/teacherId are optional links
// into the narrower payroll/academic registries, mirroring how `teachers`
// already optionally links to `employees` for BOM-paid teaching staff.
export const staff = pgTable('staff', {
    id: serial('id').primaryKey(),
    staffNo: varchar('staff_no', { length: 30 }).notNull().unique(),
    fullName: varchar('full_name', { length: 150 }).notNull(),
    category: staffCategoryEnum('category').notNull(),
    employmentBody: employmentBodyEnum('employment_body').notNull(),
    employeeId: integer('employee_id').references(() => employees.id),
    teacherId: integer('teacher_id').references(() => teachers.id),
    idNumber: varchar('id_number', { length: 20 }),
    phone: varchar('phone', { length: 30 }),
    email: varchar('email', { length: 150 }),
    dateOfBirth: date('date_of_birth'),
    employmentDate: date('employment_date').notNull(),
    status: staffStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
