import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { guardiansController } from './guardians.controller.js'
import { linkGuardianSchema } from './guardians.schema.js'

export const guardiansRoutes = new Hono()

guardiansRoutes.get('/users/:userId/students', guardiansController.listStudentsForGuardian)
guardiansRoutes.get('/students/:studentId/guardians', guardiansController.listGuardiansForStudent)
guardiansRoutes.post('/', zValidator('json', linkGuardianSchema), guardiansController.link)
