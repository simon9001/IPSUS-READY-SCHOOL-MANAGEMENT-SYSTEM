import type { Context } from 'hono'
import { feesService } from './fees.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateFeeStructureInput, CreateInvoiceInput, CreatePaymentInput } from './fees.schema.js'

export const feesController = {
  listStructures: async (c: Context) => ok(c, await feesService.listStructures()),
  getStructureById: async (c: Context) => ok(c, await feesService.getStructureById(Number(c.req.param('id')))),
  createStructure: async (c: Context) =>
    created(c, await feesService.createStructure(getValidated<CreateFeeStructureInput>(c, 'json'))),

  listInvoices: async (c: Context) => ok(c, await feesService.listInvoices()),
  getInvoiceById: async (c: Context) => ok(c, await feesService.getInvoiceById(Number(c.req.param('id')))),
  listInvoicesByStudent: async (c: Context) =>
    ok(c, await feesService.listInvoicesByStudent(Number(c.req.param('studentId')))),
  createInvoice: async (c: Context) =>
    created(c, await feesService.createInvoice(getValidated<CreateInvoiceInput>(c, 'json'))),

  recordPayment: async (c: Context) =>
    created(c, await feesService.recordPayment(getValidated<CreatePaymentInput>(c, 'json'))),
  listPaymentsByStudent: async (c: Context) =>
    ok(c, await feesService.listPaymentsByStudent(Number(c.req.param('studentId')))),
}
