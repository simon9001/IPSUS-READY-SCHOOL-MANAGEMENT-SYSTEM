import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  goodsReceivedNotes,
  grnItems,
  purchaseOrderItems,
  purchaseOrders,
  purchaseRequisitions,
  requisitionItems,
  supplierInvoices,
  supplierPayments,
  suppliers,
} from '../../db/schema/index.js'
import type {
  NewGoodsReceivedNote,
  NewGrnItem,
  NewPurchaseOrder,
  NewPurchaseOrderItem,
  NewPurchaseRequisition,
  NewRequisitionItem,
  NewSupplier,
  NewSupplierInvoice,
  NewSupplierPayment,
} from './procurement.types.js'

export const procurementRepository = {
  findAllSuppliers: () => db.select().from(suppliers),
  findSupplierById: (id: number) =>
    db.select().from(suppliers).where(eq(suppliers.id, id)).then((rows) => rows[0]),
  createSupplier: (data: NewSupplier) => db.insert(suppliers).values(data).returning().then((rows) => rows[0]),

  findAllRequisitions: () => db.select().from(purchaseRequisitions),
  findRequisitionById: (id: number) =>
    db.select().from(purchaseRequisitions).where(eq(purchaseRequisitions.id, id)).then((rows) => rows[0]),
  findRequisitionItems: (requisitionId: number) =>
    db.select().from(requisitionItems).where(eq(requisitionItems.requisitionId, requisitionId)),
  async createRequisition(data: NewPurchaseRequisition, items: Omit<NewRequisitionItem, 'requisitionId'>[]) {
    return db.transaction(async (tx) => {
      const [requisition] = await tx.insert(purchaseRequisitions).values(data).returning()
      await tx.insert(requisitionItems).values(items.map((item) => ({ ...item, requisitionId: requisition.id })))
      return requisition
    })
  },
  updateRequisitionStatus: (id: number, status: 'approved' | 'rejected' | 'converted_to_lpo', extra: Record<string, unknown> = {}) =>
    db.update(purchaseRequisitions).set({ status, ...extra }).where(eq(purchaseRequisitions.id, id)).returning().then((rows) => rows[0]),

  findAllPurchaseOrders: () => db.select().from(purchaseOrders),
  findPurchaseOrderById: (id: number) =>
    db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).then((rows) => rows[0]),
  findPurchaseOrderItems: (purchaseOrderId: number) =>
    db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId)),
  async createPurchaseOrder(data: NewPurchaseOrder, items: Omit<NewPurchaseOrderItem, 'purchaseOrderId'>[]) {
    return db.transaction(async (tx) => {
      const [po] = await tx.insert(purchaseOrders).values(data).returning()
      const insertedItems = await tx
        .insert(purchaseOrderItems)
        .values(items.map((item) => ({ ...item, purchaseOrderId: po.id })))
        .returning()
      return { po, items: insertedItems }
    })
  },
  findPurchaseOrderItemById: (id: number) =>
    db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.id, id)).then((rows) => rows[0]),

  async createGrn(data: NewGoodsReceivedNote, items: Omit<NewGrnItem, 'grnId'>[]) {
    return db.transaction(async (tx) => {
      const [grn] = await tx.insert(goodsReceivedNotes).values(data).returning()
      await tx.insert(grnItems).values(items.map((item) => ({ ...item, grnId: grn.id })))
      return grn
    })
  },
  updatePurchaseOrderStatus: (id: number, status: 'partially_received' | 'received') =>
    db.update(purchaseOrders).set({ status }).where(eq(purchaseOrders.id, id)).returning().then((rows) => rows[0]),

  findAllSupplierInvoices: () => db.select().from(supplierInvoices),
  findSupplierInvoiceById: (id: number) =>
    db.select().from(supplierInvoices).where(eq(supplierInvoices.id, id)).then((rows) => rows[0]),
  createSupplierInvoice: (data: NewSupplierInvoice) =>
    db.insert(supplierInvoices).values(data).returning().then((rows) => rows[0]),
  attachInvoiceJournalEntry: (id: number, journalEntryId: number) =>
    db.update(supplierInvoices).set({ journalEntryId, status: 'approved' }).where(eq(supplierInvoices.id, id)).returning().then((rows) => rows[0]),
  markInvoicePaid: (id: number) =>
    db.update(supplierInvoices).set({ status: 'paid' }).where(eq(supplierInvoices.id, id)).returning().then((rows) => rows[0]),

  createSupplierPayment: (data: NewSupplierPayment) =>
    db.insert(supplierPayments).values(data).returning().then((rows) => rows[0]),
  attachPaymentJournalEntry: (id: number, journalEntryId: number) =>
    db.update(supplierPayments).set({ journalEntryId }).where(eq(supplierPayments.id, id)).returning().then((rows) => rows[0]),
}
