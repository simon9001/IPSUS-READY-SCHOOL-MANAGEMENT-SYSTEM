import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { admissionsController } from './admissions.controller.js'
import {
  applyDirectSchema,
  capturePlacementSchema,
  captureTransferSchema,
  decideAdmissionSchema,
  enrollAdmissionSchema,
  recordInterviewResultSchema,
  scheduleInterviewSchema,
} from './admissions.schema.js'

export const admissionsRoutes = new Hono()

admissionsRoutes.get('/', requirePermission('admissions.view'), admissionsController.list)
admissionsRoutes.get('/:id', requirePermission('admissions.view'), admissionsController.getById)

// Placement and transfer: no interview, straight to 'admitted'.
admissionsRoutes.post('/placements', requirePermission('admissions.manage'), zValidator('json', capturePlacementSchema), admissionsController.capturePlacement)
admissionsRoutes.post('/transfers', requirePermission('admissions.manage'), zValidator('json', captureTransferSchema), admissionsController.captureTransfer)

// Direct/local admission: full application -> interview -> decision flow.
admissionsRoutes.post('/applications', requirePermission('admissions.manage'), zValidator('json', applyDirectSchema), admissionsController.applyDirect)
admissionsRoutes.post('/:id/interview/schedule', requirePermission('admissions.manage'), zValidator('json', scheduleInterviewSchema), admissionsController.scheduleInterview)
admissionsRoutes.post('/:id/interview/result', requirePermission('admissions.manage'), zValidator('json', recordInterviewResultSchema), admissionsController.recordInterviewResult)
admissionsRoutes.post('/:id/decide', requirePermission('admissions.manage'), zValidator('json', decideAdmissionSchema), admissionsController.decide)

// Common to all three pathways once status = 'admitted'.
admissionsRoutes.post('/:id/enroll', requirePermission('admissions.manage'), zValidator('json', enrollAdmissionSchema), admissionsController.enroll)
