import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
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

admissionsRoutes.get('/', admissionsController.list)
admissionsRoutes.get('/:id', admissionsController.getById)

// Placement and transfer: no interview, straight to 'admitted'.
admissionsRoutes.post('/placements', zValidator('json', capturePlacementSchema), admissionsController.capturePlacement)
admissionsRoutes.post('/transfers', zValidator('json', captureTransferSchema), admissionsController.captureTransfer)

// Direct/local admission: full application -> interview -> decision flow.
admissionsRoutes.post('/applications', zValidator('json', applyDirectSchema), admissionsController.applyDirect)
admissionsRoutes.post('/:id/interview/schedule', zValidator('json', scheduleInterviewSchema), admissionsController.scheduleInterview)
admissionsRoutes.post('/:id/interview/result', zValidator('json', recordInterviewResultSchema), admissionsController.recordInterviewResult)
admissionsRoutes.post('/:id/decide', zValidator('json', decideAdmissionSchema), admissionsController.decide)

// Common to all three pathways once status = 'admitted'.
admissionsRoutes.post('/:id/enroll', zValidator('json', enrollAdmissionSchema), admissionsController.enroll)
