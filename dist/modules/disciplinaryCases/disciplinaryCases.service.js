import { disciplinaryCasesRepository } from './disciplinaryCases.repository.js';
import { studentsRepository } from '../students/students.repository.js';
import { guardiansService } from '../guardians/guardians.service.js';
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors.js';
async function studentName(studentId) {
    const student = await studentsRepository.findById(studentId);
    return student ? `${student.firstName} ${student.lastName}` : `student #${studentId}`;
}
export const disciplinaryCasesService = {
    list: () => disciplinaryCasesRepository.findAll(),
    listByStudent: (studentId) => disciplinaryCasesRepository.findByStudent(studentId),
    async getById(id) {
        const record = await disciplinaryCasesRepository.findById(id);
        if (!record)
            throw new NotFoundError(`Disciplinary case ${id} not found`);
        return record;
    },
    async open(input) {
        const record = await disciplinaryCasesRepository.create(input);
        const name = await studentName(input.studentId);
        await guardiansService.notifyGuardians(input.studentId, {
            channel: 'sms',
            body: `Dear Parent/Guardian, a formal ${input.caseType} case has been opened regarding ${name}. You will be contacted with further details.`,
            relatedEntityType: 'disciplinary_case',
            relatedEntityId: String(record.id),
            createdBy: input.openedBy,
        });
        return record;
    },
    async summonParent(id, input) {
        const record = await this.getById(id);
        if (record.status === 'decided' || record.status === 'closed')
            throw new ConflictError(`Case ${id} is already ${record.status}`);
        const updated = await disciplinaryCasesRepository.update(id, { parentSummonsDate: input.summonsDate, status: 'parent_summoned' });
        const name = await studentName(record.studentId);
        await guardiansService.notifyGuardians(record.studentId, {
            channel: 'sms',
            body: `Dear Parent/Guardian, you are summoned to the school on ${input.summonsDate} regarding the disciplinary case involving ${name}. Please attend.`,
            relatedEntityType: 'disciplinary_case',
            relatedEntityId: String(id),
        });
        return updated;
    },
    recordParentAttendance: (id, input) => disciplinaryCasesRepository.update(id, { parentAttended: input.attended }),
    async recordHearing(id, input) {
        await this.getById(id);
        return disciplinaryCasesRepository.update(id, { ...input, status: 'hearing_held' });
    },
    /** Required for expulsion cases before a decision can be recorded — the
     *  Basic Education Act requires Board of Management sign-off. */
    async bomReview(id, input) {
        const record = await this.getById(id);
        if (record.caseType !== 'expulsion')
            throw new ValidationError('BOM review only applies to expulsion cases');
        return disciplinaryCasesRepository.update(id, { ...input, status: 'bom_reviewed' });
    },
    async decide(id, input) {
        const record = await this.getById(id);
        if (record.status === 'decided' || record.status === 'closed')
            throw new ConflictError(`Case ${id} is already ${record.status}`);
        if (input.decision === 'expelled' && record.status !== 'bom_reviewed') {
            throw new ValidationError('Expulsion requires BOM review before a decision can be recorded');
        }
        const updated = await disciplinaryCasesRepository.update(id, {
            status: 'decided',
            decision: input.decision,
            decidedBy: input.decidedBy,
            decidedAt: new Date(),
            suspensionStartDate: input.suspensionStartDate,
            suspensionEndDate: input.suspensionEndDate,
            reAdmissionDate: input.suspensionEndDate,
        });
        if (input.decision === 'suspended')
            await studentsRepository.update(record.studentId, { status: 'suspended' });
        if (input.decision === 'expelled')
            await studentsRepository.update(record.studentId, { status: 'expelled' });
        const name = await studentName(record.studentId);
        const outcomeText = input.decision === 'dismissed'
            ? 'no further action will be taken'
            : `the outcome is: ${input.decision}${input.suspensionEndDate ? `, effective until ${input.suspensionEndDate}` : ''}`;
        await guardiansService.notifyGuardians(record.studentId, {
            channel: 'sms',
            body: `Dear Parent/Guardian, the disciplinary case involving ${name} has been decided — ${outcomeText}.`,
            relatedEntityType: 'disciplinary_case',
            relatedEntityId: String(id),
            createdBy: input.decidedBy,
        });
        return updated;
    },
    async reinstate(id, input) {
        const record = await this.getById(id);
        if (record.status !== 'decided' || record.decision !== 'suspended') {
            throw new ConflictError(`Case ${id} is not a decided suspension awaiting reinstatement`);
        }
        await studentsRepository.update(record.studentId, { status: 'active' });
        const updated = await disciplinaryCasesRepository.update(id, { status: 'closed' });
        const name = await studentName(record.studentId);
        await guardiansService.notifyGuardians(record.studentId, {
            channel: 'sms',
            body: `Dear Parent/Guardian, ${name} has been reinstated and may return to school.`,
            relatedEntityType: 'disciplinary_case',
            relatedEntityId: String(id),
            createdBy: input.reinstatedBy,
        });
        return updated;
    },
    close: (id) => disciplinaryCasesRepository.update(id, { status: 'closed' }),
};
