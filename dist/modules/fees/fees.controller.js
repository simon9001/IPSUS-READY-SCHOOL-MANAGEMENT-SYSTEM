import { feesService } from './fees.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const feesController = {
    listStructures: async (c) => ok(c, await feesService.listStructures()),
    getStructureById: async (c) => ok(c, await feesService.getStructureById(Number(c.req.param('id')))),
    createStructure: async (c) => created(c, await feesService.createStructure(getValidated(c, 'json'))),
    listInvoices: async (c) => ok(c, await feesService.listInvoices()),
    getInvoiceById: async (c) => ok(c, await feesService.getInvoiceById(Number(c.req.param('id')))),
    listInvoicesByStudent: async (c) => ok(c, await feesService.listInvoicesByStudent(Number(c.req.param('studentId')))),
    createInvoice: async (c) => created(c, await feesService.createInvoice(getValidated(c, 'json'))),
    recordPayment: async (c) => created(c, await feesService.recordPayment(getValidated(c, 'json'))),
    listPaymentsByStudent: async (c) => ok(c, await feesService.listPaymentsByStudent(Number(c.req.param('studentId')))),
};
