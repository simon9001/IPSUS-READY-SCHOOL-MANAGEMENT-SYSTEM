import { Hono } from 'hono';
import { requirePermission } from '../../common/auth.js';
import { dashboardController } from './dashboard.controller.js';
export const dashboardRoutes = new Hono();
dashboardRoutes.get('/summary', requirePermission('dashboard.view'), dashboardController.summary);
