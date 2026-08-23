import type { Context } from 'hono'
import { budgetsService } from './budgets.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { AddBudgetLineInput, ApproveBudgetInput, CreateBudgetInput } from './budgets.schema.js'

export const budgetsController = {
  list: async (c: Context) => ok(c, await budgetsService.list()),

  getById: async (c: Context) => ok(c, await budgetsService.getById(Number(c.req.param('id')))),

  create: async (c: Context) =>
    created(c, await budgetsService.create(getValidated<CreateBudgetInput>(c, 'json'))),

  addLine: async (c: Context) =>
    created(c, await budgetsService.addLine(Number(c.req.param('id')), getValidated<AddBudgetLineInput>(c, 'json'))),

  approve: async (c: Context) => {
    const { approvedBy } = getValidated<ApproveBudgetInput>(c, 'json')
    return ok(c, await budgetsService.approve(Number(c.req.param('id')), approvedBy))
  },

  budgetVsActual: async (c: Context) => ok(c, await budgetsService.budgetVsActual(Number(c.req.param('id')))),
}
