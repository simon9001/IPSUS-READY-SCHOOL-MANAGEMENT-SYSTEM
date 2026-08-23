import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { attendanceController } from './attendance.controller.js'
import { bulkMarkAttendanceSchema, markAttendanceSchema } from './attendance.schema.js'

export const attendanceRoutes = new Hono()

attendanceRoutes.get('/students/:studentId', attendanceController.listByStudent)
attendanceRoutes.get('/classes/:classId', attendanceController.listByClassAndDate)
attendanceRoutes.post('/', zValidator('json', markAttendanceSchema), attendanceController.mark)
attendanceRoutes.post('/bulk', zValidator('json', bulkMarkAttendanceSchema), attendanceController.markBulk)
