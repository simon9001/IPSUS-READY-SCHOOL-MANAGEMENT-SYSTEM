import type { Context } from 'hono'
import { disciplinaryCasesService } from './disciplinaryCases.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type {
  BomReviewInput,
  DecideCaseInput,
  OpenCaseInput,
  ReinstateCaseInput,
  RecordHearingInput,
  RecordParentAttendanceInput,
  SummonParentInput,
} from './disciplinaryCases.schema.js'

export const disciplinaryCasesController = {
  list: async (c: Context) => ok(c, await disciplinaryCasesService.list()),
  listByStudent: async (c: Context) => ok(c, await disciplinaryCasesService.listByStudent(Number(c.req.param('studentId')))),
  getById: async (c: Context) => ok(c, await disciplinaryCasesService.getById(Number(c.req.param('id')))),

  open: async (c: Context) => created(c, await disciplinaryCasesService.open(getValidated<OpenCaseInput>(c, 'json'))),

  summonParent: async (c: Context) =>
    ok(c, await disciplinaryCasesService.summonParent(Number(c.req.param('id')), getValidated<SummonParentInput>(c, 'json'))),
  recordParentAttendance: async (c: Context) =>
    ok(c, await disciplinaryCasesService.recordParentAttendance(Number(c.req.param('id')), getValidated<RecordParentAttendanceInput>(c, 'json'))),
  recordHearing: async (c: Context) =>
    ok(c, await disciplinaryCasesService.recordHearing(Number(c.req.param('id')), getValidated<RecordHearingInput>(c, 'json'))),
  bomReview: async (c: Context) =>
    ok(c, await disciplinaryCasesService.bomReview(Number(c.req.param('id')), getValidated<BomReviewInput>(c, 'json'))),
  decide: async (c: Context) =>
    ok(c, await disciplinaryCasesService.decide(Number(c.req.param('id')), getValidated<DecideCaseInput>(c, 'json'))),
  reinstate: async (c: Context) =>
    ok(c, await disciplinaryCasesService.reinstate(Number(c.req.param('id')), getValidated<ReinstateCaseInput>(c, 'json'))),
  close: async (c: Context) => ok(c, await disciplinaryCasesService.close(Number(c.req.param('id')))),
}
