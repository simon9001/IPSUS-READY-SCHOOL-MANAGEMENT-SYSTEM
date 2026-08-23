import { Hono } from 'hono';
import { zValidator } from '../../common/validate.js';
import { notificationsController } from './notifications.controller.js';
import { createTemplateSchema, sendNotificationSchema } from './notifications.schema.js';
export const notificationsRoutes = new Hono();
notificationsRoutes.get('/templates', notificationsController.listTemplates);
notificationsRoutes.post('/templates', zValidator('json', createTemplateSchema), notificationsController.createTemplate);
notificationsRoutes.get('/users/:userId', notificationsController.listByRecipient);
notificationsRoutes.post('/send', zValidator('json', sendNotificationSchema), notificationsController.send);
