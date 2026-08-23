import { Hono } from 'hono';
import { portalController } from './portal.controller.js';
// userId here stands in for "the authenticated guardian" until real auth
// middleware exists — same explicit-actor-id convention used everywhere
// else in this API pending your own auth implementation.
export const portalRoutes = new Hono();
portalRoutes.get('/:userId/children', portalController.myChildren);
portalRoutes.get('/:userId/students/:studentId/fee-statement', portalController.feeStatement);
portalRoutes.get('/:userId/students/:studentId/exams/:examId/report-card', portalController.reportCard);
portalRoutes.get('/:userId/students/:studentId/attendance', portalController.attendance);
portalRoutes.get('/:userId/notices', portalController.notices);
