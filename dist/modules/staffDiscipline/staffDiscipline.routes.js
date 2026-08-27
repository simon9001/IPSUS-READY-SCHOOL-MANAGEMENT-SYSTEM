import { Hono } from 'hono';
import { zValidator } from '../../common/validate.js';
import { requirePermission } from '../../common/auth.js';
import { staffDisciplineController } from './staffDiscipline.controller.js';
import { createStaffDisciplineRecordSchema } from './staffDiscipline.schema.js';
export const staffDisciplineRoutes = new Hono();
staffDisciplineRoutes.get('/staff/:staffId', requirePermission('staff_discipline.view'), staffDisciplineController.listByStaff);
staffDisciplineRoutes.get('/:id', requirePermission('staff_discipline.view'), staffDisciplineController.getById);
staffDisciplineRoutes.post('/', requirePermission('staff_discipline.manage'), zValidator('json', createStaffDisciplineRecordSchema), staffDisciplineController.create);
