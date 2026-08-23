import { disciplineRepository } from './discipline.repository.js';
import { studentsRepository } from '../students/students.repository.js';
import { guardiansService } from '../guardians/guardians.service.js';
import { NotFoundError } from '../../common/errors.js';
export const disciplineService = {
    listByStudent: (studentId) => disciplineRepository.findByStudent(studentId),
    async getById(id) {
        const record = await disciplineRepository.findById(id);
        if (!record)
            throw new NotFoundError(`Discipline record ${id} not found`);
        return record;
    },
    async create(input) {
        const record = await disciplineRepository.create(input);
        const student = await studentsRepository.findById(input.studentId);
        if (student) {
            await guardiansService.notifyGuardians(input.studentId, {
                channel: 'sms',
                body: `Dear Parent/Guardian, a ${input.severity} conduct incident involving ${student.firstName} ${student.lastName} was recorded on ${input.incidentDate}: ${input.description}`,
                relatedEntityType: 'discipline_record',
                relatedEntityId: String(record.id),
                createdBy: input.recordedBy,
            });
        }
        return record;
    },
};
