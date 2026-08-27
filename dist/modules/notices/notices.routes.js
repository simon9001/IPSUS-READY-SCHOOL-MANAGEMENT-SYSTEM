import { Hono } from 'hono';
import { zValidator } from '../../common/validate.js';
import { requireAuth, requirePermission } from '../../common/auth.js';
import { noticesController } from './notices.controller.js';
import { createNoticeSchema } from './notices.schema.js';
export const noticesRoutes = new Hono();
// Notices are staff-wide announcements — no dedicated notices.view exists
// (any authenticated staff member should be able to read them); only
// publishing requires notices.manage.
noticesRoutes.get('/', requireAuth(), noticesController.list);
noticesRoutes.get('/:id', requireAuth(), noticesController.getById);
noticesRoutes.post('/', requirePermission('notices.manage'), zValidator('json', createNoticeSchema), noticesController.create);
