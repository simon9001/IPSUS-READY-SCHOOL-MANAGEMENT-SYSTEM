import { disciplinaryCasesService } from './disciplinaryCases.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const disciplinaryCasesController = {
    list: async (c) => ok(c, await disciplinaryCasesService.list()),
    listByStudent: async (c) => ok(c, await disciplinaryCasesService.listByStudent(Number(c.req.param('studentId')))),
    getById: async (c) => ok(c, await disciplinaryCasesService.getById(Number(c.req.param('id')))),
    open: async (c) => created(c, await disciplinaryCasesService.open(getValidated(c, 'json'))),
    summonParent: async (c) => ok(c, await disciplinaryCasesService.summonParent(Number(c.req.param('id')), getValidated(c, 'json'))),
    recordParentAttendance: async (c) => ok(c, await disciplinaryCasesService.recordParentAttendance(Number(c.req.param('id')), getValidated(c, 'json'))),
    recordHearing: async (c) => ok(c, await disciplinaryCasesService.recordHearing(Number(c.req.param('id')), getValidated(c, 'json'))),
    bomReview: async (c) => ok(c, await disciplinaryCasesService.bomReview(Number(c.req.param('id')), getValidated(c, 'json'))),
    decide: async (c) => ok(c, await disciplinaryCasesService.decide(Number(c.req.param('id')), getValidated(c, 'json'))),
    reinstate: async (c) => ok(c, await disciplinaryCasesService.reinstate(Number(c.req.param('id')), getValidated(c, 'json'))),
    close: async (c) => ok(c, await disciplinaryCasesService.close(Number(c.req.param('id')))),
};
