import { promotionsService } from './promotions.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const promotionsController = {
    listByStudent: async (c) => ok(c, await promotionsService.listByStudent(Number(c.req.param('studentId')))),
    record: async (c) => created(c, await promotionsService.record(getValidated(c, 'json'))),
};
