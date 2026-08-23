export interface PermissionDef {
  code: string
  module: string
  description: string
}

export const PERMISSIONS: PermissionDef[] = [
  // Users & roles
  { code: 'users.manage', module: 'identity', description: 'Create/edit/deactivate user accounts' },
  { code: 'roles.manage', module: 'identity', description: 'Assign roles to users' },

  // Ledger / Chart of Accounts / Trial Balance
  { code: 'ledger.accounts.manage', module: 'ledger', description: 'Create/edit the Chart of Accounts' },
  { code: 'ledger.funds.manage', module: 'ledger', description: 'Create/edit funds (voteheads)' },
  { code: 'ledger.periods.manage', module: 'ledger', description: 'Open/close fiscal periods (terms/years)' },
  { code: 'ledger.journal.create', module: 'ledger', description: 'Create manual journal entries (draft)' },
  { code: 'ledger.journal.approve', module: 'ledger', description: 'Approve and post manual journal entries' },
  { code: 'ledger.journal.view', module: 'ledger', description: 'View journal entries and trial balance' },

  // Budgets (IPSAS 24)
  { code: 'budget.manage', module: 'budget', description: 'Create/edit budget lines' },
  { code: 'budget.approve', module: 'budget', description: 'Approve the annual/term budget' },
  { code: 'budget.view', module: 'budget', description: 'View budget vs actual reports' },

  // Fees
  { code: 'fees.structure.manage', module: 'fees', description: 'Set fee structures per class/term' },
  { code: 'fees.invoice.manage', module: 'fees', description: 'Raise/adjust student fee invoices' },
  { code: 'fees.receipt.create', module: 'fees', description: 'Receipt fee payments from parents' },
  { code: 'fees.view', module: 'fees', description: 'View student fee ledgers/statements' },

  // Grants / Capitation
  { code: 'grants.record', module: 'grants', description: 'Record capitation and grant disbursements' },
  { code: 'grants.view', module: 'grants', description: 'View grant/capitation records' },

  // Procurement
  { code: 'procurement.requisition.create', module: 'procurement', description: 'Raise purchase requisitions' },
  { code: 'procurement.requisition.approve', module: 'procurement', description: 'Approve purchase requisitions' },
  { code: 'procurement.lpo.manage', module: 'procurement', description: 'Issue LPOs and record goods received' },
  { code: 'procurement.invoice.manage', module: 'procurement', description: 'Capture supplier invoices' },
  { code: 'procurement.payment.create', module: 'procurement', description: 'Prepare supplier payments' },
  { code: 'procurement.payment.approve', module: 'procurement', description: 'Approve/release supplier payments' },
  { code: 'procurement.view', module: 'procurement', description: 'View procurement records' },

  // Payroll
  { code: 'payroll.manage', module: 'payroll', description: 'Maintain employee and salary records' },
  { code: 'payroll.process', module: 'payroll', description: 'Run monthly payroll' },
  { code: 'payroll.approve', module: 'payroll', description: 'Approve payroll before posting/payment' },
  { code: 'payroll.view', module: 'payroll', description: 'View payroll records' },

  // Assets & Inventory
  { code: 'assets.manage', module: 'assets', description: 'Maintain the fixed asset register and depreciation' },
  { code: 'assets.view', module: 'assets', description: 'View the asset register' },
  { code: 'inventory.manage', module: 'inventory', description: 'Record stock receipts/issues' },
  { code: 'inventory.view', module: 'inventory', description: 'View stock balances' },

  // Banking & Imprest
  { code: 'banking.manage', module: 'banking', description: 'Maintain bank accounts' },
  { code: 'banking.reconcile', module: 'banking', description: 'Perform bank reconciliations' },
  { code: 'imprest.issue', module: 'banking', description: 'Issue imprest/petty cash' },
  { code: 'imprest.retire', module: 'banking', description: 'Retire/surrender imprest' },

  // Reporting & Audit
  { code: 'reports.view', module: 'reports', description: 'View IPSAS financial statements and management reports' },
  { code: 'reports.export', module: 'reports', description: 'Export/print financial reports' },
  { code: 'audit.view', module: 'audit', description: 'View the system audit trail' },
]

