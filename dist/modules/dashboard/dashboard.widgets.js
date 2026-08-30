import { journalService } from '../journal/journal.service.js';
import { feesService } from '../fees/fees.service.js';
import { budgetsService } from '../budgets/budgets.service.js';
import { grantsService } from '../grants/grants.service.js';
import { procurementService } from '../procurement/procurement.service.js';
import { payrollService } from '../payroll/payroll.service.js';
import { assetsService } from '../assets/assets.service.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { bankingService } from '../banking/banking.service.js';
import { studentsService } from '../students/students.service.js';
import { examsService } from '../exams/exams.service.js';
import { admissionsService } from '../admissions/admissions.service.js';
import { timetableService } from '../timetable/timetable.service.js';
import { libraryService } from '../library/library.service.js';
import { disciplineService } from '../discipline/discipline.service.js';
import { conductPointsService } from '../conductPoints/conductPoints.service.js';
import { disciplinaryCasesService } from '../disciplinaryCases/disciplinaryCases.service.js';
import { staffService } from '../staff/staff.service.js';
import { leaveService } from '../leave/leave.service.js';
import { contractsService } from '../contracts/contracts.service.js';
import { staffDisciplineService } from '../staffDiscipline/staffDiscipline.service.js';
import { boardingService } from '../boarding/boarding.service.js';
import { healthService } from '../health/health.service.js';
import { transportService } from '../transport/transport.service.js';
import { counselingService } from '../counseling/counseling.service.js';
import { complianceService } from '../compliance/compliance.service.js';
import { documentsService } from '../documents/documents.service.js';
import { noticesService } from '../notices/notices.service.js';
import { identityService } from '../identity/identity.service.js';
const hasGate = (permissions, gate) => Array.isArray(gate) ? gate.some((p) => permissions.includes(p)) : permissions.includes(gate);
const money = (n) => `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const daysUntil = (asOfDate, date) => Math.round((new Date(date).getTime() - new Date(asOfDate).getTime()) / 86_400_000);
export const WIDGETS = [
    // ---------------- FINANCIAL ----------------
    {
        id: 'financial-health',
        section: 'financial',
        requiredPermission: 'ledger.journal.view',
        async build({ asOfDate }) {
            const tb = await journalService.trialBalance(asOfDate);
            return {
                id: 'financial-health',
                title: 'Financial Health',
                kind: 'stats',
                stats: [
                    { label: 'Trial Balance', value: tb.isBalanced ? 'Balanced' : 'Out of balance', tone: tb.isBalanced ? 'success' : 'danger' },
                    { label: 'Total Debit', value: money(tb.totalDebit) },
                    { label: 'Total Credit', value: money(tb.totalCredit) },
                ],
            };
        },
    },
    {
        id: 'fees-overview',
        section: 'financial',
        requiredPermission: 'fees.view',
        async build() {
            const invoices = await feesService.listInvoices();
            const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
            const byStatus = new Map();
            for (const inv of invoices)
                byStatus.set(inv.status, (byStatus.get(inv.status) ?? 0) + 1);
            return {
                id: 'fees-overview',
                title: 'Fees',
                kind: 'stats',
                stats: [
                    { label: 'Total Invoiced', value: money(totalInvoiced) },
                    ...[...byStatus.entries()].map(([status, count]) => ({ label: `Invoices ${status}`, value: String(count) })),
                ],
            };
        },
    },
    {
        id: 'budget-overview',
        section: 'financial',
        requiredPermission: 'budget.view',
        async build() {
            const budgets = await budgetsService.list();
            const byStatus = new Map();
            for (const b of budgets)
                byStatus.set(b.status, (byStatus.get(b.status) ?? 0) + 1);
            return {
                id: 'budget-overview',
                title: 'Budgets',
                kind: 'stats',
                stats: [
                    { label: 'Total Budgets', value: String(budgets.length) },
                    ...[...byStatus.entries()].map(([status, count]) => ({ label: `${status[0].toUpperCase()}${status.slice(1)}`, value: String(count) })),
                ],
            };
        },
    },
    {
        id: 'grants-overview',
        section: 'financial',
        requiredPermission: 'grants.view',
        async build({ asOfDate }) {
            const disbursements = await grantsService.listDisbursements();
            const thisYear = disbursements.filter((d) => d.dateReceived.slice(0, 4) === asOfDate.slice(0, 4));
            const total = thisYear.reduce((sum, d) => sum + Number(d.amountReceived), 0);
            return {
                id: 'grants-overview',
                title: 'Grants / Capitation',
                kind: 'stats',
                stats: [
                    { label: 'Disbursements This Year', value: String(thisYear.length) },
                    { label: 'Total Received This Year', value: money(total) },
                ],
            };
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
            ]);
            return {
                id: 'procurement-overview',
                title: 'Procurement',
                kind: 'stats',
                stats: [
                    { label: 'Requisitions Awaiting Approval', value: String(requisitions.filter((r) => r.status === 'submitted').length), tone: 'warning' },
                    { label: 'Purchase Orders Open', value: String(pos.filter((p) => p.status === 'issued' || p.status === 'partially_received').length) },
                    { label: 'Invoices Pending Payment', value: String(invoices.filter((i) => i.status === 'pending').length) },
                ],
            };
        },
    },
    {
        id: 'payroll-status',
        section: 'financial',
        requiredPermission: 'payroll.view',
        async build() {
            const runs = await payrollService.listRuns();
            const latest = [...runs].sort((a, b) => b.id - a.id)[0];
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
            };
        },
    },
    {
        id: 'assets-overview',
        section: 'financial',
        requiredPermission: 'assets.view',
        async build() {
            const assets = await assetsService.list();
            return {
                id: 'assets-overview',
                title: 'Fixed Assets',
                kind: 'stats',
                stats: [
                    { label: 'Total Assets', value: String(assets.length) },
                    { label: 'In Use', value: String(assets.filter((a) => a.status === 'in_use').length) },
                ],
            };
        },
    },
    {
        id: 'banking-overview',
        section: 'financial',
        requiredPermission: 'banking.manage',
        async build() {
            const [accounts, imprest] = await Promise.all([bankingService.listAccounts(), bankingService.listImprestRequests()]);
            const outstandingImprest = imprest.filter((i) => i.status !== 'retired');
            return {
                id: 'banking-overview',
                title: 'Banking & Imprest',
                kind: 'stats',
                stats: [
                    { label: 'Bank Accounts', value: String(accounts.filter((a) => a.isActive).length) },
                    { label: 'Outstanding Imprest', value: String(outstandingImprest.length), tone: outstandingImprest.length > 0 ? 'warning' : 'default' },
                ],
            };
        },
    },
    // ---------------- ATTENTION ----------------
    {
        id: 'journal-approvals-pending',
        section: 'attention',
        requiredPermission: 'ledger.journal.approve',
        async build() {
            const entries = await journalService.list();
            const pending = entries.filter((e) => e.status === 'pending_approval');
            return {
                id: 'journal-approvals-pending',
                title: 'Journal Entries Awaiting Approval',
                kind: 'list',
                emptyText: 'Nothing awaiting approval.',
                rows: pending.map((e) => ({ label: e.entryNo, sublabel: e.description, value: e.entryDate, tone: 'warning' })),
            };
        },
    },
    {
        id: 'budget-approvals-pending',
        section: 'attention',
        requiredPermission: 'budget.approve',
        async build() {
            const budgets = await budgetsService.list();
            const pending = budgets.filter((b) => b.status === 'draft');
            return {
                id: 'budget-approvals-pending',
                title: 'Budgets Awaiting Approval',
                kind: 'list',
                emptyText: 'Nothing awaiting approval.',
                rows: pending.map((b) => ({ label: b.name, sublabel: `FY${b.fiscalYear}`, tone: 'warning' })),
            };
        },
    },
    {
        id: 'procurement-approvals-pending',
        section: 'attention',
        requiredPermission: ['procurement.requisition.approve', 'procurement.payment.approve'],
        async build({ permissions }) {
            const rows = [];
            if (permissions.includes('procurement.requisition.approve')) {
                const requisitions = await procurementService.listRequisitions();
                for (const r of requisitions.filter((r) => r.status === 'submitted')) {
                    rows.push({ label: r.requisitionNo, sublabel: 'Requisition awaiting approval', value: r.requestDate, tone: 'warning' });
                }
            }
            if (permissions.includes('procurement.payment.approve')) {
                const invoices = await procurementService.listSupplierInvoices();
                for (const i of invoices.filter((i) => i.status === 'pending')) {
                    rows.push({ label: i.invoiceNo, sublabel: 'Invoice pending payment', value: money(Number(i.amount)), tone: 'warning' });
                }
            }
            return { id: 'procurement-approvals-pending', title: 'Procurement Awaiting Your Action', kind: 'list', emptyText: 'Nothing awaiting approval.', rows };
        },
    },
    {
        id: 'leave-approvals-pending',
        section: 'attention',
        requiredPermission: 'leave.approve',
        async build() {
            const [requests, staff] = await Promise.all([leaveService.list(), staffService.list()]);
            const staffName = new Map(staff.map((s) => [s.id, s.fullName]));
            const pending = requests.filter((r) => r.status === 'pending');
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
            };
        },
    },
    {
        id: 'disciplinary-cases-open',
        section: 'attention',
        requiredPermission: 'disciplinary_cases.manage',
        async build() {
            const cases = await disciplinaryCasesService.list();
            const open = cases.filter((c) => c.status !== 'closed');
            return {
                id: 'disciplinary-cases-open',
                title: 'Disciplinary Cases In Progress',
                kind: 'list',
                emptyText: 'No open cases.',
                rows: open.map((c) => ({ label: `Case #${c.id}`, sublabel: c.status.replace(/_/g, ' '), tone: 'warning' })),
            };
        },
    },
    {
        id: 'inventory-low-stock',
        section: 'attention',
        requiredPermission: 'inventory.view',
        async build() {
            const [items, movements] = await Promise.all([inventoryService.listItems(), inventoryService.listAllMovements()]);
            const balanceByItem = new Map();
            for (const m of movements) {
                const qty = Number(m.quantity) * (m.movementType === 'issue' ? -1 : 1);
                balanceByItem.set(m.itemId, (balanceByItem.get(m.itemId) ?? 0) + qty);
            }
            const low = items.filter((it) => it.reorderLevel !== null && (balanceByItem.get(it.id) ?? 0) <= Number(it.reorderLevel));
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
            };
        },
    },
    {
        id: 'library-overdue',
        section: 'attention',
        requiredPermission: 'library.view',
        async build({ asOfDate }) {
            const overdue = await libraryService.listOverdue(asOfDate);
            return {
                id: 'library-overdue',
                title: 'Overdue Library Books',
                kind: 'list',
                emptyText: 'Nothing overdue.',
                rows: overdue.map((b) => ({ label: `Borrowing #${b.id}`, sublabel: `Due ${b.dueDate}`, tone: 'warning' })),
            };
        },
    },
    // ---------------- STUDENTS & ACADEMIC ----------------
    {
        id: 'enrollment',
        section: 'students',
        requiredPermission: 'students.view',
        async build() {
            const [students, classes] = await Promise.all([studentsService.list(), studentsService.listClasses()]);
            const active = students.filter((s) => s.status === 'active');
            const classNameById = new Map(classes.map((c) => [c.id, c.name]));
            const byClass = new Map();
            for (const s of active)
                byClass.set(s.classId, (byClass.get(s.classId) ?? 0) + 1);
            return {
                id: 'enrollment',
                title: 'Enrollment',
                kind: 'stats',
                stats: [
                    { label: 'Active Students', value: String(active.length) },
                    ...[...byClass.entries()].slice(0, 5).map(([classId, count]) => ({ label: classNameById.get(classId) ?? `Class #${classId}`, value: String(count) })),
                ],
            };
        },
    },
    {
        id: 'academic-snapshot',
        section: 'students',
        requiredPermission: 'exams.view',
        async build() {
            const exams = await examsService.listExams();
            const sorted = [...exams].sort((a, b) => b.id - a.id);
            let mostRecent = null;
            for (const exam of sorted) {
                const results = await examsService.getResultsForExam(exam.id);
                if (results.length > 0) {
                    const mean = results.reduce((sum, r) => sum + Number(r.marks), 0) / results.length;
                    mostRecent = { name: exam.name, mean: Math.round(mean * 10) / 10 };
                    break;
                }
            }
            return {
                id: 'academic-snapshot',
                title: 'Academic',
                kind: 'stats',
                stats: [
                    { label: 'Exams Recorded', value: String(exams.length) },
                    { label: 'Most Recent Exam', value: mostRecent ? `${mostRecent.name} — mean ${mostRecent.mean}` : 'No results yet' },
                ],
            };
        },
    },
    {
        id: 'admissions-pipeline',
        section: 'students',
        requiredPermission: 'admissions.view',
        async build() {
            const admissions = await admissionsService.list();
            const byStatus = new Map();
            for (const a of admissions)
                byStatus.set(a.status, (byStatus.get(a.status) ?? 0) + 1);
            return {
                id: 'admissions-pipeline',
                title: 'Admissions Pipeline',
                kind: 'stats',
                stats: [...byStatus.entries()].map(([status, count]) => ({
                    label: status.replace(/_/g, ' '),
                    value: String(count),
                    tone: status === 'pending' || status === 'interview_scheduled' ? 'warning' : 'default',
                })),
            };
        },
    },
    {
        id: 'timetable-status',
        section: 'students',
        requiredPermission: 'timetable.view',
        async build() {
            const periods = await timetableService.listLessonPeriods();
            return {
                id: 'timetable-status',
                title: 'Timetable',
                kind: 'stats',
                stats: [{ label: 'Lesson Periods Configured', value: String(periods.length) }],
            };
        },
    },
    {
        id: 'library-overview',
        section: 'students',
        requiredPermission: 'library.view',
        async build() {
            const books = await libraryService.listBooks();
            return {
                id: 'library-overview',
                title: 'Library',
                kind: 'stats',
                stats: [
                    { label: 'Titles in Catalog', value: String(books.length) },
                    { label: 'Total Copies', value: String(books.reduce((sum, b) => sum + b.totalCopies, 0)) },
                ],
            };
        },
    },
    {
        id: 'student-conduct',
        section: 'students',
        requiredPermission: ['discipline.view', 'conduct_points.view'],
        async build({ permissions }) {
            const stats = [];
            if (permissions.includes('discipline.view')) {
                const recent = await disciplineService.listRecent(20);
                stats.push({ label: 'Discipline Records (recent)', value: String(recent.length) });
            }
            if (permissions.includes('conduct_points.view')) {
                const recent = await conductPointsService.listRecent(20);
                stats.push({ label: 'Conduct Points Awarded (recent)', value: String(recent.length) });
            }
            return { id: 'student-conduct', title: 'Student Conduct', kind: 'stats', stats };
        },
    },
    {
        id: 'disciplinary-cases-overview',
        section: 'students',
        requiredPermission: 'disciplinary_cases.view',
        async build() {
            const cases = await disciplinaryCasesService.list();
            const byStatus = new Map();
            for (const c of cases)
                byStatus.set(c.status, (byStatus.get(c.status) ?? 0) + 1);
            return {
                id: 'disciplinary-cases-overview',
                title: 'Disciplinary Cases',
                kind: 'stats',
                stats: [
                    { label: 'Total Cases', value: String(cases.length) },
                    ...[...byStatus.entries()].map(([status, count]) => ({ label: status.replace(/_/g, ' '), value: String(count) })),
                ],
            };
        },
    },
    // ---------------- HR & WELFARE ----------------
    {
        id: 'hr-overview',
        section: 'hr',
        requiredPermission: 'staff.view',
        async build() {
            const staff = await staffService.list();
            return {
                id: 'hr-overview',
                title: 'Staff',
                kind: 'stats',
                stats: [
                    { label: 'Total Staff', value: String(staff.length) },
                    { label: 'Active', value: String(staff.filter((s) => s.status === 'active').length) },
                ],
            };
        },
    },
    {
        id: 'leave-overview',
        section: 'hr',
        requiredPermission: 'leave.view',
        async build() {
            const requests = await leaveService.list();
            const byStatus = new Map();
            for (const r of requests)
                byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
            return {
                id: 'leave-overview',
                title: 'Leave',
                kind: 'stats',
                stats: [...byStatus.entries()].map(([status, count]) => ({ label: `${status[0].toUpperCase()}${status.slice(1)}`, value: String(count) })),
            };
        },
    },
    {
        id: 'contracts-expiring',
        section: 'hr',
        requiredPermission: 'contracts.view',
        async build({ asOfDate }) {
            const [contracts, staff] = await Promise.all([contractsService.list(), staffService.list()]);
            const staffName = new Map(staff.map((s) => [s.id, s.fullName]));
            const expiring = contracts.filter((c) => c.status === 'active' && c.endDate && daysUntil(asOfDate, c.endDate) >= 0 && daysUntil(asOfDate, c.endDate) <= 60);
            return {
                id: 'contracts-expiring',
                title: 'Contracts Expiring Soon',
                kind: 'list',
                emptyText: 'No contracts expiring in the next 60 days.',
                rows: expiring.map((c) => ({
                    label: staffName.get(c.staffId) ?? `Staff #${c.staffId}`,
                    sublabel: `${c.contractType.replace(/_/g, ' ')} — ends ${c.endDate}`,
                    tone: 'warning',
                })),
            };
        },
    },
    {
        id: 'staff-discipline-overview',
        section: 'hr',
        requiredPermission: 'staff_discipline.view',
        async build() {
            const recent = await staffDisciplineService.listRecent(10);
            return {
                id: 'staff-discipline-overview',
                title: 'Staff Disciplinary Records',
                kind: 'stats',
                stats: [{ label: 'Recent Records', value: String(recent.length) }],
            };
        },
    },
    {
        id: 'boarding-overview',
        section: 'welfare',
        requiredPermission: 'boarding.view',
        async build() {
            const [dorms, occupied] = await Promise.all([boardingService.listDormitories(), boardingService.countActiveAllocations()]);
            const capacity = dorms.reduce((sum, d) => sum + d.capacity, 0);
            return {
                id: 'boarding-overview',
                title: 'Boarding',
                kind: 'stats',
                stats: [
                    { label: 'Dormitories', value: String(dorms.length) },
                    { label: 'Beds Occupied', value: `${occupied} / ${capacity}` },
                ],
            };
        },
    },
    {
        id: 'health-overview',
        section: 'welfare',
        requiredPermission: 'health.access',
        async build() {
            const recent = await healthService.listRecentVisits(20);
            return {
                id: 'health-overview',
                title: 'School Health',
                kind: 'stats',
                stats: [
                    { label: 'Recent Clinic Visits', value: String(recent.length) },
                    { label: 'Referred to Hospital (recent)', value: String(recent.filter((v) => v.referredToHospital).length), tone: 'warning' },
                ],
            };
        },
    },
    {
        id: 'transport-overview',
        section: 'welfare',
        requiredPermission: 'transport.view',
        async build() {
            const [routes, allocated] = await Promise.all([transportService.listRoutes(), transportService.countActiveAllocations()]);
            return {
                id: 'transport-overview',
                title: 'Transport',
                kind: 'stats',
                stats: [
                    { label: 'Bus Routes', value: String(routes.length) },
                    { label: 'Students Allocated', value: String(allocated) },
                ],
            };
        },
    },
    {
        id: 'counseling-overview',
        section: 'welfare',
        requiredPermission: 'counseling.access',
        async build({ asOfDate }) {
            const sessions = await counselingService.list();
            const thisYear = sessions.filter((s) => s.sessionDate.slice(0, 4) === asOfDate.slice(0, 4));
            return {
                id: 'counseling-overview',
                title: 'Guidance & Counseling',
                kind: 'stats',
                stats: [{ label: 'Sessions This Year', value: String(thisYear.length) }],
            };
        },
    },
    // ---------------- COMPLIANCE ----------------
    {
        id: 'compliance-overview',
        section: 'compliance',
        requiredPermission: 'compliance.view',
        async build() {
            const reports = await complianceService.list();
            return {
                id: 'compliance-overview',
                title: 'Regulatory Reports',
                kind: 'stats',
                stats: [
                    { label: 'Total Reports', value: String(reports.length) },
                    { label: 'Draft', value: String(reports.filter((r) => r.status === 'draft').length), tone: 'warning' },
                    { label: 'Submitted', value: String(reports.filter((r) => r.status === 'submitted').length), tone: 'success' },
                ],
            };
        },
    },
    {
        id: 'documents-overview',
        section: 'compliance',
        requiredPermission: 'documents.view',
        async build() {
            const docs = await documentsService.listAll();
            return {
                id: 'documents-overview',
                title: 'Documents Issued',
                kind: 'stats',
                stats: [{ label: 'Total Issued', value: String(docs.length) }],
            };
        },
    },
    // ---------------- GENERAL ----------------
    {
        id: 'notices-feed',
        section: 'general',
        requiredPermission: 'dashboard.view',
        async build() {
            const notices = await noticesService.listForStaff();
            const recent = [...notices].sort((a, b) => b.id - a.id).slice(0, 5);
            return {
                id: 'notices-feed',
                title: 'Notices',
                kind: 'list',
                emptyText: 'No notices right now.',
                rows: recent.map((n) => ({ label: n.title, sublabel: n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : undefined })),
            };
        },
    },
    {
        id: 'audit-recent',
        section: 'general',
        requiredPermission: 'audit.view',
        async build() {
            const entries = await identityService.listAuditLog(8);
            return {
                id: 'audit-recent',
                title: 'Recent Audit Activity',
                kind: 'list',
                emptyText: 'No audit activity yet.',
                rows: entries.map((e) => ({
                    label: `${e.entry.action} ${e.entry.entityType}#${e.entry.entityId}`,
                    sublabel: e.actorName ?? e.actorEmail ?? 'System',
                    value: new Date(e.entry.createdAt).toLocaleString(),
                })),
            };
        },
    },
];
export const SECTION_TITLES = {
    attention: 'Needs Your Attention',
    financial: 'Financial',
    students: 'Students & Academics',
    hr: 'HR & Staff',
    welfare: 'Welfare & Facilities',
    compliance: 'Compliance',
    general: 'General',
};
export const SECTION_ORDER = ['attention', 'financial', 'students', 'hr', 'welfare', 'compliance', 'general'];
export { hasGate };
