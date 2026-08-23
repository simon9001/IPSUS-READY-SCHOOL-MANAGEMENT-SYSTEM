import { Hono } from 'hono';
import { zValidator } from '../../common/validate.js';
import { teachersController } from './teachers.controller.js';
import { createTeacherSchema, updateTeacherSchema } from './teachers.schema.js';
export const teachersRoutes = new Hono();
teachersRoutes.get('/', teachersController.list);
teachersRoutes.get('/:id', teachersController.getById);
teachersRoutes.post('/', zValidator('json', createTeacherSchema), teachersController.create);
teachersRoutes.patch('/:id', zValidator('json', updateTeacherSchema), teachersController.update);