export interface RoleDef {
  code: string
  name: string
  description: string
  permissions: string[]
}

const VIEW_ONLY = PERMISSIONS.filter((p) => p.code.endsWith('.view')).map((p) => p.code)

export const ROLES: RoleDef[] = [
  {
    code: 'system_admin',
    name: 'System Administrator',
    description: 'Manages user accounts, roles, and system configuration. Not typically a financial approver.',
    permissions: ['users.manage', 'roles.manage', 'ledger.periods.manage', 'audit.view', ...VIEW_ONLY],
  },
  {
    code: 'principal',
    name: 'Principal',
    description: 'Head teacher / accounting officer. Final school-level approver for budgets, manual journals, and high-value payments.',
    permissions: [
      'ledger.journal.approve', 'ledger.journal.view',
      'budget.approve', 'budget.view',
      'procurement.requisition.approve', 'procurement.payment.approve', 'procurement.view',
      'payroll.approve', 'payroll.view',
      'fees.view', 'grants.view', 'assets.view', 'inventory.view',
      'reports.view', 'reports.export', 'audit.view',
    ],
  },
  {
    code: 'bursar',
    name: 'Bursar / School Accountant',
    description: 'Primary day-to-day accounting officer: ledger, fees, procurement capture, payroll processing.',
    permissions: [
      'ledger.accounts.manage', 'ledger.funds.manage', 'ledger.journal.create', 'ledger.journal.view',
      'budget.manage', 'budget.view',
      'fees.structure.manage', 'fees.invoice.manage', 'fees.receipt.create', 'fees.view',
      'grants.record', 'grants.view',
      'procurement.requisition.create', 'procurement.lpo.manage', 'procurement.invoice.manage', 'procurement.payment.create', 'procurement.view',
      'payroll.manage', 'payroll.process', 'payroll.view',
      'assets.manage', 'assets.view', 'inventory.view',
      'banking.manage', 'banking.reconcile', 'imprest.issue', 'imprest.retire',
      'reports.view', 'reports.export',
    ],
  },
  {
    code: 'accounts_clerk',
    name: 'Accounts / Fee Clerk',
    description: 'Front-office fee receipting. Narrower than the Bursar role — no journal, payroll, or procurement access.',
    permissions: ['fees.receipt.create', 'fees.view', 'fees.invoice.manage'],
  },
  {
    code: 'bom_treasurer',
    name: 'BOM Treasurer',
    description: 'Board of Management oversight role; co-approves budgets and manual journal entries alongside the Principal.',
    permissions: ['ledger.journal.approve', 'ledger.journal.view', 'budget.approve', 'budget.view', 'reports.view', 'reports.export', ...VIEW_ONLY],
  },
  {
    code: 'bom_member',
    name: 'BOM Member',
    description: 'Board oversight, view-only across all reports for governance meetings.',
    permissions: VIEW_ONLY,
  },
  {
    code: 'procurement_officer',
    name: 'Procurement Officer',
    description: 'Manages requisitions, LPOs, and supplier records under PPADA procedures.',
    permissions: ['procurement.requisition.create', 'procurement.lpo.manage', 'procurement.invoice.manage', 'procurement.view'],
  },
  {
    code: 'store_keeper',
    name: 'Store Keeper',
    description: 'Manages the stores/inventory ledger (food, stationery, textbooks).',
    permissions: ['inventory.manage', 'inventory.view'],
  },
  {
    code: 'payroll_officer',
    name: 'Payroll Officer',
    description: 'Processes monthly payroll for BOM-employed staff, separate from the Bursar for segregation of duties.',
    permissions: ['payroll.manage', 'payroll.process', 'payroll.view'],
  },
  {
    code: 'internal_auditor',
    name: 'Internal Auditor',
    description: 'Read-only across all modules plus the audit trail, for continuous internal control review.',
    permissions: [...VIEW_ONLY, 'audit.view'],
  },
  {
    code: 'external_auditor',
    name: 'External Auditor (incl. Office of the Auditor-General)',
    description: 'Time-boxed read-only access granted for the annual statutory audit.',
    permissions: [...VIEW_ONLY, 'audit.view'],
  },
]
