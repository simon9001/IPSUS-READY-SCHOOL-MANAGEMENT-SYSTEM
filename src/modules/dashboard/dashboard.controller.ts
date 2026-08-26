import type { Context } from 'hono'
import { dashboardService } from './dashboard.service.js'
import { ok } from '../../common/response.js'

export const dashboardController = {
  summary: async (c: Context) =>
    ok(c, await dashboardService.summary(c.req.query('asOfDate') ?? new Date().toISOString().slice(0, 10))),
}
