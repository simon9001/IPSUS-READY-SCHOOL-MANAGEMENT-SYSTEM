import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { clinicVisits, medicalConditions, medicationAdministrations } from '../../db/schema/index.js';
export const healthRepository = {
    findConditionsByStudent: (studentId) => db.select().from(medicalConditions).where(eq(medicalConditions.studentId, studentId)),
    createCondition: (data) => db.insert(medicalConditions).values(data).returning().then((rows) => rows[0]),
    findVisitsByStudent: (studentId) => db.select().from(clinicVisits).where(eq(clinicVisits.studentId, studentId)),
    findRecentVisits: (limit) => db.select().from(clinicVisits).orderBy(desc(clinicVisits.visitDate)).limit(limit),
    findVisitById: (id) => db.select().from(clinicVisits).where(eq(clinicVisits.id, id)).then((rows) => rows[0]),
    createVisit: (data) => db.insert(clinicVisits).values(data).returning().then((rows) => rows[0]),
    findMedicationsByStudent: (studentId) => db.select().from(medicationAdministrations).where(eq(medicationAdministrations.studentId, studentId)),
    recordMedication: (data) => db.insert(medicationAdministrations).values(data).returning().then((rows) => rows[0]),
};
