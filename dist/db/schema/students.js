import { pgTable, serial, varchar, integer, date, pgEnum, timestamp } from 'drizzle-orm/pg-core';
export const classes = pgTable('classes', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 40 }).notNull().unique(), // "Form 1" .. "Form 4"
    level: integer('level').notNull(),
});
export const streams = pgTable('streams', {
    id: serial('id').primaryKey(),
    classId: integer('class_id').notNull().references(() => classes.id),
    name: varchar('name', { length: 40 }).notNull(), // "East", "West"
});
export const boardingStatusEnum = pgEnum('boarding_status', ['day', 'boarder']);
export const studentStatusEnum = pgEnum('student_status', ['active', 'transferred', 'graduated', 'withdrawn', 'suspended', 'expelled']);
export const students = pgTable('students', {
    id: serial('id').primaryKey(),
    admissionNo: varchar('admission_no', { length: 30 }).notNull().unique(),
    // NEMIS Unique Personal Identifier — follows the learner across their
    // whole schooling life, not just this school. Set from the admissions
    // record (government placement or inter-school transfer) when present.
    nemisUpi: varchar('nemis_upi', { length: 30 }).unique(),
    firstName: varchar('first_name', { length: 80 }).notNull(),
    lastName: varchar('last_name', { length: 80 }).notNull(),
    otherNames: varchar('other_names', { length: 80 }),
    gender: varchar('gender', { length: 10 }),
    dateOfBirth: date('date_of_birth'),
    classId: integer('class_id').notNull().references(() => classes.id),
    streamId: integer('stream_id').references(() => streams.id),
    boardingStatus: boardingStatusEnum('boarding_status').notNull().default('day'),
    guardianName: varchar('guardian_name', { length: 150 }),
    guardianPhone: varchar('guardian_phone', { length: 30 }),
    guardianEmail: varchar('guardian_email', { length: 150 }),
    admissionDate: date('admission_date').notNull(),
    status: studentStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
