import { Hono } from 'hono';
import { requirePermission } from '../../common/auth.js';
import { systemController } from './system.controller.js';
// No .schema.ts in this module — both routes are reads with no request body
// or query input, so there is nothing for Zod to validate. Same reasoning as
// `portal` having no .repository.ts: the file only exists where it has a job.
export const systemRoutes = new Hono();
// Gated on the two permissions only `system_admin` holds, rather than adding
// a new `system.view` code: a `.view` name would be swept into VIEW_ONLY and
// hand every auditor and BOM member the server's runtime internals.
systemRoutes.get('/health', requirePermission('users.manage'), systemController.health);
systemRoutes.get('/rbac', requirePermission('roles.manage'), systemController.rbacStatus);
