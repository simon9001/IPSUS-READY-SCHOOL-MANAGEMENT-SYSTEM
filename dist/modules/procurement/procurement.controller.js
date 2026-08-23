import { procurementService } from './procurement.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const procurementController = {
    listSuppliers: async (c) => ok(c, await procurementService.listSuppliers()),
    getSupplierById: async (c) => ok(c, await procurementService.getSupplierById(Number(c.req.param('id')))),
    createSupplier: async (c) => created(c, await procurementService.createSupplier(getValidated(c, 'json'))),
    listRequisitions: async (c) => ok(c, await procurementService.listRequisitions()),
    getRequisitionById: async (c) => ok(c, await procurementService.getRequisitionById(Number(c.req.param('id')))),
    createRequisition: async (c) => created(c, await procurementService.createRequisition(getValidated(c, 'json'))),
    approveRequisition: async (c) => ok(c, await procurementService.approveRequisition(Number(c.req.param('id')), getValidated(c, 'json'))),
    rejectRequisition: async (c) => ok(c, await procurementService.rejectRequisition(Number(c.req.param('id')))),
    listPurchaseOrders: async (c) => ok(c, await procurementService.listPurchaseOrders()),
    getPurchaseOrderById: async (c) => ok(c, await procurementService.getPurchaseOrderById(Number(c.req.param('id')))),
    createPurchaseOrder: async (c) => created(c, await procurementService.createPurchaseOrder(getValidated(c, 'json'))),
    createGrn: async (c) => created(c, await procurementService.createGrn(getValidated(c, 'json'))),
    listSupplierInvoices: async (c) => ok(c, await procurementService.listSupplierInvoices()),
    getSupplierInvoiceById: async (c) => ok(c, await procurementService.getSupplierInvoiceById(Number(c.req.param('id')))),
    createSupplierInvoice: async (c) => created(c, await procurementService.createSupplierInvoice(getValidated(c, 'json'))),
    createSupplierPayment: async (c) => created(c, await procurementService.createSupplierPayment(getValidated(c, 'json'))),
};
