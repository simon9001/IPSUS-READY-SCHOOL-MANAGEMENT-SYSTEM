import { procurementRepository } from './procurement.repository.js';
import { journalService } from '../journal/journal.service.js';
import { ConflictError, NotFoundError } from '../../common/errors.js';
export const procurementService = {
    listSuppliers: () => procurementRepository.findAllSuppliers(),
    async getSupplierById(id) {
        const supplier = await procurementRepository.findSupplierById(id);
        if (!supplier)
            throw new NotFoundError(`Supplier ${id} not found`);
        return supplier;
    },
    createSupplier: (input) => procurementRepository.createSupplier(input),
    listRequisitions: () => procurementRepository.findAllRequisitions(),
    async getRequisitionById(id) {
        const requisition = await procurementRepository.findRequisitionById(id);
        if (!requisition)
            throw new NotFoundError(`Requisition ${id} not found`);
        const items = await procurementRepository.findRequisitionItems(id);
        return { ...requisition, items };
    },
    createRequisition: (input) => {
        const { items, ...requisition } = input;
        return procurementRepository.createRequisition({ ...requisition, requisitionNo: `REQ-${Date.now()}`, status: 'submitted' }, items.map((item) => ({
            ...item,
            quantity: String(item.quantity),
            estimatedUnitCost: item.estimatedUnitCost !== undefined ? String(item.estimatedUnitCost) : undefined,
        })));
    },
    async approveRequisition(id, input) {
        const requisition = await procurementRepository.findRequisitionById(id);
        if (!requisition)
            throw new NotFoundError(`Requisition ${id} not found`);
        if (requisition.status !== 'submitted')
            throw new ConflictError(`Requisition ${id} is ${requisition.status}, not submitted`);
        return procurementRepository.updateRequisitionStatus(id, 'approved', { approvedBy: input.approvedBy, approvedAt: new Date() });
    },
    async rejectRequisition(id) {
        const requisition = await procurementRepository.findRequisitionById(id);
        if (!requisition)
            throw new NotFoundError(`Requisition ${id} not found`);
        if (requisition.status !== 'submitted')
            throw new ConflictError(`Requisition ${id} is ${requisition.status}, not submitted`);
        return procurementRepository.updateRequisitionStatus(id, 'rejected');
    },
    listPurchaseOrders: () => procurementRepository.findAllPurchaseOrders(),
    async getPurchaseOrderById(id) {
        const po = await procurementRepository.findPurchaseOrderById(id);
        if (!po)
            throw new NotFoundError(`Purchase order ${id} not found`);
        const items = await procurementRepository.findPurchaseOrderItems(id);
        return { ...po, items };
    },
    async createPurchaseOrder(input) {
        const totalAmount = input.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitCost), 0);
        const { po } = await procurementRepository.createPurchaseOrder({
            lpoNo: `LPO-${Date.now()}`,
            supplierId: input.supplierId,
            requisitionId: input.requisitionId,
            orderDate: input.orderDate,
            status: 'issued',
            totalAmount: totalAmount.toFixed(2),
            approvedBy: input.approvedBy,
            approvedAt: input.approvedBy ? new Date() : undefined,
        }, input.items.map((item) => ({ ...item, quantity: String(item.quantity), unitCost: String(item.unitCost) })));
        if (input.requisitionId) {
            await procurementRepository.updateRequisitionStatus(input.requisitionId, 'converted_to_lpo');
        }
        return po;
    },
    /** Simplified receipt tracking: a GRN covering every item on the PO marks
     *  it 'received'; a GRN covering only some items marks it 'partially_received'. */
    async createGrn(input) {
        const po = await procurementRepository.findPurchaseOrderById(input.purchaseOrderId);
        if (!po)
            throw new NotFoundError(`Purchase order ${input.purchaseOrderId} not found`);
        const poItems = await procurementRepository.findPurchaseOrderItems(input.purchaseOrderId);
        const grn = await procurementRepository.createGrn({ grnNo: `GRN-${Date.now()}`, purchaseOrderId: input.purchaseOrderId, receivedDate: input.receivedDate, receivedBy: input.receivedBy }, input.items.map((item) => ({ ...item, quantityReceived: String(item.quantityReceived) })));
        const receivedItemIds = new Set(input.items.map((item) => item.purchaseOrderItemId));
        const status = poItems.every((item) => receivedItemIds.has(item.id)) ? 'received' : 'partially_received';
        await procurementRepository.updatePurchaseOrderStatus(input.purchaseOrderId, status);
        return grn;
    },
    listSupplierInvoices: () => procurementRepository.findAllSupplierInvoices(),
    async getSupplierInvoiceById(id) {
        const invoice = await procurementRepository.findSupplierInvoiceById(id);
        if (!invoice)
            throw new NotFoundError(`Supplier invoice ${id} not found`);
        return invoice;
    },
    async createSupplierInvoice(input) {
        const supplier = await procurementRepository.findSupplierById(input.supplierId);
        if (!supplier)
            throw new NotFoundError(`Supplier ${input.supplierId} not found`);
        const amount = input.lines.reduce((sum, line) => sum + Number(line.amount), 0);
        const invoice = await procurementRepository.createSupplierInvoice({
            invoiceNo: input.invoiceNo,
            supplierId: input.supplierId,
            purchaseOrderId: input.purchaseOrderId,
            grnId: input.grnId,
            invoiceDate: input.invoiceDate,
            dueDate: input.dueDate,
            amount: amount.toFixed(2),
            status: 'pending',
        });
        const entry = await journalService.postSystemEntry({
            periodId: input.periodId,
            entryDate: input.invoiceDate,
            description: `Supplier invoice ${input.invoiceNo} - ${supplier.name}`,
            sourceModule: 'procurement',
            sourceReference: `supplier-invoice-${invoice.id}`,
            createdBy: input.createdBy,
            lines: [
                ...input.lines.map((line) => ({ accountId: line.accountId, fundId: input.fundId, debit: line.amount, description: line.description })),
                { accountId: input.creditorsAccountId, fundId: input.fundId, credit: amount },
            ],
        });
        return procurementRepository.attachInvoiceJournalEntry(invoice.id, entry.id);
    },
    async createSupplierPayment(input) {
        const invoice = await procurementRepository.findSupplierInvoiceById(input.supplierInvoiceId);
        if (!invoice)
            throw new NotFoundError(`Supplier invoice ${input.supplierInvoiceId} not found`);
        if (invoice.status === 'paid')
            throw new ConflictError(`Supplier invoice ${input.supplierInvoiceId} is already paid`);
        const payment = await procurementRepository.createSupplierPayment({
            supplierInvoiceId: input.supplierInvoiceId,
            paymentDate: input.paymentDate,
            amount: String(input.amount),
            paymentMethod: input.paymentMethod,
            referenceNo: input.referenceNo,
            paidBy: input.paidBy,
            approvedBy: input.approvedBy,
        });
        const entry = await journalService.postSystemEntry({
            periodId: input.periodId,
            entryDate: input.paymentDate,
            description: `Payment for supplier invoice ${invoice.invoiceNo}`,
            sourceModule: 'procurement',
            sourceReference: `supplier-payment-${payment.id}`,
            createdBy: input.paidBy,
            lines: [
                { accountId: input.creditorsAccountId, fundId: input.fundId, debit: input.amount },
                { accountId: input.cashAccountId, fundId: input.fundId, credit: input.amount },
            ],
        });
        if (Number(input.amount) >= Number(invoice.amount)) {
            await procurementRepository.markInvoicePaid(input.supplierInvoiceId);
        }
        return procurementRepository.attachPaymentJournalEntry(payment.id, entry.id);
    },
};
