import { pgTable, serial, varchar, integer, text, boolean, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { students } from './students.js';
import { users } from './identity.js';
export const documentTypeEnum = pgEnum('document_type', [
    'leaving_certificate', 'transcript', 'admission_letter', 'fee_clearance_letter', 'conduct_certificate', 'custom_letter',
]);
export const documentTemplates = pgTable('document_templates', {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 60 }).notNull().unique(),
    documentType: documentTypeEnum('document_type').notNull(),
    bodyTemplate: text('body_template').notNull(), // supports {{placeholders}}
    isActive: boolean('is_active').notNull().default(true),
});
export const documentStatusEnum = pgEnum('document_status', ['issued', 'revoked']);
// content holds the rendered letter text for template-based documents, or a
// JSON string for structured documents (e.g. a transcript) — either way,
// what was actually issued, frozen at issue time, referenceNumber-verifiable.
export const generatedDocuments = pgTable('generated_documents', {
    id: serial('id').primaryKey(),
    referenceNumber: varchar('reference_number', { length: 40 }).notNull().unique(),
    documentType: documentTypeEnum('document_type').notNull(),
    studentId: integer('student_id').references(() => students.id),
    templateId: integer('template_id').references(() => documentTemplates.id),
    content: text('content').notNull(),
    status: documentStatusEnum('status').notNull().default('issued'),
    issuedBy: integer('issued_by').notNull().references(() => users.id),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
});
