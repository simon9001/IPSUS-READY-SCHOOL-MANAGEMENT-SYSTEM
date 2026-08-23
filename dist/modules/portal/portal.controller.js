import { portalService } from './portal.service.js';
import { ok } from '../../common/response.js';
export const portalController = {
    myChildren: async (c) => ok(c, await portalService.myChildren(Number(c.req.param('userId')))),
    feeStatement: async (c) => ok(c, await portalService.feeStatement(Number(c.req.param('userId')), Number(c.req.param('studentId')))),
    reportCard: async (c) => ok(c, await portalService.reportCard(Number(c.req.param('userId')), Number(c.req.param('studentId')), Number(c.req.param('examId')))),
    attendance: async (c) => ok(c, await portalService.attendance(Number(c.req.param('userId')), Number(c.req.param('studentId')))),
    notices: async (c) => ok(c, await portalService.notices(Number(c.req.param('userId')))),
};
