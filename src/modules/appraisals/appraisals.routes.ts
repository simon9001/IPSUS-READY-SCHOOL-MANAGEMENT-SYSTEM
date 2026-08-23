import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { appraisalsController } from './appraisals.controller.js'
import { createAppraisalSchema, updateAppraisalSchema } from './appraisals.schema.js'

export const appraisalsRoutes = new Hono()

appraisalsRoutes.get('/staff/:staffId', appraisalsController.listByStaff)
appraisalsRoutes.get('/:id', appraisalsController.getById)
appraisalsRoutes.post('/', zValidator('json', createAppraisalSchema), appraisalsController.create)
appraisalsRoutes.patch('/:id', zValidator('json', updateAppraisalSchema), appraisalsController.update)
