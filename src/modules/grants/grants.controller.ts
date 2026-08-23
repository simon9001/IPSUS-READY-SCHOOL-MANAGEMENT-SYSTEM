import type { Context } from 'hono'
import { grantsService } from './grants.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateGrantTypeInput, RecordDisbursementInput } from './grants.schema.js'

export const grantsController = {
  listTypes: async (c: Context) => ok(c, await grantsService.listTypes()),
  createType: async (c: Context) =>
    created(c, await grantsService.createType(getValidated<CreateGrantTypeInput>(c, 'json'))),

  listDisbursements: async (c: Context) => ok(c, await grantsService.listDisbursements()),
  getDisbursementById: async (c: Context) =>
    ok(c, await grantsService.getDisbursementById(Number(c.req.param('id')))),
  recordDisbursement: async (c: Context) =>
    created(c, await grantsService.recordDisbursement(getValidated<RecordDisbursementInput>(c, 'json'))),
}
