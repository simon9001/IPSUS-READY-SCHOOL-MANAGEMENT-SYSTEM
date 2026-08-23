import { Hono } from 'hono';
import { zValidator } from '../../common/validate.js';
import { noticesController } from './notices.controller.js';
import { createNoticeSchema } from './notices.schema.js';
export const noticesRoutes = new Hono();
noticesRoutes.get('/', noticesController.list);
noticesRoutes.get('/:id', noticesController.getById);
noticesRoutes.post('/', zValidator('json', createNoticeSchema), noticesController.create);
