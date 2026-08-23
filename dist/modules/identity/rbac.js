export const PERMISSIONS = [
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
    // Communication
    { code: 'notices.manage', module: 'communication', description: 'Create and publish school notices/announcements' },
    { code: 'notifications.send', module: 'communication', description: 'Send SMS/email notifications to parents and staff' },
    // Deliberately not named *.view — this is not a staff "view everything"
    // permission, it's parent-portal access scoped to their own children.
    { code: 'portal.access', module: 'communication', description: "Parent portal access — view own linked children's records" },
    // HR / Staff records
    { code: 'staff.manage', module: 'hr', description: 'Maintain the staff registry' },
    { code: 'staff.view', module: 'hr', description: 'View staff records' },
    { code: 'leave.manage', module: 'hr', description: 'Record leave requests on behalf of staff' },
    { code: 'leave.approve', module: 'hr', description: 'Approve or reject leave requests' },
    { code: 'leave.view', module: 'hr', description: 'View leave requests and balances' },
    { code: 'contracts.manage', module: 'hr', description: 'Maintain staff contracts' },
    { code: 'contracts.view', module: 'hr', description: 'View staff contracts' },
    { code: 'appraisals.manage', module: 'hr', description: 'Conduct and record staff appraisals' },
    { code: 'appraisals.view', module: 'hr', description: 'View staff appraisal records' },
    { code: 'staff_discipline.manage', module: 'hr', description: 'Record staff disciplinary actions' },
    { code: 'staff_discipline.view', module: 'hr', description: 'View staff disciplinary records' },
    // Admissions
    { code: 'admissions.manage', module: 'admissions', description: 'Capture placements/transfers, process applications, conduct interviews, and decide admissions' },
    { code: 'admissions.view', module: 'admissions', description: 'View admission records' },
    // Student conduct
    { code: 'discipline.manage', module: 'student_discipline', description: 'Log student discipline incidents' },
    { code: 'discipline.view', module: 'student_discipline', description: 'View student discipline records' },
    { code: 'conduct_points.manage', module: 'student_discipline', description: 'Award or deduct student merit/demerit points' },
    { code: 'conduct_points.view', module: 'student_discipline', description: 'View student conduct point ledgers/scores' },
    { code: 'disciplinary_cases.manage', module: 'student_discipline', description: 'Run the formal suspension/expulsion process (hearings, BOM review, decisions)' },
    { code: 'disciplinary_cases.view', module: 'student_discipline', description: 'View disciplinary case records' },
    { code: 'counseling.manage', module: 'student_discipline', description: 'Record confidential guidance & counseling sessions' },
    // Deliberately not *.view — counseling notes are confidential and must
    // NOT be swept into the generic VIEW_ONLY grant given to BOM/auditors.
    { code: 'counseling.access', module: 'student_discipline', description: 'View confidential counseling records — counselor and principal only' },
];
const VIEW_ONLY = PERMISSIONS.filter((p) => p.code.endsWith('.view')).map((p) => p.code);
export const ROLES = [
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
            'notices.manage', 'notifications.send',
            'staff.view', 'leave.approve', 'leave.view', 'contracts.view', 'appraisals.view', 'staff_discipline.view',
            'admissions.manage', 'admissions.view',
            'discipline.view', 'conduct_points.view', 'disciplinary_cases.manage', 'disciplinary_cases.view', 'counseling.access',
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
            'notifications.send',
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
    {
        code: 'parent',
        name: 'Parent / Guardian',
        description: 'Portal access to view their own linked children\'s fee statements, report cards, and attendance. No staff-side access.',
        permissions: ['portal.access'],
    },
    {
        code: 'hr_officer',
        name: 'HR Officer',
        description: 'Maintains staff records, leave, contracts, appraisals, and disciplinary records for all staff (TSC and BOM).',
        permissions: [
            'staff.manage', 'staff.view',
            'leave.manage', 'leave.view',
            'contracts.manage', 'contracts.view',
            'appraisals.manage', 'appraisals.view',
            'staff_discipline.manage', 'staff_discipline.view',
        ],
    },
    {
        code: 'registrar',
        name: 'Registrar / Admissions Officer',
        description: 'Captures government placements and inter-school transfers, and runs the direct-application interview process.',
        permissions: ['admissions.manage', 'admissions.view'],
    },
    {
        code: 'teacher',
        name: 'Teacher',
        description: 'Day-to-day classroom conduct tracking: logging incidents and awarding/deducting merit-demerit points. Does not run formal disciplinary cases.',
        permissions: ['discipline.manage', 'discipline.view', 'conduct_points.manage', 'conduct_points.view'],
    },
    {
        code: 'counselor',
        name: 'Guidance Counselor',
        description: 'Runs confidential guidance & counseling sessions. Separate from punitive discipline records.',
        permissions: ['counseling.manage', 'counseling.access', 'discipline.view'],
    },
];
