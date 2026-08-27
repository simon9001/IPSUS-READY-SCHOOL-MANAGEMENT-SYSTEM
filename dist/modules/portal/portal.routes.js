import { Hono } from 'hono';
import { requirePermission } from '../../common/auth.js';
import { portalController } from './portal.controller.js';
// userId here stands in for "the authenticated guardian" until real auth
// middleware exists — same explicit-actor-id convention used everywhere
// else in this API pending your own auth implementation. Note this only
// checks the caller HAS portal.access, not that :userId matches the caller —
// that per-record ownership check still needs adding at the controller level.
export const portalRoutes = new Hono();
portalRoutes.get('/:userId/children', requirePermission('portal.access'), portalController.myChildren);
portalRoutes.get('/:userId/students/:studentId/fee-statement', requirePermission('portal.access'), portalController.feeStatement);
portalRoutes.get('/:userId/students/:studentId/exams/:examId/report-card', requirePermission('portal.access'), portalController.reportCard);
portalRoutes.get('/:userId/students/:studentId/attendance', requirePermission('portal.access'), portalController.attendance);
portalRoutes.get('/:userId/notices', requirePermission('portal.access'), portalController.notices);
