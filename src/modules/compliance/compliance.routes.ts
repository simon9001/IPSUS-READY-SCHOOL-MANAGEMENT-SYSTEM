import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { complianceController } from './compliance.controller.js'
import { generateReportSchema, submitReportSchema } from './compliance.schema.js'

export const complianceRoutes = new Hono()

complianceRoutes.get('/', requirePermission('compliance.view'), complianceController.list)
complianceRoutes.get('/:id', requirePermission('compliance.view'), complianceController.getById)
complianceRoutes.post('/', requirePermission('compliance.manage'), zValidator('json', generateReportSchema), complianceController.generate)
complianceRoutes.post('/:id/submit', requirePermission('compliance.manage'), zValidator('json', submitReportSchema), complianceController.submit)
