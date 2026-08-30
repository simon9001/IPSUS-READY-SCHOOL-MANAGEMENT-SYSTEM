import type { Context } from 'hono'
import { dashboardService } from './dashboard.service.js'
import { ok } from '../../common/response.js'

export const dashboardController = {
  summary: async (c: Context) => {
    const user = c.get('user')
    const asOfDate = c.req.query('asOfDate') ?? new Date().toISOString().slice(0, 10)
    return ok(c, await dashboardService.summary(user.permissions, asOfDate))
  },
}
