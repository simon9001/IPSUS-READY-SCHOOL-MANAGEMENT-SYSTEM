import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requireAuth, requirePermission } from '../../common/auth.js'
import { notificationsController } from './notifications.controller.js'
import { createTemplateSchema, sendNotificationSchema } from './notifications.schema.js'

export const notificationsRoutes = new Hono()

notificationsRoutes.get('/templates', requirePermission('notifications.send'), notificationsController.listTemplates)
notificationsRoutes.post('/templates', requirePermission('notifications.send'), zValidator('json', createTemplateSchema), notificationsController.createTemplate)

// A user reading their own notification inbox just needs to be logged in.
notificationsRoutes.get('/users/:userId', requireAuth(), notificationsController.listByRecipient)
notificationsRoutes.post('/send', requirePermission('notifications.send'), zValidator('json', sendNotificationSchema), notificationsController.send)
