import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { disciplinaryCasesController } from './disciplinaryCases.controller.js'
import {
  bomReviewSchema,
  decideCaseSchema,
  openCaseSchema,
  recordHearingSchema,
  recordParentAttendanceSchema,
  reinstateCaseSchema,
  summonParentSchema,
} from './disciplinaryCases.schema.js'

export const disciplinaryCasesRoutes = new Hono()

disciplinaryCasesRoutes.get('/', requirePermission('disciplinary_cases.view'), disciplinaryCasesController.list)
disciplinaryCasesRoutes.get('/students/:studentId', requirePermission('disciplinary_cases.view'), disciplinaryCasesController.listByStudent)
disciplinaryCasesRoutes.get('/:id', requirePermission('disciplinary_cases.view'), disciplinaryCasesController.getById)
disciplinaryCasesRoutes.post('/', requirePermission('disciplinary_cases.manage'), zValidator('json', openCaseSchema), disciplinaryCasesController.open)

disciplinaryCasesRoutes.post('/:id/summon-parent', requirePermission('disciplinary_cases.manage'), zValidator('json', summonParentSchema), disciplinaryCasesController.summonParent)
disciplinaryCasesRoutes.post(
  '/:id/parent-attendance',
  requirePermission('disciplinary_cases.manage'),
  zValidator('json', recordParentAttendanceSchema),
  disciplinaryCasesController.recordParentAttendance,
)
disciplinaryCasesRoutes.post('/:id/hearing', requirePermission('disciplinary_cases.manage'), zValidator('json', recordHearingSchema), disciplinaryCasesController.recordHearing)
disciplinaryCasesRoutes.post('/:id/bom-review', requirePermission('disciplinary_cases.manage'), zValidator('json', bomReviewSchema), disciplinaryCasesController.bomReview)
disciplinaryCasesRoutes.post('/:id/decide', requirePermission('disciplinary_cases.manage'), zValidator('json', decideCaseSchema), disciplinaryCasesController.decide)
disciplinaryCasesRoutes.post('/:id/reinstate', requirePermission('disciplinary_cases.manage'), zValidator('json', reinstateCaseSchema), disciplinaryCasesController.reinstate)
disciplinaryCasesRoutes.post('/:id/close', requirePermission('disciplinary_cases.manage'), disciplinaryCasesController.close)
