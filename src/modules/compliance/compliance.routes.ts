import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { complianceController } from './compliance.controller.js'
import { generateReportSchema, submitReportSchema } from './compliance.schema.js'

export const complianceRoutes = new Hono()

complianceRoutes.get('/', complianceController.list)
complianceRoutes.get('/:id', complianceController.getById)
complianceRoutes.post('/', zValidator('json', generateReportSchema), complianceController.generate)
complianceRoutes.post('/:id/submit', zValidator('json', submitReportSchema), complianceController.submit)
