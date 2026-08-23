import type { Context } from 'hono'
import { admissionsService } from './admissions.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type {
  ApplyDirectInput,
  CapturePlacementInput,
  CaptureTransferInput,
  DecideAdmissionInput,
  EnrollAdmissionInput,
  RecordInterviewResultInput,
  ScheduleInterviewInput,
} from './admissions.schema.js'

export const admissionsController = {
  list: async (c: Context) => ok(c, await admissionsService.list()),
  getById: async (c: Context) => ok(c, await admissionsService.getById(Number(c.req.param('id')))),

  capturePlacement: async (c: Context) =>
    created(c, await admissionsService.capturePlacement(getValidated<CapturePlacementInput>(c, 'json'))),
  captureTransfer: async (c: Context) =>
    created(c, await admissionsService.captureTransfer(getValidated<CaptureTransferInput>(c, 'json'))),
  applyDirect: async (c: Context) =>
    created(c, await admissionsService.applyDirect(getValidated<ApplyDirectInput>(c, 'json'))),

  scheduleInterview: async (c: Context) =>
    ok(c, await admissionsService.scheduleInterview(Number(c.req.param('id')), getValidated<ScheduleInterviewInput>(c, 'json'))),
  recordInterviewResult: async (c: Context) =>
    ok(c, await admissionsService.recordInterviewResult(Number(c.req.param('id')), getValidated<RecordInterviewResultInput>(c, 'json'))),
  decide: async (c: Context) =>
    ok(c, await admissionsService.decide(Number(c.req.param('id')), getValidated<DecideAdmissionInput>(c, 'json'))),

  enroll: async (c: Context) =>
    created(c, await admissionsService.enroll(Number(c.req.param('id')), getValidated<EnrollAdmissionInput>(c, 'json'))),
}
