import type { Context } from 'hono'
import { counselingService } from './counseling.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateCounselingSessionInput } from './counseling.schema.js'

export const counselingController = {
  listByStudent: async (c: Context) => ok(c, await counselingService.listByStudent(Number(c.req.param('studentId')))),
  getById: async (c: Context) => ok(c, await counselingService.getById(Number(c.req.param('id')))),
  create: async (c: Context) =>
    created(c, await counselingService.create(getValidated<CreateCounselingSessionInput>(c, 'json'))),
}
