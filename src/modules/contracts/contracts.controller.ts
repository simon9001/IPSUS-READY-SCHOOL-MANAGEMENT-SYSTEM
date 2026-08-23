import type { Context } from 'hono'
import { contractsService } from './contracts.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateContractInput, UpdateContractStatusInput } from './contracts.schema.js'

export const contractsController = {
  listByStaff: async (c: Context) => ok(c, await contractsService.listByStaff(Number(c.req.param('staffId')))),
  getById: async (c: Context) => ok(c, await contractsService.getById(Number(c.req.param('id')))),
  create: async (c: Context) => created(c, await contractsService.create(getValidated<CreateContractInput>(c, 'json'))),
  updateStatus: async (c: Context) =>
    ok(c, await contractsService.updateStatus(Number(c.req.param('id')), getValidated<UpdateContractStatusInput>(c, 'json'))),
}
