import type { Context } from 'hono'
import { conductPointsService } from './conductPoints.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { AwardPointsInput, CreateRuleInput } from './conductPoints.schema.js'

export const conductPointsController = {
  listRules: async (c: Context) => ok(c, await conductPointsService.listRules()),
  createRule: async (c: Context) =>
    created(c, await conductPointsService.createRule(getValidated<CreateRuleInput>(c, 'json'))),

  listByStudent: async (c: Context) => ok(c, await conductPointsService.listByStudent(Number(c.req.param('studentId')))),
  award: async (c: Context) => created(c, await conductPointsService.award(getValidated<AwardPointsInput>(c, 'json'))),

  score: async (c: Context) =>
    ok(c, await conductPointsService.score(Number(c.req.param('studentId')), Number(c.req.query('periodId')))),
}
