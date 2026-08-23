import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { grantsController } from './grants.controller.js'
import { createGrantTypeSchema, recordDisbursementSchema } from './grants.schema.js'

export const grantsRoutes = new Hono()

grantsRoutes.get('/types', grantsController.listTypes)
grantsRoutes.post('/types', zValidator('json', createGrantTypeSchema), grantsController.createType)

grantsRoutes.get('/disbursements', grantsController.listDisbursements)
grantsRoutes.get('/disbursements/:id', grantsController.getDisbursementById)
grantsRoutes.post('/disbursements', zValidator('json', recordDisbursementSchema), grantsController.recordDisbursement)
