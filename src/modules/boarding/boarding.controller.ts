import type { Context } from 'hono'
import { boardingService } from './boarding.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type {
  AllocateBedInput,
  BulkMarkBoardingAttendanceInput,
  CreateDormitoryInput,
  MarkBoardingAttendanceInput,
  VacateBedInput,
} from './boarding.schema.js'

export const boardingController = {
  listDormitories: async (c: Context) => ok(c, await boardingService.listDormitories()),
  getDormitoryById: async (c: Context) => ok(c, await boardingService.getDormitoryById(Number(c.req.param('id')))),
  createDormitory: async (c: Context) =>
    created(c, await boardingService.createDormitory(getValidated<CreateDormitoryInput>(c, 'json'))),

  listAllocationsByDormitory: async (c: Context) =>
    ok(c, await boardingService.listAllocationsByDormitory(Number(c.req.param('dormitoryId')))),
  allocateBed: async (c: Context) =>
    created(c, await boardingService.allocateBed(getValidated<AllocateBedInput>(c, 'json'))),
  vacateBed: async (c: Context) => {
    const { vacatedDate } = getValidated<VacateBedInput>(c, 'json')
    return ok(c, await boardingService.vacateBed(Number(c.req.param('id')), vacatedDate))
  },

  listAttendanceByStudent: async (c: Context) =>
    ok(c, await boardingService.listAttendanceByStudent(Number(c.req.param('studentId')))),
  markAttendance: async (c: Context) =>
    created(c, await boardingService.markAttendance(getValidated<MarkBoardingAttendanceInput>(c, 'json'))),
  markAttendanceBulk: async (c: Context) => {
    const { records } = getValidated<BulkMarkBoardingAttendanceInput>(c, 'json')
    return created(c, await boardingService.markAttendanceBulk(records))
  },
}
