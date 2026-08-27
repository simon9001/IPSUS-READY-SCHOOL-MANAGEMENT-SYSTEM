import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { transportController } from './transport.controller.js'
import { addStopSchema, allocateTransportSchema, createRouteSchema, endAllocationSchema } from './transport.schema.js'

export const transportRoutes = new Hono()

transportRoutes.get('/routes', requirePermission('transport.view'), transportController.listRoutes)
transportRoutes.get('/routes/:id', requirePermission('transport.view'), transportController.getRouteById)
transportRoutes.post('/routes', requirePermission('transport.manage'), zValidator('json', createRouteSchema), transportController.createRoute)

transportRoutes.get('/routes/:routeId/stops', requirePermission('transport.view'), transportController.listStopsByRoute)
transportRoutes.post('/stops', requirePermission('transport.manage'), zValidator('json', addStopSchema), transportController.addStop)

transportRoutes.get('/routes/:routeId/allocations', requirePermission('transport.view'), transportController.listAllocationsByRoute)
transportRoutes.post('/allocations', requirePermission('transport.manage'), zValidator('json', allocateTransportSchema), transportController.allocate)
transportRoutes.post('/allocations/:id/end', requirePermission('transport.manage'), zValidator('json', endAllocationSchema), transportController.endAllocation)
