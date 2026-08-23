import { pgTable, serial, integer, date, text, pgEnum, unique } from 'drizzle-orm/pg-core'
import { students } from './students.js'
import { users } from './identity.js'

export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late', 'excused'])

export const attendanceRecords = pgTable('attendance_records', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull().references(() => students.id),
  attendanceDate: date('attendance_date').notNull(),
  status: attendanceStatusEnum('status').notNull(),
  remarks: text('remarks'),
  recordedBy: integer('recorded_by').notNull().references(() => users.id),
}, (t) => [unique().on(t.studentId, t.attendanceDate)])
