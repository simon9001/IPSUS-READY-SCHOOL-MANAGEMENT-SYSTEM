import type { Context } from 'hono'
import { studentsService } from './students.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateClassInput, CreateStreamInput, CreateStudentInput, UpdateStudentInput } from './students.schema.js'

export const studentsController = {
  listClasses: async (c: Context) => ok(c, await studentsService.listClasses()),
  createClass: async (c: Context) =>
    created(c, await studentsService.createClass(getValidated<CreateClassInput>(c, 'json'))),

  listStreams: async (c: Context) => ok(c, await studentsService.listStreams(Number(c.req.param('classId')))),
  createStream: async (c: Context) =>
    created(c, await studentsService.createStream(getValidated<CreateStreamInput>(c, 'json'))),

  list: async (c: Context) => ok(c, await studentsService.list()),
  listByClass: async (c: Context) => ok(c, await studentsService.listByClass(Number(c.req.param('classId')))),
  getById: async (c: Context) => ok(c, await studentsService.getById(Number(c.req.param('id')))),
  create: async (c: Context) =>
    created(c, await studentsService.create(getValidated<CreateStudentInput>(c, 'json'))),
  update: async (c: Context) =>
    ok(c, await studentsService.update(Number(c.req.param('id')), getValidated<UpdateStudentInput>(c, 'json'))),
}
