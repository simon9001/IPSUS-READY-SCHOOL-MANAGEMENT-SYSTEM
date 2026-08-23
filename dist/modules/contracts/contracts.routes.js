import { Hono } from 'hono';
import { zValidator } from '../../common/validate.js';
import { contractsController } from './contracts.controller.js';
import { createContractSchema, updateContractStatusSchema } from './contracts.schema.js';
export const contractsRoutes = new Hono();
contractsRoutes.get('/staff/:staffId', contractsController.listByStaff);
contractsRoutes.get('/:id', contractsController.getById);
contractsRoutes.post('/', zValidator('json', createContractSchema), contractsController.create);
contractsRoutes.patch('/:id/status', zValidator('json', updateContractStatusSchema), contractsController.updateStatus);
