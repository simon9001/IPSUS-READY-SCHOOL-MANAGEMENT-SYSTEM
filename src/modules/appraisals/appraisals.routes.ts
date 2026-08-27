import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { appraisalsController } from './appraisals.controller.js'
import { createAppraisalSchema, updateAppraisalSchema } from './appraisals.schema.js'

export const appraisalsRoutes = new Hono()

appraisalsRoutes.get('/staff/:staffId', requirePermission('appraisals.view'), appraisalsController.listByStaff)
appraisalsRoutes.get('/:id', requirePermission('appraisals.view'), appraisalsController.getById)
appraisalsRoutes.post('/', requirePermission('appraisals.manage'), zValidator('json', createAppraisalSchema), appraisalsController.create)
appraisalsRoutes.patch('/:id', requirePermission('appraisals.manage'), zValidator('json', updateAppraisalSchema), appraisalsController.update)
