import type { Context } from 'hono'
import { attendanceService } from './attendance.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { BulkMarkAttendanceInput, MarkAttendanceInput } from './attendance.schema.js'

export const attendanceController = {
  listByStudent: async (c: Context) => ok(c, await attendanceService.listByStudent(Number(c.req.param('studentId')))),

  listByClassAndDate: async (c: Context) =>
    ok(c, await attendanceService.listByClassAndDate(Number(c.req.param('classId')), c.req.query('date') as string)),

  mark: async (c: Context) => created(c, await attendanceService.mark(getValidated<MarkAttendanceInput>(c, 'json'))),

  markBulk: async (c: Context) => {
    const { records } = getValidated<BulkMarkAttendanceInput>(c, 'json')
    return created(c, await attendanceService.markBulk(records))
  },
}
