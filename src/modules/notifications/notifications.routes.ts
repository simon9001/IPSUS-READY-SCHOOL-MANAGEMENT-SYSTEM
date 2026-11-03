import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission, requireSelfOrPermission } from '../../common/auth.js'
import { notificationsController } from './notifications.controller.js'
import { createTemplateSchema, sendNotificationSchema } from './notifications.schema.js'

export const notificationsRoutes = new Hono()

notificationsRoutes.get('/templates', requirePermission('notifications.send'), notificationsController.listTemplates)
notificationsRoutes.post(
  '/templates',
  requirePermission('notifications.send'),
  zValidator('json', createTemplateSchema),
  notificationsController.createTemplate,
)

// Bodies can name a student and a disciplinary outcome, so being logged in is
// not enough: it's your own inbox, or you're staff who send notifications.
notificationsRoutes.get('/users/:userId', requireSelfOrPermission('userId', 'notifications.send'), notificationsController.listByRecipient)
notificationsRoutes.post(
  '/send',
  requirePermission('notifications.send'),
  zValidator('json', sendNotificationSchema),
  notificationsController.send,
)
