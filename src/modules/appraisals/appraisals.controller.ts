import type { Context } from 'hono'
import { appraisalsService } from './appraisals.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateAppraisalInput, UpdateAppraisalInput } from './appraisals.schema.js'

export const appraisalsController = {
  listByStaff: async (c: Context) => ok(c, await appraisalsService.listByStaff(Number(c.req.param('staffId')))),
  getById: async (c: Context) => ok(c, await appraisalsService.getById(Number(c.req.param('id')))),
  create: async (c: Context) =>
    created(c, await appraisalsService.create(getValidated<CreateAppraisalInput>(c, 'json'))),
  update: async (c: Context) =>
    ok(c, await appraisalsService.update(Number(c.req.param('id')), getValidated<UpdateAppraisalInput>(c, 'json'))),
}
