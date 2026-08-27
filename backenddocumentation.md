# Backend Documentation — School Management System

A Node.js/TypeScript API for a Kenyan secondary school management system: IPSAS-aligned accounting, student records, admissions, academics (including CBC competency assessment), and the operational modules around them. 42 feature modules, 99 database tables, one consistent layered architecture throughout.

For the deeper per-module design rationale (IPSAS mapping, the admissions pathway model, conduct/discipline workflow, etc.) written as each module was originally built, see `project-documentation/` — this file is the current, single-page reference; that folder is the historical detail behind it and may lag on exact counts.

## Tech stack

| Concern | Choice |
|---|---|
| Runtime | Node.js + TypeScript |
| Web framework | Hono |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Validation | Zod (via `@hono/zod-validator`) |
| Auth | JWT (`jsonwebtoken`) + bcrypt password hashing |
| Dev server | `tsx watch` |

Run locally: `pnpm install`, bring up Postgres (`docker compose up -d` if using the provided container), `pnpm db:migrate` (or `pnpm db:push` on a fresh DB), `pnpm db:seed` (chart of accounts, funds, fiscal periods, full RBAC catalog, one admin login), then `pnpm dev` — serves on `http://localhost:4100` by default (`PORT` env var to override).

## Architecture pattern

Every feature module is a folder under `src/modules/<feature>/` with the same six files:

```
<feature>.routes.ts       Hono sub-app — path + HTTP method + requirePermission + zValidator + controller fn
<feature>.controller.ts   Thin — pulls params/validated body, calls the service, wraps the result via ok()/created()
<feature>.service.ts      Business logic — the only layer allowed to orchestrate multiple repository calls or other services
<feature>.repository.ts   Drizzle queries only — no business logic
<feature>.schema.ts       Zod input schemas + their inferred Input types
<feature>.types.ts        Drizzle-inferred row types ($inferSelect / $inferInsert)
```

Each module's `routes.ts` is mounted once in `src/index.ts` under `/api/<prefix>` (see the full mount list below). `src/common/` holds what every module shares: `response.ts` (`ok`/`created`/`noContent` — the `{success, data}` envelope), `errors.ts` (`AppError` subclasses mapped to HTTP status by a single `app.onError` handler), `auth.ts` (`requirePermission`/`requireAuth` middleware), `validate.ts` (the `zValidator` wrapper + `getValidated` helper).

### API response shape

Every endpoint returns `{ success: true, data }` (200/201) or `{ success: false, error, issues? }` (4xx/5xx) — `issues` is present on Zod validation failures (400) and lists each failing field. There is no other response shape anywhere in the API.

## Database

99 tables across 42 domains, all in `src/db/schema/*.ts`, re-exported through `src/db/schema/index.ts`. Migrations are Drizzle-generated SQL files in `drizzle/`. Two seed scripts:

- `pnpm db:seed` (`src/db/seed.ts`) — chart of accounts (28 accounts), funds (7), fiscal periods (2026 Terms 1–3), the full RBAC catalog (permissions + roles + mappings), and one `system_admin` login.
- `pnpm db:seed-demo-users` (`src/db/seed-demo-users.ts`) — one demo login per role (21 additional accounts), all sharing the same password as the admin. Idempotent — safe to re-run after adding a role.
- `pnpm db:sync-rbac` (`src/db/sync-rbac.ts`) — additive-only sync of `rbac.ts` into the database: inserts any permission/role/role-permission-mapping that's in the source file but missing from the DB. Never deletes or modifies an existing row. Run this after any edit to `rbac.ts`.

## Feature modules

Grouped by domain (mirrors the RBAC permission `module` tags):

**Finance / Ledger** — `accounts`, `funds`, `periods`, `journal` (double-entry engine + maker-checker approval for manual entries; system modules post directly), `budgets`, `banking` (bank accounts, reconciliation, imprest).

**Fees & Revenue** — `fees` (structures → invoices → payments, every write posts a real journal entry), `grants` (capitation/grant disbursements).

**Procurement & Assets** — `procurement` (requisition → LPO → GRN → supplier invoice → payment), `assets` (acquisition, depreciation runs, disposal), `inventory` (stock receive/issue).

**Payroll** — `payroll` (employees, salary components, payroll runs).

**Students & Admissions** — `students` (+ classes/streams), `admissions` (three intake pathways: government placement, inter-school transfer, direct application with interview), `guardians` (parent-student linking), `promotions` (end-of-year promotion history).

**Academics** — `teachers`, `subjects` (+ CBC competency strands, class offerings, teacher assignments), `exams` (grading scales/bands, exam results, **CBC strand-level results** — see below), `attendance`, `timetable`.

**Student Life & Conduct** — `discipline`, `conductPoints` (merit/demerit running score), `disciplinaryCases` (formal suspension/expulsion workflow: hearing → BOM review → decision → reinstatement), `counseling` (confidential), `library`, `clubs`.

**Welfare & Facilities** — `boarding` (dormitories, bed allocation, nightly attendance), `health` (confidential — conditions, clinic visits, medication), `transport` (routes, stops, allocations).

**HR** — `staff`, `leave`, `contracts`, `appraisals`, `staffDiscipline`.

**Communication & Portal** — `notices`, `notifications`, `portal` (parent-facing read endpoints — fee statement, report card, attendance, notices for their own linked children).

