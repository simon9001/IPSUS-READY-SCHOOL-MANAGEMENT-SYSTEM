import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { goodsReceivedNotes, grnItems, purchaseOrderItems, purchaseOrders, purchaseRequisitions, requisitionItems, supplierInvoices, supplierPayments, suppliers, } from '../../db/schema/index.js';
export const procurementRepository = {
    findAllSuppliers: () => db.select().from(suppliers),
    findSupplierById: (id) => db.select().from(suppliers).where(eq(suppliers.id, id)).then((rows) => rows[0]),
    createSupplier: (data) => db.insert(suppliers).values(data).returning().then((rows) => rows[0]),
    findAllRequisitions: () => db.select().from(purchaseRequisitions),
    findRequisitionById: (id) => db.select().from(purchaseRequisitions).where(eq(purchaseRequisitions.id, id)).then((rows) => rows[0]),
    findRequisitionItems: (requisitionId) => db.select().from(requisitionItems).where(eq(requisitionItems.requisitionId, requisitionId)),
    async createRequisition(data, items) {
        return db.transaction(async (tx) => {
            const [requisition] = await tx.insert(purchaseRequisitions).values(data).returning();
            await tx.insert(requisitionItems).values(items.map((item) => ({ ...item, requisitionId: requisition.id })));
            return requisition;
        });
    },
    updateRequisitionStatus: (id, status, extra = {}) => db.update(purchaseRequisitions).set({ status, ...extra }).where(eq(purchaseRequisitions.id, id)).returning().then((rows) => rows[0]),
    findAllPurchaseOrders: () => db.select().from(purchaseOrders),
    findPurchaseOrderById: (id) => db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).then((rows) => rows[0]),
    findPurchaseOrderItems: (purchaseOrderId) => db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId)),
    async createPurchaseOrder(data, items) {
        return db.transaction(async (tx) => {
            const [po] = await tx.insert(purchaseOrders).values(data).returning();
            const insertedItems = await tx
                .insert(purchaseOrderItems)
                .values(items.map((item) => ({ ...item, purchaseOrderId: po.id })))
                .returning();
            return { po, items: insertedItems };
        });
    },
    findPurchaseOrderItemById: (id) => db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.id, id)).then((rows) => rows[0]),
    async createGrn(data, items) {
        return db.transaction(async (tx) => {
            const [grn] = await tx.insert(goodsReceivedNotes).values(data).returning();
            await tx.insert(grnItems).values(items.map((item) => ({ ...item, grnId: grn.id })));
            return grn;
        });
    },
    updatePurchaseOrderStatus: (id, status) => db.update(purchaseOrders).set({ status }).where(eq(purchaseOrders.id, id)).returning().then((rows) => rows[0]),
    findAllSupplierInvoices: () => db.select().from(supplierInvoices),
    findSupplierInvoiceById: (id) => db.select().from(supplierInvoices).where(eq(supplierInvoices.id, id)).then((rows) => rows[0]),
    createSupplierInvoice: (data) => db.insert(supplierInvoices).values(data).returning().then((rows) => rows[0]),
    attachInvoiceJournalEntry: (id, journalEntryId) => db.update(supplierInvoices).set({ journalEntryId, status: 'approved' }).where(eq(supplierInvoices.id, id)).returning().then((rows) => rows[0]),
    markInvoicePaid: (id) => db.update(supplierInvoices).set({ status: 'paid' }).where(eq(supplierInvoices.id, id)).returning().then((rows) => rows[0]),
    createSupplierPayment: (data) => db.insert(supplierPayments).values(data).returning().then((rows) => rows[0]),
    attachPaymentJournalEntry: (id, journalEntryId) => db.update(supplierPayments).set({ journalEntryId }).where(eq(supplierPayments.id, id)).returning().then((rows) => rows[0]),
};
