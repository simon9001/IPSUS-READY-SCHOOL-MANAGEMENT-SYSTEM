import type { Context } from 'hono'
import { admissionsService } from './admissions.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import { actorId } from '../../common/actor.js'
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
    created(c, await admissionsService.capturePlacement(getValidated<CapturePlacementInput>(c, 'json'), actorId(c))),
  captureTransfer: async (c: Context) =>
    created(c, await admissionsService.captureTransfer(getValidated<CaptureTransferInput>(c, 'json'), actorId(c))),
  applyDirect: async (c: Context) =>
    created(c, await admissionsService.applyDirect(getValidated<ApplyDirectInput>(c, 'json'), actorId(c))),

  scheduleInterview: async (c: Context) =>
    ok(c, await admissionsService.scheduleInterview(Number(c.req.param('id')), getValidated<ScheduleInterviewInput>(c, 'json'), actorId(c))),
  recordInterviewResult: async (c: Context) =>
    ok(c, await admissionsService.recordInterviewResult(Number(c.req.param('id')), getValidated<RecordInterviewResultInput>(c, 'json'), actorId(c))),
  decide: async (c: Context) =>
    ok(c, await admissionsService.decide(Number(c.req.param('id')), getValidated<DecideAdmissionInput>(c, 'json'), actorId(c))),

  enroll: async (c: Context) =>
    created(c, await admissionsService.enroll(Number(c.req.param('id')), getValidated<EnrollAdmissionInput>(c, 'json'), actorId(c))),
}
