import { admissionsService } from './admissions.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const admissionsController = {
    list: async (c) => ok(c, await admissionsService.list()),
    getById: async (c) => ok(c, await admissionsService.getById(Number(c.req.param('id')))),
    capturePlacement: async (c) => created(c, await admissionsService.capturePlacement(getValidated(c, 'json'))),
    captureTransfer: async (c) => created(c, await admissionsService.captureTransfer(getValidated(c, 'json'))),
    applyDirect: async (c) => created(c, await admissionsService.applyDirect(getValidated(c, 'json'))),
    scheduleInterview: async (c) => ok(c, await admissionsService.scheduleInterview(Number(c.req.param('id')), getValidated(c, 'json'))),
    recordInterviewResult: async (c) => ok(c, await admissionsService.recordInterviewResult(Number(c.req.param('id')), getValidated(c, 'json'))),
    decide: async (c) => ok(c, await admissionsService.decide(Number(c.req.param('id')), getValidated(c, 'json'))),
    enroll: async (c) => created(c, await admissionsService.enroll(Number(c.req.param('id')), getValidated(c, 'json'))),
};
