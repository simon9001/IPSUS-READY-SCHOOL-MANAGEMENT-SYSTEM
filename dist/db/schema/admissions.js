import { pgTable, serial, varchar, integer, date, text, numeric, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { classes, students } from './students.js';
import { users } from './identity.js';
export const admissionTypeEnum = pgEnum('admission_type', ['placement', 'transfer', 'direct']);
// placement/transfer skip interview entirely (government/prior-school already
// decided) and go straight to 'admitted'; 'direct' walks through the full
// pending -> interview_scheduled -> admitted/waitlisted/rejected flow.
export const admissionStatusEnum = pgEnum('admission_status', [
    'pending', 'interview_scheduled', 'admitted', 'waitlisted', 'rejected', 'enrolled',
]);
export const admissions = pgTable('admissions', {
    id: serial('id').primaryKey(),
    applicationNo: varchar('application_no', { length: 30 }).notNull().unique(),
    admissionType: admissionTypeEnum('admission_type').notNull(),
    status: admissionStatusEnum('status').notNull().default('pending'),
    // Applicant bio (copied onto the student record at enrollment)
    firstName: varchar('first_name', { length: 80 }).notNull(),
    lastName: varchar('last_name', { length: 80 }).notNull(),
    otherNames: varchar('other_names', { length: 80 }),
    gender: varchar('gender', { length: 10 }),
    dateOfBirth: date('date_of_birth'),
    guardianName: varchar('guardian_name', { length: 150 }),
    guardianPhone: varchar('guardian_phone', { length: 30 }),
    guardianEmail: varchar('guardian_email', { length: 150 }),
    targetClassId: integer('target_class_id').notNull().references(() => classes.id),
    boardingStatus: varchar('boarding_status', { length: 10 }).notNull().default('day'), // 'day' | 'boarder'
    // NEMIS continuity — applies to placement and transfer
    nemisUpi: varchar('nemis_upi', { length: 30 }),
    // Placement-specific (government JSS/Senior School placement)
    placementLetterRef: varchar('placement_letter_ref', { length: 60 }),
    kcpeKpseaIndexNo: varchar('kcpe_kpsea_index_no', { length: 30 }),
    previousInstitutionCode: varchar('previous_institution_code', { length: 30 }), // sending primary school's NEMIS code
    // Transfer-specific (from another school, NEMIS-tracked)
    previousSchoolName: varchar('previous_school_name', { length: 150 }),
    previousSchoolCode: varchar('previous_school_code', { length: 30 }),
    transferReason: text('transfer_reason'),
    transferCertificateRef: varchar('transfer_certificate_ref', { length: 60 }),
    // Direct/local admission-specific (the only pathway with an interview)
    interviewDate: date('interview_date'),
    interviewerId: integer('interviewer_id').references(() => users.id),
    interviewScore: numeric('interview_score', { precision: 5, scale: 2 }),
    interviewNotes: text('interview_notes'),
    // Decision (applies to all types)
    decidedBy: integer('decided_by').references(() => users.id),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    // Enrollment link — set once converted into an actual student record
    studentId: integer('student_id').references(() => students.id),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }),
    recordedBy: integer('recorded_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
