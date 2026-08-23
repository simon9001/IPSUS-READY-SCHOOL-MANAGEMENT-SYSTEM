import type { Context } from 'hono'
import { procurementService } from './procurement.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type {
  ApproveRequisitionInput,
  CreateGrnInput,
  CreatePurchaseOrderInput,
  CreateRequisitionInput,
  CreateSupplierInput,
  CreateSupplierInvoiceInput,
  CreateSupplierPaymentInput,
} from './procurement.schema.js'

export const procurementController = {
  listSuppliers: async (c: Context) => ok(c, await procurementService.listSuppliers()),
  getSupplierById: async (c: Context) => ok(c, await procurementService.getSupplierById(Number(c.req.param('id')))),
  createSupplier: async (c: Context) =>
    created(c, await procurementService.createSupplier(getValidated<CreateSupplierInput>(c, 'json'))),

  listRequisitions: async (c: Context) => ok(c, await procurementService.listRequisitions()),
  getRequisitionById: async (c: Context) => ok(c, await procurementService.getRequisitionById(Number(c.req.param('id')))),
  createRequisition: async (c: Context) =>
    created(c, await procurementService.createRequisition(getValidated<CreateRequisitionInput>(c, 'json'))),
  approveRequisition: async (c: Context) =>
    ok(c, await procurementService.approveRequisition(Number(c.req.param('id')), getValidated<ApproveRequisitionInput>(c, 'json'))),
  rejectRequisition: async (c: Context) => ok(c, await procurementService.rejectRequisition(Number(c.req.param('id')))),

  listPurchaseOrders: async (c: Context) => ok(c, await procurementService.listPurchaseOrders()),
  getPurchaseOrderById: async (c: Context) => ok(c, await procurementService.getPurchaseOrderById(Number(c.req.param('id')))),
  createPurchaseOrder: async (c: Context) =>
    created(c, await procurementService.createPurchaseOrder(getValidated<CreatePurchaseOrderInput>(c, 'json'))),

  createGrn: async (c: Context) =>
    created(c, await procurementService.createGrn(getValidated<CreateGrnInput>(c, 'json'))),

  listSupplierInvoices: async (c: Context) => ok(c, await procurementService.listSupplierInvoices()),
  getSupplierInvoiceById: async (c: Context) =>
    ok(c, await procurementService.getSupplierInvoiceById(Number(c.req.param('id')))),
  createSupplierInvoice: async (c: Context) =>
    created(c, await procurementService.createSupplierInvoice(getValidated<CreateSupplierInvoiceInput>(c, 'json'))),

  createSupplierPayment: async (c: Context) =>
    created(c, await procurementService.createSupplierPayment(getValidated<CreateSupplierPaymentInput>(c, 'json'))),
}
