import { Hono } from 'hono';
import { zValidator } from '../../common/validate.js';
import { staffController } from './staff.controller.js';
import { createStaffSchema, updateStaffSchema } from './staff.schema.js';
export const staffRoutes = new Hono();
staffRoutes.get('/', staffController.list);
staffRoutes.get('/:id', staffController.getById);
staffRoutes.post('/', zValidator('json', createStaffSchema), staffController.create);
staffRoutes.patch('/:id', zValidator('json', updateStaffSchema), staffController.update);
