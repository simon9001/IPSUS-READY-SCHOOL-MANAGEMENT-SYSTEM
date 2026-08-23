import type { Context } from 'hono'
import { periodsService } from './periods.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreatePeriodInput, UpdatePeriodInput } from './periods.schema.js'

export const periodsController = {
  list: async (c: Context) => ok(c, await periodsService.list()),

  getById: async (c: Context) => ok(c, await periodsService.getById(Number(c.req.param('id')))),

  create: async (c: Context) =>
    created(c, await periodsService.create(getValidated<CreatePeriodInput>(c, 'json'))),

  update: async (c: Context) =>
    ok(c, await periodsService.update(Number(c.req.param('id')), getValidated<UpdatePeriodInput>(c, 'json'))),

  close: async (c: Context) => ok(c, await periodsService.close(Number(c.req.param('id')))),
}
