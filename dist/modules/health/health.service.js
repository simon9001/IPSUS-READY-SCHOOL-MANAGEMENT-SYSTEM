import { healthRepository } from './health.repository.js';
import { studentsRepository } from '../students/students.repository.js';
import { guardiansService } from '../guardians/guardians.service.js';
import { NotFoundError } from '../../common/errors.js';
export const healthService = {
    listConditionsByStudent: (studentId) => healthRepository.findConditionsByStudent(studentId),
    createCondition: (input) => healthRepository.createCondition(input),
    listVisitsByStudent: (studentId) => healthRepository.findVisitsByStudent(studentId),
    listRecentVisits: (limit) => healthRepository.findRecentVisits(limit),
    async getVisitById(id) {
        const visit = await healthRepository.findVisitById(id);
        if (!visit)
            throw new NotFoundError(`Clinic visit ${id} not found`);
        return visit;
    },
    /** A hospital referral is urgent enough to notify guardians immediately,
     *  unlike a routine clinic visit. */
    async createVisit(input) {
        const visit = await healthRepository.createVisit(input);
        if (input.referredToHospital) {
            const student = await studentsRepository.findById(input.studentId);
            if (student) {
                await guardiansService.notifyGuardians(input.studentId, {
                    channel: 'sms',
                    body: `Dear Parent/Guardian, ${student.firstName} ${student.lastName} was seen at the school clinic on ${input.visitDate} and has been referred to hospital. Please contact the school immediately.`,
                    relatedEntityType: 'clinic_visit',
                    relatedEntityId: String(visit.id),
                    createdBy: input.attendedBy,
                });
            }
        }
        return visit;
    },
    listMedicationsByStudent: (studentId) => healthRepository.findMedicationsByStudent(studentId),
    recordMedication: (input) => healthRepository.recordMedication(input),
};
