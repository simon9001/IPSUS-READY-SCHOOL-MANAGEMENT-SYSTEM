import { pgTable, serial, varchar, integer, date, text, boolean, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { students } from './students.js';
import { users } from './identity.js';
// Medical — distinct from `counseling_sessions` (guidance/emotional support).
// Equally confidential; gated the same way (see health.access in RBAC).
export const conditionSeverityEnum = pgEnum('condition_severity', ['mild', 'moderate', 'severe']);
export const medicalConditions = pgTable('medical_conditions', {
    id: serial('id').primaryKey(),
    studentId: integer('student_id').notNull().references(() => students.id),
    condition: varchar('condition', { length: 150 }).notNull(),
    severity: conditionSeverityEnum('severity').notNull().default('mild'),
    diagnosedDate: date('diagnosed_date'),
    notes: text('notes'),
    isActive: boolean('is_active').notNull().default(true),
    recordedBy: integer('recorded_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const clinicVisits = pgTable('clinic_visits', {
    id: serial('id').primaryKey(),
    studentId: integer('student_id').notNull().references(() => students.id),
    visitDate: date('visit_date').notNull(),
    presentingComplaint: text('presenting_complaint').notNull(),
    diagnosis: text('diagnosis'),
    treatmentGiven: text('treatment_given'),
    referredToHospital: boolean('referred_to_hospital').notNull().default(false),
    referralNotes: text('referral_notes'),
    attendedBy: integer('attended_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const medicationAdministrations = pgTable('medication_administrations', {
    id: serial('id').primaryKey(),
    studentId: integer('student_id').notNull().references(() => students.id),
    clinicVisitId: integer('clinic_visit_id').references(() => clinicVisits.id),
    medicalConditionId: integer('medical_condition_id').references(() => medicalConditions.id),
    medicationName: varchar('medication_name', { length: 150 }).notNull(),
    dosage: varchar('dosage', { length: 100 }),
    administeredAt: timestamp('administered_at', { withTimezone: true }).notNull().defaultNow(),
    administeredBy: integer('administered_by').notNull().references(() => users.id),
    notes: text('notes'),
});
