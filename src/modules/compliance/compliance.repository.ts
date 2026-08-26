import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { complianceReports } from '../../db/schema/index.js'
import type { NewComplianceReport } from './compliance.types.js'

export const complianceRepository = {
  findAll: () => db.select().from(complianceReports),
  findById: (id: number) =>
    db.select().from(complianceReports).where(eq(complianceReports.id, id)).then((rows) => rows[0]),
  create: (data: NewComplianceReport) => db.insert(complianceReports).values(data).returning().then((rows) => rows[0]),
  submit: (id: number, referenceNumber: string, submittedBy: number) =>
    db
      .update(complianceReports)
      .set({ status: 'submitted', referenceNumber, submittedBy, submittedAt: new Date() })
      .where(eq(complianceReports.id, id))
      .returning()
      .then((rows) => rows[0]),
}
