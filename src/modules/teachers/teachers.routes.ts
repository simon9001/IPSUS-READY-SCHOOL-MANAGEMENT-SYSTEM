import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { teachersController } from './teachers.controller.js'
import { createTeacherSchema, updateTeacherSchema } from './teachers.schema.js'

export const teachersRoutes = new Hono()

teachersRoutes.get('/', requirePermission('teachers.view'), teachersController.list)
teachersRoutes.get('/:id', requirePermission('teachers.view'), teachersController.getById)
teachersRoutes.post('/', requirePermission('teachers.manage'), zValidator('json', createTeacherSchema), teachersController.create)
teachersRoutes.patch('/:id', requirePermission('teachers.manage'), zValidator('json', updateTeacherSchema), teachersController.update)
