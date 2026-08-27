import { Hono } from 'hono';
import { zValidator } from '../../common/validate.js';
import { requirePermission } from '../../common/auth.js';
import { healthController } from './health.controller.js';
import { createClinicVisitSchema, createMedicalConditionSchema, recordMedicationSchema } from './health.schema.js';
export const healthRoutes = new Hono();
// Confidential — gated on health.access, not a broader .view sweep.
healthRoutes.get('/conditions/students/:studentId', requirePermission('health.access'), healthController.listConditionsByStudent);
healthRoutes.post('/conditions', requirePermission('health.manage'), zValidator('json', createMedicalConditionSchema), healthController.createCondition);
healthRoutes.get('/visits/students/:studentId', requirePermission('health.access'), healthController.listVisitsByStudent);
healthRoutes.get('/visits/:id', requirePermission('health.access'), healthController.getVisitById);
healthRoutes.post('/visits', requirePermission('health.manage'), zValidator('json', createClinicVisitSchema), healthController.createVisit);
healthRoutes.get('/medications/students/:studentId', requirePermission('health.access'), healthController.listMedicationsByStudent);
healthRoutes.post('/medications', requirePermission('health.manage'), zValidator('json', recordMedicationSchema), healthController.recordMedication);
