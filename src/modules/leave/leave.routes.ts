import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { leaveController } from './leave.controller.js'
import { createLeaveRequestSchema, createLeaveTypeSchema, decideLeaveRequestSchema } from './leave.schema.js'

export const leaveRoutes = new Hono()

leaveRoutes.get('/types', leaveController.listTypes)
leaveRoutes.post('/types', zValidator('json', createLeaveTypeSchema), leaveController.createType)

leaveRoutes.get('/', leaveController.list)
leaveRoutes.get('/staff/:staffId', leaveController.listByStaff)
leaveRoutes.get('/staff/:staffId/balance', leaveController.balance)
leaveRoutes.get('/:id', leaveController.getById)
leaveRoutes.post('/', zValidator('json', createLeaveRequestSchema), leaveController.apply)
leaveRoutes.post('/:id/approve', zValidator('json', decideLeaveRequestSchema), leaveController.approve)
leaveRoutes.post('/:id/reject', zValidator('json', decideLeaveRequestSchema), leaveController.reject)
