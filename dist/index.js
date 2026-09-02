import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AppError } from './common/errors.js';
import { requestLogger, logError, metricsHandler } from './common/observability.js';
import { assertDatabaseConnection } from './db/client.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { attachUser } from './modules/auth/auth.middleware.js';
import { accountsRoutes } from './modules/accounts/accounts.routes.js';
import { fundsRoutes } from './modules/funds/funds.routes.js';
import { periodsRoutes } from './modules/periods/periods.routes.js';
import { journalRoutes, reportsRoutes } from './modules/journal/journal.routes.js';
import { budgetsRoutes } from './modules/budgets/budgets.routes.js';
import { studentsRoutes } from './modules/students/students.routes.js';
import { feesRoutes } from './modules/fees/fees.routes.js';
import { grantsRoutes } from './modules/grants/grants.routes.js';
import { procurementRoutes } from './modules/procurement/procurement.routes.js';
import { payrollRoutes } from './modules/payroll/payroll.routes.js';
import { assetsRoutes } from './modules/assets/assets.routes.js';
import { inventoryRoutes } from './modules/inventory/inventory.routes.js';
import { bankingRoutes } from './modules/banking/banking.routes.js';
import { teachersRoutes } from './modules/teachers/teachers.routes.js';
import { subjectsRoutes } from './modules/subjects/subjects.routes.js';
import { examsRoutes } from './modules/exams/exams.routes.js';
import { attendanceRoutes } from './modules/attendance/attendance.routes.js';
import { disciplineRoutes } from './modules/discipline/discipline.routes.js';
import { promotionsRoutes } from './modules/promotions/promotions.routes.js';
import { guardiansRoutes } from './modules/guardians/guardians.routes.js';
import { noticesRoutes } from './modules/notices/notices.routes.js';
import { notificationsRoutes } from './modules/notifications/notifications.routes.js';
import { portalRoutes } from './modules/portal/portal.routes.js';
import { staffRoutes } from './modules/staff/staff.routes.js';
import { leaveRoutes } from './modules/leave/leave.routes.js';
import { contractsRoutes } from './modules/contracts/contracts.routes.js';
import { appraisalsRoutes } from './modules/appraisals/appraisals.routes.js';
import { staffDisciplineRoutes } from './modules/staffDiscipline/staffDiscipline.routes.js';
import { admissionsRoutes } from './modules/admissions/admissions.routes.js';
import { conductPointsRoutes } from './modules/conductPoints/conductPoints.routes.js';
import { disciplinaryCasesRoutes } from './modules/disciplinaryCases/disciplinaryCases.routes.js';
import { counselingRoutes } from './modules/counseling/counseling.routes.js';
import { boardingRoutes } from './modules/boarding/boarding.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { transportRoutes } from './modules/transport/transport.routes.js';
import { timetableRoutes } from './modules/timetable/timetable.routes.js';
import { libraryRoutes } from './modules/library/library.routes.js';
import { clubsRoutes } from './modules/clubs/clubs.routes.js';
import { complianceRoutes } from './modules/compliance/compliance.routes.js';
import { documentsRoutes } from './modules/documents/documents.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { usersRoutes, rolesRoutes, auditLogRoutes } from './modules/identity/identity.routes.js';
import { systemRoutes } from './modules/system/system.routes.js';
import { realtimeRoutes } from './modules/realtime/realtime.routes.js';
import { searchRoutes } from './modules/search/search.routes.js';
const app = new Hono();
// CORS_ORIGIN is required so credentialed requests (Authorization header)
// are only ever accepted from known frontend origins, not reflected back
// for any caller.
const allowedOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
if (allowedOrigins.length === 0) {
    throw new Error('CORS_ORIGIN is not set — add it to .env (see .env.example)');
}
app.use('*', cors({ origin: allowedOrigins, credentials: true }));
app.use('*', requestLogger);
app.use('*', attachUser);
app.get('/', (c) => {
    return c.text('Kenyan High School Accounting System API');
});
// Prometheus scrape target. Left unauthenticated (standard for a metrics
// endpoint — the scraper has no user login to send) — restrict it at the
// network/reverse-proxy level before this is ever reachable from outside
// your own infrastructure.
app.get('/metrics', metricsHandler);
app.route('/api/auth', authRoutes);
app.route('/api/accounts', accountsRoutes);
app.route('/api/funds', fundsRoutes);
app.route('/api/periods', periodsRoutes);
app.route('/api/journal-entries', journalRoutes);
app.route('/api/reports', reportsRoutes);
app.route('/api/budgets', budgetsRoutes);
app.route('/api/students', studentsRoutes);
app.route('/api/fees', feesRoutes);
app.route('/api/grants', grantsRoutes);
app.route('/api/procurement', procurementRoutes);
app.route('/api/payroll', payrollRoutes);
app.route('/api/assets', assetsRoutes);
app.route('/api/inventory', inventoryRoutes);
app.route('/api/banking', bankingRoutes);
app.route('/api/teachers', teachersRoutes);
app.route('/api/subjects', subjectsRoutes);
app.route('/api/exams', examsRoutes);
app.route('/api/attendance', attendanceRoutes);
app.route('/api/discipline', disciplineRoutes);
app.route('/api/promotions', promotionsRoutes);
app.route('/api/guardians', guardiansRoutes);
app.route('/api/notices', noticesRoutes);
app.route('/api/notifications', notificationsRoutes);
app.route('/api/portal', portalRoutes);
app.route('/api/staff', staffRoutes);
app.route('/api/leave', leaveRoutes);
app.route('/api/contracts', contractsRoutes);
app.route('/api/appraisals', appraisalsRoutes);
app.route('/api/staff-discipline', staffDisciplineRoutes);
app.route('/api/admissions', admissionsRoutes);
app.route('/api/conduct-points', conductPointsRoutes);
app.route('/api/disciplinary-cases', disciplinaryCasesRoutes);
app.route('/api/counseling', counselingRoutes);
app.route('/api/boarding', boardingRoutes);
app.route('/api/health', healthRoutes);
app.route('/api/transport', transportRoutes);
app.route('/api/timetable', timetableRoutes);
app.route('/api/library', libraryRoutes);
app.route('/api/clubs', clubsRoutes);
app.route('/api/compliance', complianceRoutes);
app.route('/api/documents', documentsRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/users', usersRoutes);
app.route('/api/roles', rolesRoutes);
app.route('/api/audit-log', auditLogRoutes);
app.route('/api/system', systemRoutes);
app.route('/api/realtime', realtimeRoutes);
app.route('/api/search', searchRoutes);
app.onError((err, c) => {
    if (err instanceof AppError) {
        logError(c, err, err.statusCode);
        return c.json({ success: false, error: err.message }, err.statusCode);
    }
    logError(c, err, 500);
    return c.json({ success: false, error: 'Internal server error' }, 500);
});
const port = Number(process.env.PORT ?? 3000);
// Refuse to start listening at all until the database is actually reachable
// — no request should ever be able to hit this server and only then
// discover the DB connection is broken.
try {
    await assertDatabaseConnection();
    console.log('Database connection OK');
}
catch (err) {
    console.error('Failed to connect to the database — server will not start.');
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
}
serve({
    fetch: app.fetch,
    port
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
});
