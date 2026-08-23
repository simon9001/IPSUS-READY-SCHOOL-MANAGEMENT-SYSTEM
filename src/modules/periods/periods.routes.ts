import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { periodsController } from './periods.controller.js'
import { createPeriodSchema, updatePeriodSchema } from './periods.schema.js'

export const periodsRoutes = new Hono()

periodsRoutes.get('/', periodsController.list)
periodsRoutes.get('/:id', periodsController.getById)
periodsRoutes.post('/', zValidator('json', createPeriodSchema), periodsController.create)
periodsRoutes.patch('/:id', zValidator('json', updatePeriodSchema), periodsController.update)
periodsRoutes.post('/:id/close', periodsController.close)
