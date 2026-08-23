import type { Context } from 'hono'
import { promotionsService } from './promotions.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { RecordPromotionInput } from './promotions.schema.js'

export const promotionsController = {
  listByStudent: async (c: Context) => ok(c, await promotionsService.listByStudent(Number(c.req.param('studentId')))),
  record: async (c: Context) =>
    created(c, await promotionsService.record(getValidated<RecordPromotionInput>(c, 'json'))),
}
