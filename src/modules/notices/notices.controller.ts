import type { Context } from 'hono'
import { noticesService } from './notices.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateNoticeInput } from './notices.schema.js'

export const noticesController = {
  list: async (c: Context) => ok(c, await noticesService.list()),
  getById: async (c: Context) => ok(c, await noticesService.getById(Number(c.req.param('id')))),
  create: async (c: Context) => created(c, await noticesService.create(getValidated<CreateNoticeInput>(c, 'json'))),
}
