import type {
  suppliers,
  purchaseRequisitions,
  requisitionItems,
  purchaseOrders,
  purchaseOrderItems,
  goodsReceivedNotes,
  grnItems,
  supplierInvoices,
  supplierPayments,
} from '../../db/schema/index.js'

export type Supplier = typeof suppliers.$inferSelect
export type NewSupplier = typeof suppliers.$inferInsert
export type PurchaseRequisition = typeof purchaseRequisitions.$inferSelect
export type NewPurchaseRequisition = typeof purchaseRequisitions.$inferInsert
export type RequisitionItem = typeof requisitionItems.$inferSelect
export type NewRequisitionItem = typeof requisitionItems.$inferInsert
export type PurchaseOrder = typeof purchaseOrders.$inferSelect
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect
export type NewPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert
export type GoodsReceivedNote = typeof goodsReceivedNotes.$inferSelect
export type NewGoodsReceivedNote = typeof goodsReceivedNotes.$inferInsert
export type GrnItem = typeof grnItems.$inferSelect
export type NewGrnItem = typeof grnItems.$inferInsert
export type SupplierInvoice = typeof supplierInvoices.$inferSelect
export type NewSupplierInvoice = typeof supplierInvoices.$inferInsert
export type SupplierPayment = typeof supplierPayments.$inferSelect
export type NewSupplierPayment = typeof supplierPayments.$inferInsert
