import type { Context } from 'hono'
import { fundsService } from './funds.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateFundInput, UpdateFundInput } from './funds.schema.js'

export const fundsController = {
  list: async (c: Context) => ok(c, await fundsService.list()),

  getById: async (c: Context) => ok(c, await fundsService.getById(Number(c.req.param('id')))),

  create: async (c: Context) =>
    created(c, await fundsService.create(getValidated<CreateFundInput>(c, 'json'))),

  update: async (c: Context) =>
    ok(c, await fundsService.update(Number(c.req.param('id')), getValidated<UpdateFundInput>(c, 'json'))),

  deactivate: async (c: Context) => ok(c, await fundsService.deactivate(Number(c.req.param('id')))),
}
