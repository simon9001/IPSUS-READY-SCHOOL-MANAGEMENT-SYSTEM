import type { Context } from 'hono'
import { subjectsService } from './subjects.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { AssignTeacherInput, CreateSubjectInput, OfferSubjectToClassInput } from './subjects.schema.js'

export const subjectsController = {
  list: async (c: Context) => ok(c, await subjectsService.list()),
  getById: async (c: Context) => ok(c, await subjectsService.getById(Number(c.req.param('id')))),
  create: async (c: Context) =>
    created(c, await subjectsService.create(getValidated<CreateSubjectInput>(c, 'json'))),

  listOfferingsByClass: async (c: Context) =>
    ok(c, await subjectsService.listOfferingsByClass(Number(c.req.param('classId')))),
  offerToClass: async (c: Context) =>
    created(c, await subjectsService.offerToClass(getValidated<OfferSubjectToClassInput>(c, 'json'))),

  listAssignments: async (c: Context) =>
    ok(c, await subjectsService.listAssignments(Number(c.req.param('classId')), Number(c.req.query('periodId')))),
  assignTeacher: async (c: Context) =>
    created(c, await subjectsService.assignTeacher(getValidated<AssignTeacherInput>(c, 'json'))),
}
