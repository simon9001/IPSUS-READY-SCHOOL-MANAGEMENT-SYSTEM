import type { Context } from 'hono'
import { teachersService } from './teachers.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateTeacherInput, UpdateTeacherInput } from './teachers.schema.js'

export const teachersController = {
  list: async (c: Context) => ok(c, await teachersService.list()),
  getById: async (c: Context) => ok(c, await teachersService.getById(Number(c.req.param('id')))),
  create: async (c: Context) =>
    created(c, await teachersService.create(getValidated<CreateTeacherInput>(c, 'json'))),
  update: async (c: Context) =>
    ok(c, await teachersService.update(Number(c.req.param('id')), getValidated<UpdateTeacherInput>(c, 'json'))),
}
