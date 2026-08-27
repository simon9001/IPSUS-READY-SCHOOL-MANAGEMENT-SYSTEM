import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { guardiansController } from './guardians.controller.js'
import { linkGuardianSchema } from './guardians.schema.js'

export const guardiansRoutes = new Hono()

guardiansRoutes.get('/users/:userId/students', requirePermission('guardians.view'), guardiansController.listStudentsForGuardian)
guardiansRoutes.get('/students/:studentId/guardians', requirePermission('guardians.view'), guardiansController.listGuardiansForStudent)
guardiansRoutes.post('/', requirePermission('guardians.manage'), zValidator('json', linkGuardianSchema), guardiansController.link)
