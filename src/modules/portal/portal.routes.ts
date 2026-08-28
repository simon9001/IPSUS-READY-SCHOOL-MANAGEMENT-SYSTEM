import { Hono } from 'hono'
import { requirePermission, requireSelf } from '../../common/auth.js'
import { portalController } from './portal.controller.js'

// requireSelf('userId') ensures the token's own id matches the :userId in
// the URL — otherwise any guardian with portal.access could read another
// guardian's linked-children data just by changing the path.
export const portalRoutes = new Hono()

portalRoutes.get('/:userId/children', requirePermission('portal.access'), requireSelf('userId'), portalController.myChildren)
portalRoutes.get('/:userId/students/:studentId/fee-statement', requirePermission('portal.access'), requireSelf('userId'), portalController.feeStatement)
portalRoutes.get('/:userId/students/:studentId/exams/:examId/report-card', requirePermission('portal.access'), requireSelf('userId'), portalController.reportCard)
portalRoutes.get('/:userId/students/:studentId/attendance', requirePermission('portal.access'), requireSelf('userId'), portalController.attendance)
portalRoutes.get('/:userId/notices', requirePermission('portal.access'), requireSelf('userId'), portalController.notices)
