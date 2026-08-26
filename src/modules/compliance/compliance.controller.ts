import type { Context } from 'hono'
import { complianceService } from './compliance.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { GenerateReportInput, SubmitReportInput } from './compliance.schema.js'

export const complianceController = {
  list: async (c: Context) => ok(c, await complianceService.list()),
  getById: async (c: Context) => ok(c, await complianceService.getById(Number(c.req.param('id')))),
  generate: async (c: Context) => created(c, await complianceService.generate(getValidated<GenerateReportInput>(c, 'json'))),
  submit: async (c: Context) => {
    const { referenceNumber, submittedBy } = getValidated<SubmitReportInput>(c, 'json')
    return ok(c, await complianceService.submit(Number(c.req.param('id')), referenceNumber, submittedBy))
  },
}
