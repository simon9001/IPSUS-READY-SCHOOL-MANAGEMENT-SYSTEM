import { Hono } from 'hono';
import { zValidator } from '../../common/validate.js';
import { requirePermission } from '../../common/auth.js';
import { disciplineController } from './discipline.controller.js';
import { createDisciplineRecordSchema } from './discipline.schema.js';
export const disciplineRoutes = new Hono();
disciplineRoutes.get('/students/:studentId', requirePermission('discipline.view'), disciplineController.listByStudent);
disciplineRoutes.get('/:id', requirePermission('discipline.view'), disciplineController.getById);
disciplineRoutes.post('/', requirePermission('discipline.manage'), zValidator('json', createDisciplineRecordSchema), disciplineController.create);
