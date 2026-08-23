import { Hono } from 'hono';
import { zValidator } from '../../common/validate.js';
import { disciplineController } from './discipline.controller.js';
import { createDisciplineRecordSchema } from './discipline.schema.js';
export const disciplineRoutes = new Hono();
disciplineRoutes.get('/students/:studentId', disciplineController.listByStudent);
disciplineRoutes.get('/:id', disciplineController.getById);
disciplineRoutes.post('/', zValidator('json', createDisciplineRecordSchema), disciplineController.create);
