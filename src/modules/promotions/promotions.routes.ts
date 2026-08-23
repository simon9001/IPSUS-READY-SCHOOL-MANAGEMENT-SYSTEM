import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { promotionsController } from './promotions.controller.js'
import { recordPromotionSchema } from './promotions.schema.js'

export const promotionsRoutes = new Hono()

promotionsRoutes.get('/students/:studentId', promotionsController.listByStudent)
promotionsRoutes.post('/', zValidator('json', recordPromotionSchema), promotionsController.record)
