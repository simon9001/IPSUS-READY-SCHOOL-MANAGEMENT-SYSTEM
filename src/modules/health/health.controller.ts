import type { Context } from 'hono'
import { healthService } from './health.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateClinicVisitInput, CreateMedicalConditionInput, RecordMedicationInput } from './health.schema.js'

export const healthController = {
  listConditionsByStudent: async (c: Context) =>
    ok(c, await healthService.listConditionsByStudent(Number(c.req.param('studentId')))),
  createCondition: async (c: Context) =>
    created(c, await healthService.createCondition(getValidated<CreateMedicalConditionInput>(c, 'json'))),

  listVisitsByStudent: async (c: Context) => ok(c, await healthService.listVisitsByStudent(Number(c.req.param('studentId')))),
  getVisitById: async (c: Context) => ok(c, await healthService.getVisitById(Number(c.req.param('id')))),
  createVisit: async (c: Context) =>
    created(c, await healthService.createVisit(getValidated<CreateClinicVisitInput>(c, 'json'))),

  listMedicationsByStudent: async (c: Context) =>
    ok(c, await healthService.listMedicationsByStudent(Number(c.req.param('studentId')))),
  recordMedication: async (c: Context) =>
    created(c, await healthService.recordMedication(getValidated<RecordMedicationInput>(c, 'json'))),
}
