import { pgTable, serial, varchar, integer, jsonb, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { fiscalPeriods } from './periods.js';
import { users } from './identity.js';
export const complianceReportTypeEnum = pgEnum('compliance_report_type', ['nemis_enrollment', 'tsc_staffing', 'moe_capitation']);
export const complianceReportStatusEnum = pgEnum('compliance_report_status', ['draft', 'submitted']);
// reportData is a frozen JSON snapshot taken at generation time — a filed
// return is a historical record and must not silently change if the
// underlying data (e.g. a student later marked withdrawn) changes later.
export const complianceReports = pgTable('compliance_reports', {
    id: serial('id').primaryKey(),
    reportType: complianceReportTypeEnum('report_type').notNull(),
    periodId: integer('period_id').notNull().references(() => fiscalPeriods.id),
    reportData: jsonb('report_data').notNull(),
    status: complianceReportStatusEnum('status').notNull().default('draft'),
    referenceNumber: varchar('reference_number', { length: 60 }), // government acknowledgment/reference once filed
    generatedBy: integer('generated_by').notNull().references(() => users.id),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
    submittedBy: integer('submitted_by').references(() => users.id),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
});
