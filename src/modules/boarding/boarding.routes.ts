import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { boardingController } from './boarding.controller.js'
import {
  allocateBedSchema,
  bulkMarkBoardingAttendanceSchema,
  createDormitorySchema,
  markBoardingAttendanceSchema,
  vacateBedSchema,
} from './boarding.schema.js'

export const boardingRoutes = new Hono()

boardingRoutes.get('/dormitories', requirePermission('boarding.view'), boardingController.listDormitories)
boardingRoutes.get('/dormitories/:id', requirePermission('boarding.view'), boardingController.getDormitoryById)
boardingRoutes.post('/dormitories', requirePermission('boarding.manage'), zValidator('json', createDormitorySchema), boardingController.createDormitory)
boardingRoutes.get('/dormitories/:dormitoryId/allocations', requirePermission('boarding.view'), boardingController.listAllocationsByDormitory)

boardingRoutes.post('/allocations', requirePermission('boarding.manage'), zValidator('json', allocateBedSchema), boardingController.allocateBed)
boardingRoutes.post('/allocations/:id/vacate', requirePermission('boarding.manage'), zValidator('json', vacateBedSchema), boardingController.vacateBed)

boardingRoutes.get('/attendance/students/:studentId', requirePermission('boarding.view'), boardingController.listAttendanceByStudent)
boardingRoutes.post('/attendance', requirePermission('boarding.manage'), zValidator('json', markBoardingAttendanceSchema), boardingController.markAttendance)
boardingRoutes.post('/attendance/bulk', requirePermission('boarding.manage'), zValidator('json', bulkMarkBoardingAttendanceSchema), boardingController.markAttendanceBulk)
