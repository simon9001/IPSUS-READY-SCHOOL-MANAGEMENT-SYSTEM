import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { complianceReports } from '../../db/schema/index.js';
export const complianceRepository = {
    findAll: () => db.select().from(complianceReports),
    findById: (id) => db.select().from(complianceReports).where(eq(complianceReports.id, id)).then((rows) => rows[0]),
    create: (data) => db.insert(complianceReports).values(data).returning().then((rows) => rows[0]),
    submit: (id, referenceNumber, submittedBy) => db
        .update(complianceReports)
        .set({ status: 'submitted', referenceNumber, submittedBy, submittedAt: new Date() })
        .where(eq(complianceReports.id, id))
        .returning()
        .then((rows) => rows[0]),
};
