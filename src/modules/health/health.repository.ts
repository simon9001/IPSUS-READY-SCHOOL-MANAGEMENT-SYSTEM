import { desc, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { clinicVisits, medicalConditions, medicationAdministrations } from '../../db/schema/index.js'
import type { NewClinicVisit, NewMedicalCondition, NewMedicationAdministration } from './health.types.js'

export const healthRepository = {
  findConditionsByStudent: (studentId: number) => db.select().from(medicalConditions).where(eq(medicalConditions.studentId, studentId)),
  createCondition: (data: NewMedicalCondition) =>
    db.insert(medicalConditions).values(data).returning().then((rows) => rows[0]),

  findVisitsByStudent: (studentId: number) => db.select().from(clinicVisits).where(eq(clinicVisits.studentId, studentId)),
  findRecentVisits: (limit: number) => db.select().from(clinicVisits).orderBy(desc(clinicVisits.visitDate)).limit(limit),
  findVisitById: (id: number) =>
    db.select().from(clinicVisits).where(eq(clinicVisits.id, id)).then((rows) => rows[0]),
  createVisit: (data: NewClinicVisit) => db.insert(clinicVisits).values(data).returning().then((rows) => rows[0]),

  findMedicationsByStudent: (studentId: number) =>
    db.select().from(medicationAdministrations).where(eq(medicationAdministrations.studentId, studentId)),
  recordMedication: (data: NewMedicationAdministration) =>
    db.insert(medicationAdministrations).values(data).returning().then((rows) => rows[0]),
}
