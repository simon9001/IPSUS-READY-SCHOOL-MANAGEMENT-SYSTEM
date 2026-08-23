import { pgTable, serial, varchar, text, integer, numeric, date, pgEnum, timestamp } from 'drizzle-orm/pg-core'
import { accounts } from './accounts.js'
import { journalEntries } from './journal.js'
import { users } from './identity.js'

export const supplierStatusEnum = pgEnum('supplier_status', ['active', 'inactive'])

export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  kraPin: varchar('kra_pin', { length: 20 }),
  contactPerson: varchar('contact_person', { length: 100 }),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 150 }),
  bankName: varchar('bank_name', { length: 100 }),
  bankAccountNo: varchar('bank_account_no', { length: 40 }),
  status: supplierStatusEnum('status').notNull().default('active'),
})

export const requisitionStatusEnum = pgEnum('requisition_status', ['draft', 'submitted', 'approved', 'rejected', 'converted_to_lpo'])

export const purchaseRequisitions = pgTable('purchase_requisitions', {
  id: serial('id').primaryKey(),
  requisitionNo: varchar('requisition_no', { length: 30 }).notNull().unique(),
  requestedBy: integer('requested_by').notNull().references(() => users.id),
  department: varchar('department', { length: 80 }),
  requestDate: date('request_date').notNull(),
  status: requisitionStatusEnum('status').notNull().default('draft'),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
})

export const requisitionItems = pgTable('requisition_items', {
  id: serial('id').primaryKey(),
  requisitionId: integer('requisition_id').notNull().references(() => purchaseRequisitions.id, { onDelete: 'cascade' }),
  description: varchar('description', { length: 200 }).notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull(),
  estimatedUnitCost: numeric('estimated_unit_cost', { precision: 14, scale: 2 }),
  accountId: integer('account_id').notNull().references(() => accounts.id),
})

export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', ['draft', 'issued', 'partially_received', 'received', 'cancelled'])

export const purchaseOrders = pgTable('purchase_orders', {
  id: serial('id').primaryKey(),
  lpoNo: varchar('lpo_no', { length: 30 }).notNull().unique(),
  supplierId: integer('supplier_id').notNull().references(() => suppliers.id),
  requisitionId: integer('requisition_id').references(() => purchaseRequisitions.id),
  orderDate: date('order_date').notNull(),
  status: purchaseOrderStatusEnum('status').notNull().default('draft'),
  totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull(),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
})

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: serial('id').primaryKey(),
  purchaseOrderId: integer('purchase_order_id').notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  description: varchar('description', { length: 200 }).notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull(),
  unitCost: numeric('unit_cost', { precision: 14, scale: 2 }).notNull(),
  accountId: integer('account_id').notNull().references(() => accounts.id),
})

export const goodsReceivedNotes = pgTable('goods_received_notes', {
  id: serial('id').primaryKey(),
  grnNo: varchar('grn_no', { length: 30 }).notNull().unique(),
  purchaseOrderId: integer('purchase_order_id').notNull().references(() => purchaseOrders.id),
  receivedDate: date('received_date').notNull(),
  receivedBy: integer('received_by').notNull().references(() => users.id),
})

export const grnItems = pgTable('grn_items', {
  id: serial('id').primaryKey(),
  grnId: integer('grn_id').notNull().references(() => goodsReceivedNotes.id, { onDelete: 'cascade' }),
  purchaseOrderItemId: integer('purchase_order_item_id').notNull().references(() => purchaseOrderItems.id),
  quantityReceived: numeric('quantity_received', { precision: 12, scale: 2 }).notNull(),
  condition: varchar('condition', { length: 100 }),
})

export const supplierInvoiceStatusEnum = pgEnum('supplier_invoice_status', ['pending', 'approved', 'paid', 'disputed'])

export const supplierInvoices = pgTable('supplier_invoices', {
  id: serial('id').primaryKey(),
  invoiceNo: varchar('invoice_no', { length: 40 }).notNull(),
  supplierId: integer('supplier_id').notNull().references(() => suppliers.id),
  purchaseOrderId: integer('purchase_order_id').references(() => purchaseOrders.id),
  grnId: integer('grn_id').references(() => goodsReceivedNotes.id),
  invoiceDate: date('invoice_date').notNull(),
  dueDate: date('due_date'),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  status: supplierInvoiceStatusEnum('status').notNull().default('pending'),
  journalEntryId: integer('journal_entry_id').references(() => journalEntries.id), // Dr Expense/Asset / Cr Creditors
})

export const supplierPayments = pgTable('supplier_payments', {
  id: serial('id').primaryKey(),
  supplierInvoiceId: integer('supplier_invoice_id').notNull().references(() => supplierInvoices.id),
  paymentDate: date('payment_date').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(), // 'bank' | 'cheque' | 'mpesa'
  referenceNo: varchar('reference_no', { length: 60 }),
  journalEntryId: integer('journal_entry_id').references(() => journalEntries.id), // Dr Creditors / Cr Bank
  paidBy: integer('paid_by').notNull().references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
})
