import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { feesController } from './fees.controller.js'
import { createFeeStructureSchema, createInvoiceSchema, createPaymentSchema } from './fees.schema.js'

export const feesRoutes = new Hono()

feesRoutes.get('/structures', requirePermission('fees.view'), feesController.listStructures)
feesRoutes.get('/structures/:id', requirePermission('fees.view'), feesController.getStructureById)
feesRoutes.post('/structures', requirePermission('fees.structure.manage'), zValidator('json', createFeeStructureSchema), feesController.createStructure)

feesRoutes.get('/invoices', requirePermission('fees.view'), feesController.listInvoices)
feesRoutes.get('/invoices/:id', requirePermission('fees.view'), feesController.getInvoiceById)
feesRoutes.get('/students/:studentId/invoices', requirePermission('fees.view'), feesController.listInvoicesByStudent)
feesRoutes.post('/invoices', requirePermission('fees.invoice.manage'), zValidator('json', createInvoiceSchema), feesController.createInvoice)

feesRoutes.post('/payments', requirePermission('fees.receipt.create'), zValidator('json', createPaymentSchema), feesController.recordPayment)
feesRoutes.get('/students/:studentId/payments', requirePermission('fees.view'), feesController.listPaymentsByStudent)
