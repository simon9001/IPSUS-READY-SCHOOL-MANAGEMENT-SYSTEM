import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { transportController } from './transport.controller.js'
import { addStopSchema, allocateTransportSchema, createRouteSchema, endAllocationSchema } from './transport.schema.js'

export const transportRoutes = new Hono()

transportRoutes.get('/routes', transportController.listRoutes)
transportRoutes.get('/routes/:id', transportController.getRouteById)
transportRoutes.post('/routes', zValidator('json', createRouteSchema), transportController.createRoute)

transportRoutes.get('/routes/:routeId/stops', transportController.listStopsByRoute)
transportRoutes.post('/stops', zValidator('json', addStopSchema), transportController.addStop)

transportRoutes.get('/routes/:routeId/allocations', transportController.listAllocationsByRoute)
transportRoutes.post('/allocations', zValidator('json', allocateTransportSchema), transportController.allocate)
transportRoutes.post('/allocations/:id/end', zValidator('json', endAllocationSchema), transportController.endAllocation)
