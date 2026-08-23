import type { Context } from 'hono'
import { notificationsService } from './notifications.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateTemplateInput, SendNotificationInput } from './notifications.schema.js'

export const notificationsController = {
  listTemplates: async (c: Context) => ok(c, await notificationsService.listTemplates()),
  createTemplate: async (c: Context) =>
    created(c, await notificationsService.createTemplate(getValidated<CreateTemplateInput>(c, 'json'))),

  listByRecipient: async (c: Context) => ok(c, await notificationsService.listByRecipient(Number(c.req.param('userId')))),
  send: async (c: Context) => created(c, await notificationsService.send(getValidated<SendNotificationInput>(c, 'json'))),
}
