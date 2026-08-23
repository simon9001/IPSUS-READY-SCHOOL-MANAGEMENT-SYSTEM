import { notificationsService } from './notifications.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const notificationsController = {
    listTemplates: async (c) => ok(c, await notificationsService.listTemplates()),
    createTemplate: async (c) => created(c, await notificationsService.createTemplate(getValidated(c, 'json'))),
    listByRecipient: async (c) => ok(c, await notificationsService.listByRecipient(Number(c.req.param('userId')))),
    send: async (c) => created(c, await notificationsService.send(getValidated(c, 'json'))),
};
