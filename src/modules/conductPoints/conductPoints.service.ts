import { conductPointsRepository } from './conductPoints.repository.js'
import { NotFoundError, ValidationError } from '../../common/errors.js'
import type { AwardPointsInput, CreateRuleInput } from './conductPoints.schema.js'
import type { ConductScore } from './conductPoints.types.js'

export const conductPointsService = {
  listRules: () => conductPointsRepository.findAllRules(),
  createRule: (input: CreateRuleInput) => conductPointsRepository.createRule(input),

  listByStudent: (studentId: number) => conductPointsRepository.findByStudent(studentId),

  async award(input: AwardPointsInput) {
    let points = input.points
    if (input.ruleId) {
      const rule = await conductPointsRepository.findRuleById(input.ruleId)
      if (!rule) throw new NotFoundError(`Conduct point rule ${input.ruleId} not found`)
      points = rule.points
    }
    if (points === undefined) throw new ValidationError('Either ruleId or points must be provided')

    return conductPointsRepository.award({
      studentId: input.studentId,
      periodId: input.periodId,
      ruleId: input.ruleId,
      points,
      reason: input.reason,
      disciplineRecordId: input.disciplineRecordId,
      awardedBy: input.awardedBy,
    })
  },

  async score(studentId: number, periodId: number): Promise<ConductScore> {
    const totalPoints = await conductPointsRepository.scoreForPeriod(studentId, periodId)
    return { studentId, periodId, totalPoints }
  },
}
