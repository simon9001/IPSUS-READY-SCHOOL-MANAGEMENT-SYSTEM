import type { Context } from 'hono'
import { leaveService } from './leave.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateLeaveRequestInput, CreateLeaveTypeInput, DecideLeaveRequestInput } from './leave.schema.js'

export const leaveController = {
  listTypes: async (c: Context) => ok(c, await leaveService.listTypes()),
  createType: async (c: Context) =>
    created(c, await leaveService.createType(getValidated<CreateLeaveTypeInput>(c, 'json'))),

  list: async (c: Context) => ok(c, await leaveService.list()),
  listByStaff: async (c: Context) => ok(c, await leaveService.listByStaff(Number(c.req.param('staffId')))),
  getById: async (c: Context) => ok(c, await leaveService.getById(Number(c.req.param('id')))),

  balance: async (c: Context) =>
    ok(
      c,
      await leaveService.balance(
        Number(c.req.param('staffId')),
        Number(c.req.query('leaveTypeId')),
        Number(c.req.query('year') ?? new Date().getFullYear()),
      ),
    ),

  apply: async (c: Context) => created(c, await leaveService.apply(getValidated<CreateLeaveRequestInput>(c, 'json'))),

  approve: async (c: Context) => {
    const { approverId } = getValidated<DecideLeaveRequestInput>(c, 'json')
    return ok(c, await leaveService.approve(Number(c.req.param('id')), approverId))
  },
  reject: async (c: Context) => {
    const { approverId } = getValidated<DecideLeaveRequestInput>(c, 'json')
    return ok(c, await leaveService.reject(Number(c.req.param('id')), approverId))
  },
}
