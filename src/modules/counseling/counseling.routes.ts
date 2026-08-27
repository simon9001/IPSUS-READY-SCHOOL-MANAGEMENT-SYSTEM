import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { counselingController } from './counseling.controller.js'
import { createCounselingSessionSchema } from './counseling.schema.js'

export const counselingRoutes = new Hono()

// Confidential — gated on counseling.access (not a broader .view sweep),
// same reasoning as health records: counselor/principal only.
counselingRoutes.get('/students/:studentId', requirePermission('counseling.access'), counselingController.listByStudent)
counselingRoutes.get('/:id', requirePermission('counseling.access'), counselingController.getById)
counselingRoutes.post('/', requirePermission('counseling.manage'), zValidator('json', createCounselingSessionSchema), counselingController.create)
