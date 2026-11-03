import { journalService } from '../../journal/journal.service.js'
import { budgetsService } from '../../budgets/budgets.service.js'
import { procurementService } from '../../procurement/procurement.service.js'
import { libraryService } from '../../library/library.service.js'
import { disciplinaryCasesService } from '../../disciplinaryCases/disciplinaryCases.service.js'
import { staffService } from '../../staff/staff.service.js'
import { leaveService } from '../../leave/leave.service.js'
import { systemService } from '../../system/system.service.js'
import { periodsService } from '../../periods/periods.service.js'
import { money, daysUntil, computeInventoryBalances } from './shared.js'
import type { WidgetDef } from './shared.js'

export const ATTENTION_WIDGETS: WidgetDef[] = [
  {
    id: 'journal-approvals-pending',
    section: 'attention',
    requiredPermission: 'ledger.journal.approve',
    async build() {
      const entries = await journalService.list()
      const pending = entries.filter((e) => e.status === 'pending_approval')
      return {
        id: 'journal-approvals-pending',
        title: 'Journal Entries Awaiting Approval',
        kind: 'list',
        emptyText: 'Nothing awaiting approval.',
        rows: pending.map((e) => ({ label: e.entryNo, sublabel: e.description, value: e.entryDate, tone: 'warning' })),
      }
    },
  },
  {
    id: 'budget-approvals-pending',
    section: 'attention',
    requiredPermission: 'budget.approve',
    async build() {
      const budgets = await budgetsService.list()
      const pending = budgets.filter((b) => b.status === 'draft')
      return {
        id: 'budget-approvals-pending',
        title: 'Budgets Awaiting Approval',
        kind: 'list',
        emptyText: 'Nothing awaiting approval.',
        rows: pending.map((b) => ({ label: b.name, sublabel: `FY${b.fiscalYear}`, tone: 'warning' })),
      }
    },
  },
  {
    id: 'procurement-approvals-pending',
    section: 'attention',
    requiredPermission: ['procurement.requisition.approve', 'procurement.payment.approve'],
    async build({ permissions }) {
      const rows: { label: string; sublabel?: string; value?: string; tone?: 'warning' }[] = []
      if (permissions.includes('procurement.requisition.approve')) {
        const requisitions = await procurementService.listRequisitions()
        for (const r of requisitions.filter((r) => r.status === 'submitted')) {
          rows.push({ label: r.requisitionNo, sublabel: 'Requisition awaiting approval', value: r.requestDate, tone: 'warning' })
        }
      }
      if (permissions.includes('procurement.payment.approve')) {
        const invoices = await procurementService.listSupplierInvoices()
        for (const i of invoices.filter((i) => i.status === 'pending')) {
          rows.push({ label: i.invoiceNo, sublabel: 'Invoice pending payment', value: money(Number(i.amount)), tone: 'warning' })
        }
      }
      return {
        id: 'procurement-approvals-pending',
        title: 'Procurement Awaiting Your Action',
        kind: 'list',
        emptyText: 'Nothing awaiting approval.',
        rows,
      }
    },
  },
  {
    id: 'leave-approvals-pending',
    section: 'attention',
    requiredPermission: 'leave.approve',
    async build() {
      const [requests, staff] = await Promise.all([leaveService.list(), staffService.list()])
      const staffName = new Map(staff.map((s) => [s.id, s.fullName]))
      const pending = requests.filter((r) => r.status === 'pending')
      return {
        id: 'leave-approvals-pending',
        title: 'Leave Requests Awaiting Approval',
        kind: 'list',
        emptyText: 'Nothing awaiting approval.',
        rows: pending.map((r) => ({
          label: staffName.get(r.staffId) ?? `Staff #${r.staffId}`,
          sublabel: `${r.startDate} to ${r.endDate}`,
          value: `${r.daysRequested} day(s)`,
          tone: 'warning',
        })),
      }
    },
  },
  {
    id: 'disciplinary-cases-open',
    section: 'attention',
    requiredPermission: 'disciplinary_cases.manage',
    async build() {
      const cases = await disciplinaryCasesService.list()
      const open = cases.filter((c) => c.status !== 'closed')
      return {
        id: 'disciplinary-cases-open',
        title: 'Disciplinary Cases In Progress',
        kind: 'list',
        emptyText: 'No open cases.',
        rows: open.map((c) => ({ label: `Case #${c.id}`, sublabel: c.status.replace(/_/g, ' '), tone: 'warning' })),
      }
    },
  },
  {
    id: 'inventory-low-stock',
    section: 'attention',
    // The action permission, not inventory.view — VIEW_ONLY hands .view to
    // auditors and BOM members, and "needs your attention" should only reach
    // someone who can actually reorder. Same for library-overdue below.
    requiredPermission: 'inventory.manage',
    async build() {
      const { items, balanceByItem } = await computeInventoryBalances()
      const low = items.filter((it) => it.reorderLevel !== null && (balanceByItem.get(it.id) ?? 0) <= Number(it.reorderLevel))
      return {
        id: 'inventory-low-stock',
        title: 'Low Stock Items',
        kind: 'list',
        emptyText: 'All stock levels are healthy.',
        rows: low.map((it) => ({
          label: it.name,
          sublabel: `${it.itemCode} — reorder level ${it.reorderLevel}`,
          value: String(balanceByItem.get(it.id) ?? 0),
          tone: 'danger',
        })),
      }
    },
  },
  {
    id: 'library-overdue',
    section: 'attention',
    requiredPermission: 'library.manage',
    async build({ asOfDate }) {
      const overdue = await libraryService.listOverdue(asOfDate)
      return {
        id: 'library-overdue',
        title: 'Overdue Library Books',
        kind: 'list',
        emptyText: 'Nothing overdue.',
        rows: overdue.map((b) => ({ label: `Borrowing #${b.id}`, sublabel: `Due ${b.dueDate}`, tone: 'warning' })),
      }
    },
  },
  // ---- Administration: the four things only system_admin can act on.
  // Gated on the admin's own action permissions rather than on any *.view
  // code, so these never appear for the auditor/BOM roles that hold the
  // whole VIEW_ONLY sweep.
  {
    id: 'accounts-needing-attention',
    section: 'attention',
    requiredPermission: 'users.manage',
    async build() {
      const flagged = await systemService.flaggedAccounts()
      return {
        id: 'accounts-needing-attention',
        title: 'User Accounts Needing Attention',
        kind: 'list',
        emptyText: 'Every account is active, assigned, and in use.',
        rows: flagged.map((a) => ({
          label: a.fullName,
          sublabel: `${a.reason}${a.detail ? ` — ${a.detail}` : ''}`,
          value: a.email,
          tone: a.reason === 'Locked out' ? 'danger' : 'warning',
        })),
      }
    },
  },
  {
    id: 'rbac-drift',
    section: 'attention',
    requiredPermission: 'roles.manage',
    async build() {
      const drift = await systemService.rbacDrift()
      const rows: { label: string; sublabel?: string; tone?: 'warning' | 'danger' }[] = []
      if (drift.missingPermissions.length > 0) {
        rows.push({
          label: `${drift.missingPermissions.length} permission(s) not in the database`,
          sublabel: drift.missingPermissions.slice(0, 4).join(', '),
          tone: 'danger',
        })
      }
      if (drift.missingRoles.length > 0) {
        rows.push({
          label: `${drift.missingRoles.length} role(s) not in the database`,
          sublabel: drift.missingRoles.slice(0, 4).join(', '),
          tone: 'danger',
        })
      }
      if (drift.missingRolePermissions.length > 0) {
        rows.push({
          label: `${drift.missingRolePermissions.length} role grant(s) not applied`,
          sublabel: 'Run pnpm db:sync-rbac to apply them',
          tone: 'warning',
        })
      }
      if (drift.orphanRolePermissions.length > 0) {
        rows.push({
          label: `${drift.orphanRolePermissions.length} grant(s) the database still makes but rbac.ts does not`,
          sublabel: 'Access narrowed in code was never revoked in the database',
          tone: 'danger',
        })
      }
      if (drift.orphanPermissions.length > 0) {
        rows.push({
          label: `${drift.orphanPermissions.length} permission(s) no longer in rbac.ts`,
          sublabel: drift.orphanPermissions.slice(0, 4).join(', '),
          tone: 'warning',
        })
      }
      if (drift.orphanRoles.length > 0) {
        rows.push({
          label: `${drift.orphanRoles.length} role(s) no longer in rbac.ts`,
          sublabel: drift.orphanRoles.slice(0, 4).join(', '),
          tone: 'warning',
        })
      }
      return { id: 'rbac-drift', title: 'RBAC Catalogue Drift', kind: 'list', emptyText: 'Database matches rbac.ts.', rows }
    },
  },
  {
    id: 'segregation-conflicts',
    section: 'attention',
    requiredPermission: 'roles.manage',
    async build() {
      const conflicts = await systemService.segregationConflicts()
      return {
        id: 'segregation-conflicts',
        title: 'Segregation of Duties Conflicts',
        kind: 'list',
        emptyText: 'No user holds both sides of a maker-checker pair.',
        rows: conflicts.map((conflict) => ({
          label: conflict.fullName,
          sublabel: conflict.rule,
          value: conflict.email,
          tone: 'danger',
        })),
      }
    },
  },
  {
    id: 'periods-needing-close',
    section: 'attention',
    requiredPermission: 'ledger.periods.manage',
    async build({ asOfDate }) {
      const periods = await periodsService.list()
      // An open period past its end date still accepts postings — journal
      // entries can land in a term that is supposed to be finished.
      const overdue = periods.filter((p) => p.status === 'open' && p.endDate < asOfDate)
      return {
        id: 'periods-needing-close',
        title: 'Fiscal Periods Past Their End Date',
        kind: 'list',
        emptyText: 'No period is overdue for closing.',
        rows: overdue.map((p) => ({
          label: p.name,
          sublabel: `Ended ${p.endDate} — still open to postings`,
          value: `${Math.abs(daysUntil(asOfDate, p.endDate))} days ago`,
          tone: 'warning',
        })),
      }
    },
  },
]
