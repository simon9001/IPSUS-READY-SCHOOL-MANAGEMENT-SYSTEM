export interface FeeStatement {
  studentId: number
  totalInvoiced: number
  totalPaid: number
  balance: number
  invoices: unknown[]
  payments: unknown[]
}
