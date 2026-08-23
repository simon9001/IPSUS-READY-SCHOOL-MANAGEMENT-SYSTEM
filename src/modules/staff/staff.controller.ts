import type { Context } from 'hono'
import { staffService } from './staff.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateStaffInput, UpdateStaffInput } from './staff.schema.js'

export const staffController = {
  list: async (c: Context) => ok(c, await staffService.list()),
  getById: async (c: Context) => ok(c, await staffService.getById(Number(c.req.param('id')))),
  create: async (c: Context) => created(c, await staffService.create(getValidated<CreateStaffInput>(c, 'json'))),
  update: async (c: Context) =>
    ok(c, await staffService.update(Number(c.req.param('id')), getValidated<UpdateStaffInput>(c, 'json'))),
}
