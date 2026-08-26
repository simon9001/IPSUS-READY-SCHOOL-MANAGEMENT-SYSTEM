import type { medicalConditions, clinicVisits, medicationAdministrations } from '../../db/schema/index.js'

export type MedicalCondition = typeof medicalConditions.$inferSelect
export type NewMedicalCondition = typeof medicalConditions.$inferInsert
export type ClinicVisit = typeof clinicVisits.$inferSelect
export type NewClinicVisit = typeof clinicVisits.$inferInsert
export type MedicationAdministration = typeof medicationAdministrations.$inferSelect
export type NewMedicationAdministration = typeof medicationAdministrations.$inferInsert