**Compliance & Documents** — `compliance` (NEMIS/TSC/MoE regulatory reports), `documents` (letters, transcripts, fee-clearance letters).

**Cross-cutting** — `dashboard` (combined financial/enrollment/academic summary), `identity` (RBAC catalog — `rbac.ts` — and password hashing; no routes of its own), `auth` (login/me).

## CBC compatibility

Built deliberately dual-mode, not CBC-bolted-on:

- **Grading scales are data, not code.** `grading_bands` rows can express either an 8-4-4/KCSE-style numeric scale (`80–100 → "A"`) or a CBC rubric (`0–25 → "Below Expectation"`) — same table, same lookup logic in `examsService`.
- **`subject_strands`** — optional per-subject breakdown (e.g. Mathematics → Numbers, Algebra, Measurement) for CBC's strand-level assessment. A subject with no strands is simply graded at the whole-subject level, as 8-4-4 always has been.
- **`exam_strand_results`** — records either a numeric mark (auto-banded against the exam's grading scale, same as a subject-level result) **or** a directly-assigned rubric grade with no mark at all — CBC assessment doesn't always carry a number. Zod enforces at least one of the two.
- **Classes are just `{name, level}`**, not hardcoded "Form 1–4" — a JSS/Senior School deployment seeds "Grade 7/8/9" instead with zero schema changes.
- **Admissions already speaks NEMIS/CBC**: the placement pathway is explicitly for government JSS/Senior School placement, and both `admissions` and `students` carry a `nemisUpi` field.

## RBAC — permissions and enforcement

**94 permissions, 22 roles.** Dot-namespaced codes (`ledger.journal.view`, `payroll.process`, `counseling.access`) defined in `src/modules/identity/rbac.ts` — the single source of truth for both the permission catalog and every role's grant list. A `VIEW_ONLY` constant is computed at load time as every `.view`-suffixed permission, and spread into the four broad-oversight roles (`system_admin`, `bom_treasurer`, `bom_member`, `internal_auditor`, `external_auditor`) so a new `.view` permission is automatically visible to them without editing those roles by hand.

**Every route in every module is permission-gated.** `requirePermission(code)` (in `src/common/auth.ts`) sits in front of each route: GET routes require the matching `.view` permission, mutating routes require `.manage` or a more specific action permission (e.g. `procurement.requisition.approve`, `ledger.journal.approve`). A handful of routes meant to be readable by any logged-in staff member with no dedicated view permission (school notices, a user's own notification inbox, cross-module reference data like fiscal periods) use `requireAuth()` instead — blocks unauthenticated requests without requiring a specific grant.

Two permission tiers are deliberately **not** swept into `VIEW_ONLY**`: `counseling.access` and `health.access` are confidential-record permissions, held only by the counselor/nurse/principal — a generic "view everything" role does not see them.

### Roles

| Role | Focus |
|---|---|
| System Administrator | User/role management, system config — deliberately not a financial approver or business-data editor |
| Principal | Final approver: budgets, manual journals, high-value payments, admissions decisions |
| Dean of Studies | Academic administration: timetable, exam scheduling/results, teacher oversight |
| Bursar | Day-to-day accounting: ledger, fees, procurement capture, payroll |
| Accounts/Fee Clerk | Front-office fee receipting only |
| BOM Treasurer / BOM Member | Board oversight; Treasurer co-approves budgets/journals |
| Procurement Officer / Store Keeper / Payroll Officer | Narrow, single-function operational roles |
| Internal / External Auditor | Read-only everywhere + audit trail |
| Parent/Guardian | Portal only — own linked children |
| HR Officer | Staff records, leave, contracts, appraisals, staff discipline |
| Registrar | Admissions pipeline, student records, compliance documents |
| Teacher | Classroom conduct, own attendance/exam entry, subjects (view) |
| Guidance Counselor | Confidential counseling sessions |
| Boarding Master/Matron, School Nurse, Transport Officer, Timetable Coordinator, Librarian | Single-domain operational roles |

Every staff role holds `dashboard.view` except `parent` (no staff dashboard for that role — no portal frontend exists yet to serve it).

### Known limitation

Portal routes (`/api/portal/:userId/...`) are gated on `portal.access` but the `:userId` path param isn't yet cross-checked against the authenticated caller's own id — a valid `portal.access` token could in principle request another guardian's `:userId`. Fixing this is a controller-level ownership check, not a routing/permission change, and is deferred until the parent-portal frontend is actually built.

## Notable business logic

- **Double-entry ledger, fund-restricted.** Every journal line carries a `fundId`; the trial balance and all financial reports respect fund restrictions. Manual entries go through maker-checker (`ledger.journal.create` → `ledger.journal.approve`, different people); system-originated entries (Fees, Payroll, Procurement, Assets) post directly via `journalService.postSystemEntry`.
- **Fees module writes real accounting entries.** Raising an invoice posts `Dr Fee Debtors / Cr <revenue accounts from the fee structure>`; recording a payment posts `Dr Cash/Bank / Cr Fee Debtors` and auto-allocates against the oldest outstanding invoice items first (FIFO).
- **Admissions is one state machine, three entry points.** Placement and transfer skip straight to `admitted` (already decided upstream); direct application walks `pending → interview_scheduled → admitted/waitlisted/rejected`. All three converge on the same `enroll()` step, which creates the actual `students` row.
