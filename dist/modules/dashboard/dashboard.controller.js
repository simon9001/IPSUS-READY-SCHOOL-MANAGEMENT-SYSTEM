import { dashboardService } from './dashboard.service.js';
import { ok } from '../../common/response.js';
export const dashboardController = {
    summary: async (c) => ok(c, await dashboardService.summary(c.req.query('asOfDate') ?? new Date().toISOString().slice(0, 10))),
};
