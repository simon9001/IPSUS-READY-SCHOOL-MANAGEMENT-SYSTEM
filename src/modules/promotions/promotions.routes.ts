import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { promotionsController } from './promotions.controller.js'
import { recordPromotionSchema } from './promotions.schema.js'

export const promotionsRoutes = new Hono()

promotionsRoutes.get('/students/:studentId', requirePermission('promotions.view'), promotionsController.listByStudent)
promotionsRoutes.post('/', requirePermission('promotions.manage'), zValidator('json', recordPromotionSchema), promotionsController.record)
