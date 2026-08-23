import type { Context } from 'hono'
import { accountsService } from './accounts.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateAccountInput, UpdateAccountInput } from './accounts.schema.js'

export const accountsController = {
  list: async (c: Context) => ok(c, await accountsService.list()),

  getById: async (c: Context) => ok(c, await accountsService.getById(Number(c.req.param('id')))),

  create: async (c: Context) =>
    created(c, await accountsService.create(getValidated<CreateAccountInput>(c, 'json'))),

  update: async (c: Context) =>
    ok(c, await accountsService.update(Number(c.req.param('id')), getValidated<UpdateAccountInput>(c, 'json'))),

  deactivate: async (c: Context) => ok(c, await accountsService.deactivate(Number(c.req.param('id')))),
}
