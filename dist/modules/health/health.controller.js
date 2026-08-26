import { healthService } from './health.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const healthController = {
    listConditionsByStudent: async (c) => ok(c, await healthService.listConditionsByStudent(Number(c.req.param('studentId')))),
    createCondition: async (c) => created(c, await healthService.createCondition(getValidated(c, 'json'))),
    listVisitsByStudent: async (c) => ok(c, await healthService.listVisitsByStudent(Number(c.req.param('studentId')))),
    getVisitById: async (c) => ok(c, await healthService.getVisitById(Number(c.req.param('id')))),
    createVisit: async (c) => created(c, await healthService.createVisit(getValidated(c, 'json'))),
    listMedicationsByStudent: async (c) => ok(c, await healthService.listMedicationsByStudent(Number(c.req.param('studentId')))),
    recordMedication: async (c) => created(c, await healthService.recordMedication(getValidated(c, 'json'))),
};
