import { pgTable, serial, varchar, integer, date, text, pgEnum, timestamp, unique } from 'drizzle-orm/pg-core'
import { students } from './students.js'
import { staff } from './staff.js'
import { fiscalPeriods } from './periods.js'
import { users } from './identity.js'

export const dormitoryGenderEnum = pgEnum('dormitory_gender', ['boys', 'girls', 'mixed'])
export const dormitoryStatusEnum = pgEnum('dormitory_status', ['active', 'inactive'])

export const dormitories = pgTable('dormitories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  gender: dormitoryGenderEnum('gender').notNull(),
  capacity: integer('capacity').notNull(),
  wardenStaffId: integer('warden_staff_id').references(() => staff.id),
  status: dormitoryStatusEnum('status').notNull().default('active'),
})

export const bedAllocationStatusEnum = pgEnum('bed_allocation_status', ['active', 'vacated'])

export const bedAllocations = pgTable('bed_allocations', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull().references(() => students.id),
  dormitoryId: integer('dormitory_id').notNull().references(() => dormitories.id),
  bedNumber: varchar('bed_number', { length: 20 }).notNull(),
  periodId: integer('period_id').notNull().references(() => fiscalPeriods.id),
  allocatedDate: date('allocated_date').notNull(),
  vacatedDate: date('vacated_date'),
  status: bedAllocationStatusEnum('status').notNull().default('active'),
})

export const boardingAttendanceStatusEnum = pgEnum('boarding_attendance_status', ['present', 'absent', 'on_leave'])

// Distinct from academic `attendance_records` (day/class attendance) — this
// tracks whether a boarder was actually in the dormitory at night, a
// welfare/safety concern separate from classroom presence.
export const boardingAttendance = pgTable('boarding_attendance', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull().references(() => students.id),
  attendanceDate: date('attendance_date').notNull(),
  status: boardingAttendanceStatusEnum('status').notNull(),
  remarks: text('remarks'),
  recordedBy: integer('recorded_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.studentId, t.attendanceDate)])
