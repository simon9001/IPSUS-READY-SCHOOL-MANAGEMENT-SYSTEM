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
    // Core academic records: students, classes/streams, teachers, subjects, attendance, promotions
    { code: 'students.manage', module: 'academic_records', description: 'Create/edit student records, classes, and streams' },
    { code: 'students.view', module: 'academic_records', description: 'View student records' },
    { code: 'teachers.manage', module: 'academic_records', description: 'Create/edit the teacher registry' },
    { code: 'teachers.view', module: 'academic_records', description: 'View the teacher registry' },
    { code: 'subjects.manage', module: 'academic_records', description: 'Create subjects/strands, offer subjects to classes, and assign teachers' },
    { code: 'subjects.view', module: 'academic_records', description: 'View subjects, class offerings, and teacher assignments' },
    { code: 'attendance.manage', module: 'academic_records', description: 'Take and edit the daily class register' },
    { code: 'attendance.view', module: 'academic_records', description: 'View attendance records' },
    { code: 'promotions.manage', module: 'academic_records', description: 'Record end-of-year student promotions/repeats/transfers-out' },
    { code: 'promotions.view', module: 'academic_records', description: 'View student promotion history' },
    // Guardians (parent-student linking, distinct from portal.access which is the parent's own login)
    { code: 'guardians.manage', module: 'communication', description: "Link guardians to students' records" },
    { code: 'guardians.view', module: 'communication', description: "View a student's linked guardians" },
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
    // Welfare & Facilities
    { code: 'boarding.manage', module: 'welfare', description: 'Manage dormitories, bed allocations, and boarding attendance' },
    { code: 'boarding.view', module: 'welfare', description: 'View boarding records' },
    { code: 'health.manage', module: 'welfare', description: 'Record medical conditions, clinic visits, and medication administration' },
    // Deliberately not *.view — same reasoning as counseling.access: medical
    // records are confidential and must not be swept into VIEW_ONLY.
    { code: 'health.access', module: 'welfare', description: 'View confidential medical records — school nurse and principal only' },
    { code: 'transport.manage', module: 'welfare', description: 'Manage bus routes, stops, and student transport allocations' },
    { code: 'transport.view', module: 'welfare', description: 'View transport records' },
    // Exams & Grading
    { code: 'exams.manage', module: 'exams', description: 'Create grading scales/exams, enter results, and manage exam timetables' },
    { code: 'exams.view', module: 'exams', description: 'View exam results and report cards' },
    // Academic Operations & Student Life
    { code: 'timetable.manage', module: 'academic_ops', description: 'Build and edit class/exam timetables' },
    { code: 'timetable.view', module: 'academic_ops', description: 'View timetables and teacher workload' },
    { code: 'library.manage', module: 'academic_ops', description: 'Manage the library catalog and borrowing/returns' },
    { code: 'library.view', module: 'academic_ops', description: 'View library records' },
    { code: 'clubs.manage', module: 'academic_ops', description: 'Manage clubs, memberships, and competitions' },
    { code: 'clubs.view', module: 'academic_ops', description: 'View clubs and competition records' },
    // Compliance, Documents, Dashboard
    { code: 'compliance.manage', module: 'compliance', description: 'Generate and submit NEMIS/TSC/MoE regulatory returns' },
    { code: 'compliance.view', module: 'compliance', description: 'View compliance reports' },
    { code: 'documents.manage', module: 'compliance', description: 'Generate official documents: certificates, transcripts, letters' },
    { code: 'documents.view', module: 'compliance', description: 'View/reprint issued documents' },
    { code: 'dashboard.view', module: 'compliance', description: 'View the combined financial/enrollment/academic dashboard' },
];
const VIEW_ONLY = PERMISSIONS.filter((p) => p.code.endsWith('.view')).map((p) => p.code);
export const ROLES = [
    {
        code: 'system_admin',
        name: 'System Administrator',
        // Deliberately narrow: this role manages accounts, roles, fiscal periods,
        // and the audit trail — it is not a general-purpose "see everything"
        // role, so it does NOT get VIEW_ONLY. Someone who also needs to view
        // financial/academic/HR data should be assigned that module's own
        // *.view permission directly, or an additional role.
        description: 'Manages user accounts, roles, and system configuration. Not typically a financial approver.',
        permissions: ['users.manage', 'roles.manage', 'ledger.periods.manage', 'audit.view', 'dashboard.view'],
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
            'boarding.view', 'health.access', 'transport.view',
            'timetable.view', 'library.view', 'clubs.view', 'exams.view',
            'students.view', 'teachers.view', 'subjects.view', 'attendance.view', 'promotions.view', 'guardians.view',
            'compliance.manage', 'compliance.view', 'documents.manage', 'documents.view', 'dashboard.view',
        ],
    },
    {
        code: 'dean_of_studies',
        name: 'Dean of Studies',
        description: 'Academic administration head — coordinates the master timetable, exam scheduling and results analysis, and monitors syllabus coverage and teaching staff performance. Reports to the Principal; distinct from the Timetable Coordinator, who only handles scheduling mechanics.',
        permissions: [
            'timetable.manage', 'timetable.view', 'exams.manage', 'exams.view', 'staff.view', 'dashboard.view',
            'students.view', 'teachers.manage', 'teachers.view', 'subjects.manage', 'subjects.view',
            'attendance.view', 'promotions.manage', 'promotions.view',
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
            'students.view', 'dashboard.view',
        ],
    },
    {
        code: 'accounts_clerk',
        name: 'Accounts / Fee Clerk',
        description: 'Front-office fee receipting. Narrower than the Bursar role — no journal, payroll, or procurement access.',
        permissions: ['fees.receipt.create', 'fees.view', 'fees.invoice.manage', 'students.view', 'dashboard.view'],
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
        permissions: ['procurement.requisition.create', 'procurement.lpo.manage', 'procurement.invoice.manage', 'procurement.view', 'dashboard.view'],
    },
    {
        code: 'store_keeper',
        name: 'Store Keeper',
        description: 'Manages the stores/inventory ledger (food, stationery, textbooks).',
        permissions: ['inventory.manage', 'inventory.view', 'dashboard.view'],
    },
    {
        code: 'payroll_officer',
        name: 'Payroll Officer',
        description: 'Processes monthly payroll for BOM-employed staff, separate from the Bursar for segregation of duties.',
        permissions: ['payroll.manage', 'payroll.process', 'payroll.view', 'dashboard.view'],
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
            'teachers.view', 'dashboard.view',
        ],
    },
    {
        code: 'registrar',
        name: 'Registrar / Admissions Officer',
        description: 'Captures government placements and inter-school transfers, and runs the direct-application interview process.',
        permissions: [
            'admissions.manage', 'admissions.view', 'compliance.manage', 'compliance.view', 'documents.manage', 'documents.view',
            'students.manage', 'students.view', 'guardians.manage', 'guardians.view', 'promotions.view', 'dashboard.view',
        ],
    },
    {
        code: 'teacher',
        name: 'Teacher',
        description: 'Day-to-day classroom conduct tracking: logging incidents and awarding/deducting merit-demerit points. Does not run formal disciplinary cases.',
        permissions: [
            'discipline.manage', 'discipline.view', 'conduct_points.manage', 'conduct_points.view', 'timetable.view', 'clubs.manage', 'clubs.view',
            'students.view', 'subjects.view', 'attendance.manage', 'attendance.view', 'exams.manage', 'exams.view', 'promotions.view', 'dashboard.view',
        ],
    },
    {
        code: 'counselor',
        name: 'Guidance Counselor',
        description: 'Runs confidential guidance & counseling sessions. Separate from punitive discipline records.',
        permissions: ['counseling.manage', 'counseling.access', 'discipline.view', 'dashboard.view'],
    },
    {
        code: 'boarding_officer',
        name: 'Boarding Master/Matron',
        description: 'Manages dormitories, bed allocations, and nightly boarding attendance.',
        permissions: ['boarding.manage', 'boarding.view', 'dashboard.view'],
    },
    {
        code: 'school_nurse',
        name: 'School Nurse',
        description: 'Records confidential medical conditions, clinic visits, and medication administration.',
        permissions: ['health.manage', 'health.access', 'dashboard.view'],
    },
    {
        code: 'transport_officer',
        name: 'Transport Officer',
        description: 'Manages bus routes, stops, and student transport allocations.',
        permissions: ['transport.manage', 'transport.view', 'dashboard.view'],
    },
    {
        code: 'timetable_coordinator',
        name: 'Timetable Coordinator',
        description: 'Builds and maintains class and exam timetables.',
        permissions: ['timetable.manage', 'timetable.view', 'dashboard.view'],
    },
    {
        code: 'librarian',
        name: 'Librarian',
        description: 'Manages the library catalog and borrowing/returns.',
        permissions: ['library.manage', 'library.view', 'dashboard.view'],
    },
];
