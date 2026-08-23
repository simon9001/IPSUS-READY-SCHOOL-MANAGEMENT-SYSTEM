import { Hono } from 'hono';
import { zValidator } from '../../common/validate.js';
import { staffDisciplineController } from './staffDiscipline.controller.js';
import { createStaffDisciplineRecordSchema } from './staffDiscipline.schema.js';
export const staffDisciplineRoutes = new Hono();
staffDisciplineRoutes.get('/staff/:staffId', staffDisciplineController.listByStaff);
staffDisciplineRoutes.get('/:id', staffDisciplineController.getById);
staffDisciplineRoutes.post('/', zValidator('json', createStaffDisciplineRecordSchema), staffDisciplineController.create);
