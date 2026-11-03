import type { Context } from 'hono'
import { procurementService } from './procurement.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { AuthUser } from '../../common/auth.js'
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
  createSupplier: async (c: Context) => created(c, await procurementService.createSupplier(getValidated<CreateSupplierInput>(c, 'json'))),

  listRequisitions: async (c: Context) => ok(c, await procurementService.listRequisitions()),
  getRequisitionById: async (c: Context) => ok(c, await procurementService.getRequisitionById(Number(c.req.param('id')))),
  // The signed-in user is the requester, so approving your own requisition
  // can't be disguised by naming someone else here.
  createRequisition: async (c: Context) =>
    created(
      c,
      await procurementService.createRequisition({
        ...getValidated<CreateRequisitionInput>(c, 'json'),
        requestedBy: (c.get('user') as AuthUser).id,
      }),
    ),
  approveRequisition: async (c: Context) =>
    ok(c, await procurementService.approveRequisition(Number(c.req.param('id')), getValidated<ApproveRequisitionInput>(c, 'json'))),
  rejectRequisition: async (c: Context) => ok(c, await procurementService.rejectRequisition(Number(c.req.param('id')))),

  listPurchaseOrders: async (c: Context) => ok(c, await procurementService.listPurchaseOrders()),
  getPurchaseOrderById: async (c: Context) => ok(c, await procurementService.getPurchaseOrderById(Number(c.req.param('id')))),
  // Raising a document is not approving it: nobody can sign off their own LPO
  // or payment simply by filling in approvedBy.
  createPurchaseOrder: async (c: Context) =>
    created(
      c,
      await procurementService.createPurchaseOrder({ ...getValidated<CreatePurchaseOrderInput>(c, 'json'), approvedBy: undefined }),
    ),

  createGrn: async (c: Context) => created(c, await procurementService.createGrn(getValidated<CreateGrnInput>(c, 'json'))),

  listSupplierInvoices: async (c: Context) => ok(c, await procurementService.listSupplierInvoices()),
  getSupplierInvoiceById: async (c: Context) => ok(c, await procurementService.getSupplierInvoiceById(Number(c.req.param('id')))),
  createSupplierInvoice: async (c: Context) =>
    created(c, await procurementService.createSupplierInvoice(getValidated<CreateSupplierInvoiceInput>(c, 'json'))),

  createSupplierPayment: async (c: Context) =>
    created(
      c,
      await procurementService.createSupplierPayment({ ...getValidated<CreateSupplierPaymentInput>(c, 'json'), approvedBy: undefined }),
    ),
}
