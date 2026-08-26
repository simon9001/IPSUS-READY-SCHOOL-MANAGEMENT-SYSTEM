# RBAC — Roles & Permissions

Custom-built, not a third-party auth provider. Defined in `src/modules/identity/rbac.ts`, seeded into the database by `src/db/seed.ts`. **80 permissions, 21 roles.**

## The permission model

- Permission codes are dot-namespaced: `<module>.<resource>.<action>` (e.g. `ledger.journal.approve`) or `<module>.<action>` (e.g. `fees.view`).
- `role_permissions` and `user_roles` are junction tables — a user can hold multiple roles (e.g. a Bursar who is also the Payroll Officer at a small school), and a role can be scoped to a specific resource via `user_roles.scopeType`/`scopeId` (defined but not yet used by any module — an extension point for e.g. a class-teacher role scoped to one class).

## The `VIEW_ONLY` sweep — and its two deliberate exceptions

`rbac.ts` computes `VIEW_ONLY` as every permission whose code ends in `.view`, and several broad-oversight roles (`bom_member`, `internal_auditor`, `external_auditor`, `system_admin`) are granted that entire set automatically. This is convenient — add a new `*.view` permission anywhere in the system, and auditors/BOM automatically see it — but it means **naming a permission `something.view` is itself a decision**, not just a description.

Three permissions were deliberately named to **avoid** this sweep:
- **`portal.access`** (not `portal.view`) — this isn't "view everything," it's "may use the parent portal at all," and actual data access is separately gated by `guardiansService.assertGuardianOfStudent` (an ownership check, not a permission check).
- **`counseling.access`** (not `counseling.view`) — confidential counseling notes must not become automatically visible to BOM members or auditors just because they hold a generic view-everything role. Only the `counselor` role and the Principal have this explicitly.
- **`health.access`** (not `health.view`) — same reasoning as counseling: medical records are confidential. Only the `school_nurse` role and the Principal have this explicitly.

If you add a new sensitive permission in the future, ask whether it should behave like these before defaulting to a `*.view` name.

## Roles

| Role | Who | Scope |
|---|---|---|
| `system_admin` | IT/system administrator | User/role management, period locking, audit trail, + full `VIEW_ONLY` sweep |
| `principal` | Head teacher / accounting officer | Broad approval authority: journal approval, budget approval, procurement/payroll approval, admissions, disciplinary cases, notices — plus view access across nearly everything |
| `bursar` | School accountant | Day-to-day financial operations: ledger entry, fees, procurement capture, payroll processing, banking |
| `accounts_clerk` | Front-office fee receipting | Narrow: fee receipting and invoicing only, no journal/payroll/procurement access |
| `bom_treasurer` | Board of Management | Co-approves budgets and journal entries alongside the Principal, + `VIEW_ONLY` |
| `bom_member` | Board of Management | View-only across the system for governance meetings (`VIEW_ONLY`, nothing else) |
| `procurement_officer` | Procurement | Requisitions, LPOs, supplier invoices |
| `store_keeper` | Stores | Inventory receipts/issues only |
| `payroll_officer` | Payroll (segregated from Bursar) | Payroll processing only |
| `internal_auditor` | Internal audit | `VIEW_ONLY` + audit trail |
| `external_auditor` | OAG / statutory audit | Same as internal auditor — time-boxed in practice, not enforced in code |
| `parent` | Guardian portal user | `portal.access` only — everything else is the ownership check, not a permission |
| `hr_officer` | HR | Full manage+view across staff, leave, contracts, appraisals, staff discipline |
| `registrar` | Admissions officer | `admissions.manage`/`admissions.view` only |
| `teacher` | Classroom teacher | Day-to-day student conduct: discipline logging, conduct points — **not** disciplinary cases; also clubs (patrons) and timetable view |
| `counselor` | Guidance counselor | Confidential counseling access, plus discipline view for context |
| `boarding_officer` | Matron/Boarding Master | Dormitories, bed allocation, boarding attendance |
| `school_nurse` | School nurse | Confidential medical records (`health.access`, same exception pattern as counseling) |
| `transport_officer` | Transport | Bus routes, stops, student allocations |
| `timetable_coordinator` | Timetabling | Builds/edits class and exam timetables |
| `librarian` | Library | Catalog, borrowing/returns, fines |

## Permission groups by module

| Module | Permission count | Notes |
|---|---|---|
| `identity` | 2 | `users.manage`, `roles.manage` |
| `ledger` | 6 | Accounts, funds, periods, journal create/approve/view |
| `budget` | 3 | manage/approve/view |
| `fees` | 4 | structure/invoice/receipt/view |
| `grants` | 2 | record/view |
| `procurement` | 7 | Full chain: requisition create/approve, LPO, invoice, payment create/approve, view |
| `payroll` | 4 | manage/process/approve/view |
| `assets` | 2 | manage/view |
| `inventory` | 2 | manage/view |
| `banking` | 4 | manage, reconcile, imprest issue/retire |
| `reports` | 2 | view/export |
| `audit` | 1 | view |
| `communication` | 3 | notices.manage, notifications.send, **portal.access** (exception, see above) |
| `hr` | 11 | staff, leave (incl. approve), contracts, appraisals, staff discipline |
| `admissions` | 2 | manage/view |
| `student_discipline` | 8 | discipline, conduct_points, disciplinary_cases, counseling (incl. **counseling.access**, exception, see above) |
| `welfare` | 6 | boarding, health (incl. **health.access**, exception, see above), transport |
| `academic_ops` | 6 | timetable, library, clubs |
| `compliance` | 5 | compliance reports, documents, **dashboard.view** |

## Known gaps

- **Core academic module still has no dedicated permissions.** `teachers`, `subjects`, `exams`, `attendance`, and `promotions` endpoints exist with no permission codes gating them at all — this module was built before the RBAC-per-module habit was established, and it was flagged as a gap by the user rather than caught proactively. Notably, this gap is now inconsistent within the same domain: the `exams` module's later extension (exam timetabling) and the separate `timetable`/`library`/`clubs` modules that were built afterward *do* have permissions (`timetable.*`, under `academic_ops`), while the original exam/attendance/promotion actions they sit next to still don't. It doesn't block anything today (no auth middleware is wired up to check permissions yet regardless), but before wiring up real auth, add permission codes for the original academic module following the same pattern used everywhere since.
- **No live enforcement.** `src/common/auth.ts` defines `requirePermission(code)` as a middleware, but it is not attached to any route yet — see [01-architecture.md](01-architecture.md#no-authentication-middleware--deliberately). All of the above is the *design*, ready to be enforced once real auth middleware exists.

## Seeding

`src/db/seed.ts` inserts `PERMISSIONS` and `ROLES` from `rbac.ts` verbatim, deduplicating each role's permission list (`[...new Set(role.permissions)]`) before inserting `role_permissions` — this guards against a permission accidentally appearing twice in a role's list (e.g. once explicitly, once via a `...VIEW_ONLY` spread) causing a unique-constraint violation on insert.
