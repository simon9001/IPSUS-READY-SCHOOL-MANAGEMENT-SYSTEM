import { healthRepository } from './health.repository.js'
import { studentsRepository } from '../students/students.repository.js'
import { guardiansService } from '../guardians/guardians.service.js'
import { NotFoundError } from '../../common/errors.js'
import type { CreateClinicVisitInput, CreateMedicalConditionInput, RecordMedicationInput } from './health.schema.js'

export const healthService = {
  listConditionsByStudent: (studentId: number) => healthRepository.findConditionsByStudent(studentId),
  createCondition: (input: CreateMedicalConditionInput) => healthRepository.createCondition(input),

  listVisitsByStudent: (studentId: number) => healthRepository.findVisitsByStudent(studentId),
  listRecentVisits: (limit: number) => healthRepository.findRecentVisits(limit),

  async getVisitById(id: number) {
    const visit = await healthRepository.findVisitById(id)
    if (!visit) throw new NotFoundError(`Clinic visit ${id} not found`)
    return visit
  },

  /** A hospital referral is urgent enough to notify guardians immediately,
   *  unlike a routine clinic visit. */
  async createVisit(input: CreateClinicVisitInput) {
    const visit = await healthRepository.createVisit(input)

    if (input.referredToHospital) {
      const student = await studentsRepository.findById(input.studentId)
      if (student) {
        await guardiansService.notifyGuardians(input.studentId, {
          channel: 'sms',
          body: `Dear Parent/Guardian, ${student.firstName} ${student.lastName} was seen at the school clinic on ${input.visitDate} and has been referred to hospital. Please contact the school immediately.`,
          relatedEntityType: 'clinic_visit',
          relatedEntityId: String(visit.id),
          createdBy: input.attendedBy,
        })
      }
    }

    return visit
  },

  listMedicationsByStudent: (studentId: number) => healthRepository.findMedicationsByStudent(studentId),
  recordMedication: (input: RecordMedicationInput) => healthRepository.recordMedication(input),
}
