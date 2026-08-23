import { conductPointsService } from './conductPoints.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const conductPointsController = {
    listRules: async (c) => ok(c, await conductPointsService.listRules()),
    createRule: async (c) => created(c, await conductPointsService.createRule(getValidated(c, 'json'))),
    listByStudent: async (c) => ok(c, await conductPointsService.listByStudent(Number(c.req.param('studentId')))),
    award: async (c) => created(c, await conductPointsService.award(getValidated(c, 'json'))),
    score: async (c) => ok(c, await conductPointsService.score(Number(c.req.param('studentId')), Number(c.req.query('periodId')))),
};
