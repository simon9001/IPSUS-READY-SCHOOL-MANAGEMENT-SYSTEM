import type { Context } from 'hono'
import { staffDisciplineService } from './staffDiscipline.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateStaffDisciplineRecordInput } from './staffDiscipline.schema.js'

export const staffDisciplineController = {
  listByStaff: async (c: Context) => ok(c, await staffDisciplineService.listByStaff(Number(c.req.param('staffId')))),
  getById: async (c: Context) => ok(c, await staffDisciplineService.getById(Number(c.req.param('id')))),
  create: async (c: Context) =>
    created(c, await staffDisciplineService.create(getValidated<CreateStaffDisciplineRecordInput>(c, 'json'))),
}
