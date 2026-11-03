import { journalService } from '../../journal/journal.service.js'
import { feesService } from '../../fees/fees.service.js'
import { budgetsService } from '../../budgets/budgets.service.js'
import { grantsService } from '../../grants/grants.service.js'
import { procurementService } from '../../procurement/procurement.service.js'
import { payrollService } from '../../payroll/payroll.service.js'
import { assetsService } from '../../assets/assets.service.js'
import { bankingService } from '../../banking/banking.service.js'
import { money, computeInventoryBalances } from './shared.js'
import type { WidgetDef } from './shared.js'

export const FINANCIAL_WIDGETS: WidgetDef[] = [
  {
    id: 'financial-health',
    section: 'financial',
    requiredPermission: 'ledger.journal.view',
    async build({ asOfDate }) {
      const tb = await journalService.trialBalance(asOfDate)
      return {
        id: 'financial-health',
        title: 'Financial Health',
        kind: 'stats',
        stats: [
          { label: 'Trial Balance', value: tb.isBalanced ? 'Balanced' : 'Out of balance', tone: tb.isBalanced ? 'success' : 'danger' },
          { label: 'Total Debit', value: money(tb.totalDebit) },
          { label: 'Total Credit', value: money(tb.totalCredit) },
        ],
      }
    },
  },
  {
    id: 'fees-overview',
    section: 'financial',
    requiredPermission: 'fees.view',
    async build() {
      const invoices = await feesService.listInvoices()
      const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
      const byStatus = new Map<string, number>()
      for (const inv of invoices) byStatus.set(inv.status, (byStatus.get(inv.status) ?? 0) + 1)
      return {
        id: 'fees-overview',
        title: 'Fees',
        kind: 'stats',
        stats: [
          { label: 'Total Invoiced', value: money(totalInvoiced) },
          ...[...byStatus.entries()].map(([status, count]) => ({ label: `Invoices ${status}`, value: String(count) })),
        ],
      }
    },
  },
  {
    id: 'budget-overview',
    section: 'financial',
    requiredPermission: 'budget.view',
    async build() {
      const budgets = await budgetsService.list()
      const byStatus = new Map<string, number>()
      for (const b of budgets) byStatus.set(b.status, (byStatus.get(b.status) ?? 0) + 1)
      return {
        id: 'budget-overview',
        title: 'Budgets',
        kind: 'stats',
        stats: [
          { label: 'Total Budgets', value: String(budgets.length) },
          ...[...byStatus.entries()].map(([status, count]) => ({
            label: `${status[0].toUpperCase()}${status.slice(1)}`,
            value: String(count),
          })),
        ],
      }
    },
  },
  {
    id: 'grants-overview',
    section: 'financial',
    requiredPermission: 'grants.view',
    async build({ asOfDate }) {
      const disbursements = await grantsService.listDisbursements()
      const thisYear = disbursements.filter((d) => d.dateReceived.slice(0, 4) === asOfDate.slice(0, 4))
      const total = thisYear.reduce((sum, d) => sum + Number(d.amountReceived), 0)
      return {
        id: 'grants-overview',
        title: 'Grants / Capitation',
        kind: 'stats',
        stats: [
          { label: 'Disbursements This Year', value: String(thisYear.length) },
          { label: 'Total Received This Year', value: money(total) },
        ],
      }
    },
  },
  {
    id: 'procurement-overview',
    section: 'financial',
    requiredPermission: 'procurement.view',
    async build() {
      const [requisitions, pos, invoices] = await Promise.all([
        procurementService.listRequisitions(),
        procurementService.listPurchaseOrders(),
        procurementService.listSupplierInvoices(),
      ])
      return {
        id: 'procurement-overview',
        title: 'Procurement',
        kind: 'stats',
        stats: [
          {
            label: 'Requisitions Awaiting Approval',
            value: String(requisitions.filter((r) => r.status === 'submitted').length),
            tone: 'warning',
          },
          {
            label: 'Purchase Orders Open',
            value: String(pos.filter((p) => p.status === 'issued' || p.status === 'partially_received').length),
          },
          { label: 'Invoices Pending Payment', value: String(invoices.filter((i) => i.status === 'pending').length) },
        ],
      }
    },
  },
  {
    id: 'payroll-status',
    section: 'financial',
    requiredPermission: 'payroll.view',
    async build() {
      const runs = await payrollService.listRuns()
      const latest = [...runs].sort((a, b) => b.id - a.id)[0]
      return {
        id: 'payroll-status',
        title: 'Payroll',
        kind: 'stats',
        stats: latest
          ? [
              { label: 'Latest Run', value: latest.monthYear },
              { label: 'Status', value: latest.status, tone: latest.status === 'posted' ? 'success' : 'default' },
            ]
          : [{ label: 'Latest Run', value: 'No runs yet' }],
      }
    },
  },
  {
    id: 'assets-overview',
    section: 'financial',
    requiredPermission: 'assets.view',
    async build() {
      const assets = await assetsService.list()
      return {
        id: 'assets-overview',
        title: 'Fixed Assets',
        kind: 'stats',
        stats: [
          { label: 'Total Assets', value: String(assets.length) },
          { label: 'In Use', value: String(assets.filter((a) => a.status === 'in_use').length) },
        ],
      }
    },
  },
  {
    id: 'inventory-overview',
    section: 'financial',
    // Plain view-level summary — separate from inventory-low-stock below,
    // which is gated on inventory.manage and only shown to someone who can
    // actually reorder. Anyone who can merely see stock (e.g. the Bursar,
    // who holds inventory.view but not .manage) still gets a real widget.
    requiredPermission: 'inventory.view',
    async build() {
      const { items, balanceByItem } = await computeInventoryBalances()
      const belowReorder = items.filter((it) => it.reorderLevel !== null && (balanceByItem.get(it.id) ?? 0) <= Number(it.reorderLevel))
      return {
        id: 'inventory-overview',
        title: 'Inventory',
        kind: 'stats',
        stats: [
          { label: 'Items Tracked', value: String(items.length) },
          { label: 'Below Reorder Level', value: String(belowReorder.length), tone: belowReorder.length > 0 ? 'warning' : 'default' },
        ],
      }
    },
  },
  {
    id: 'banking-overview',
    section: 'financial',
    requiredPermission: 'banking.manage',
    async build() {
      const [accounts, imprest] = await Promise.all([bankingService.listAccounts(), bankingService.listImprestRequests()])
      const outstandingImprest = imprest.filter((i) => i.status !== 'retired')
      return {
        id: 'banking-overview',
        title: 'Banking & Imprest',
        kind: 'stats',
        stats: [
          { label: 'Bank Accounts', value: String(accounts.filter((a) => a.isActive).length) },
          {
            label: 'Outstanding Imprest',
            value: String(outstandingImprest.length),
            tone: outstandingImprest.length > 0 ? 'warning' : 'default',
          },
        ],
      }
    },
  },
]
