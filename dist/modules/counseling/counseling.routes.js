import { Hono } from 'hono';
import { zValidator } from '../../common/validate.js';
import { counselingController } from './counseling.controller.js';
import { createCounselingSessionSchema } from './counseling.schema.js';
export const counselingRoutes = new Hono();
counselingRoutes.get('/students/:studentId', counselingController.listByStudent);
counselingRoutes.get('/:id', counselingController.getById);
counselingRoutes.post('/', zValidator('json', createCounselingSessionSchema), counselingController.create);
