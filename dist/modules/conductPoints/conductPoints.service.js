import { conductPointsRepository } from './conductPoints.repository.js';
import { NotFoundError, ValidationError } from '../../common/errors.js';
export const conductPointsService = {
    listRules: () => conductPointsRepository.findAllRules(),
    createRule: (input) => conductPointsRepository.createRule(input),
    listByStudent: (studentId) => conductPointsRepository.findByStudent(studentId),
    async award(input) {
        let points = input.points;
        if (input.ruleId) {
            const rule = await conductPointsRepository.findRuleById(input.ruleId);
            if (!rule)
                throw new NotFoundError(`Conduct point rule ${input.ruleId} not found`);
            points = rule.points;
        }
        if (points === undefined)
            throw new ValidationError('Either ruleId or points must be provided');
        return conductPointsRepository.award({
            studentId: input.studentId,
            periodId: input.periodId,
            ruleId: input.ruleId,
            points,
            reason: input.reason,
            disciplineRecordId: input.disciplineRecordId,
            awardedBy: input.awardedBy,
        });
    },
    async score(studentId, periodId) {
        const totalPoints = await conductPointsRepository.scoreForPeriod(studentId, periodId);
        return { studentId, periodId, totalPoints };
    },
};
