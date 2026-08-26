# Database Schema

97 tables across 41 schema files in `src/db/schema/`, applied via 9 incremental Drizzle migrations in `drizzle/`. Every table below is grouped by the domain it belongs to; the schema file name is given so it's easy to find in code.

## Identity & Access Control (`identity.ts`, `audit.ts`) — 8 tables

Custom auth — no third-party auth provider. Parent/guardian accounts (see Communication) are ordinary rows in `users` with the `parent` role, not a separate account type.

| Table | Purpose |
|---|---|
| `users` | Every login account — staff and parents alike. `passwordHash` (bcrypt), lockout fields, `mustChangePassword` |
| `roles` | Fixed catalogue of 21 roles (see [09-rbac.md](09-rbac.md)) |
| `permissions` | 80 dot-namespaced permission codes (e.g. `ledger.journal.post`) |
| `role_permissions` | Role ↔ permission junction |
| `user_roles` | User ↔ role junction; supports multiple roles per user and an optional scope (`scopeType`/`scopeId`) for future narrowing, e.g. a class teacher scoped to one class |
| `refresh_tokens` | Hashed refresh tokens, for whenever session/JWT auth is built |
| `password_reset_tokens` | Hashed reset tokens |
| `audit_log` | Generic before/after JSON change log — not yet wired to any module's writes, but the table and shape exist |

## Ledger Core (`accounts.ts`, `funds.ts`, `periods.ts`, `journal.ts`) — 6 tables

The financial spine every other financial module posts through.

| Table | Purpose |
|---|---|
| `accounts` | Chart of Accounts — self-referencing (`parentId`) for hierarchy, `type` (asset/liability/net_assets/revenue/expense), `normalBalance` (debit/credit) |
| `funds` | Voteheads — Capitation, Tuition, Boarding, Development, PTA, Bursary, Trading — each flagged `restricted`/`unrestricted` (IPSAS 23) |
| `fiscal_periods` | School terms/years, with `status` (open/closed) for period-locking |
| `journal_entries` | Header: `entryNo`, `status` (draft/pending_approval/posted/rejected/reversed), maker-checker fields (`submittedAt`, `approvedBy`, `postedBy`) |
| `journal_lines` | Debit/credit lines, each tagged with `accountId` **and** `fundId` — this dual-tagging is what makes fund-scoped Trial Balance and per-fund financial statements possible |

## Budgets (`budgets.ts`) — 2 tables

`budgets`, `budget_lines` — a budget document plus per-account/fund/period line amounts. Actuals for Budget vs Actual (IPSAS 24) are computed live from `journal_lines`, not stored.

## Students & Fees (`students.ts`, `fees.ts`) — 9 tables

| Table | Purpose |
|---|---|
| `classes`, `streams` | Form 1–4 (or Grade 7+ for JSS), and subdivisions within a class |
| `students` | The core student record. Includes `nemisUpi` (added later, for admissions/transfers), `status` (active/transferred/graduated/withdrawn/**suspended**/**expelled** — the last two added for the disciplinary-case workflow) |
| `fee_structures`, `fee_structure_items` | Fee schedule per class/term/boarding-status, broken into voteheads |
| `fee_invoices`, `fee_invoice_items` | Billed amounts per student, itemized by account+fund |
| `fee_payments`, `fee_payment_allocations` | Receipts, allocated (FIFO) across outstanding invoice items — a single payment can span multiple funds, and the allocation table records exactly how much went to which item |

## Grants / Capitation (`grants.ts`) — 2 tables

`grant_types` (e.g. FDSE Capitation, linked to a fund + revenue account), `grant_disbursements` (a `conditionsMet` boolean gates whether the disbursement is recognized as revenue yet — IPSAS 23/47 non-exchange revenue).

## Procurement (`procurement.ts`) — 9 tables

`suppliers` → `purchase_requisitions`/`requisition_items` → `purchase_orders`/`purchase_order_items` → `goods_received_notes`/`grn_items` → `supplier_invoices` → `supplier_payments`. Follows the PPADA-style procurement chain.

## Payroll (`payroll.ts`) — 4 tables

`employees` (**BOM-paid staff only** — TSC teachers are not on this payroll), `salary_components` (basic/allowance/deduction, supports percentage-of-basic), `payroll_runs`, `payslips`.

## Fixed Assets & Inventory (`assets.ts`, `inventory.ts`) — 6 tables

`asset_categories` (links to the 3 GL accounts a category depreciates through), `assets`, `depreciation_entries`, `asset_disposals` (IPSAS 17). `inventory_items`, `stock_movements` (IPSAS 12 stores).

## Banking (`banking.ts`) — 5 tables

`bank_accounts`, `bank_reconciliations`/`bank_reconciliation_items`, `imprest_requests`/`imprest_retirements`.

## Academic Records (`teachers.ts`, `subjects.ts`, `exams.ts`, `attendance.ts`, `discipline.ts`, `promotions.ts`) — 14 tables

| Table | Purpose |
|---|---|
| `teachers` | All teaching staff — TSC (via `tscNumber`) and BOM-paid (via `employeeId` link) |
| `subjects`, `class_subjects`, `teacher_assignments` | Subject catalog, per-class offerings, term-scoped teacher-to-class assignments |
| `grading_scales`, `grading_bands` | Flexible grade bands — works for 8-4-4/KCSE letter grades or CBC rubric bands, whichever the school uses |
| `exams`, `exam_results` | Exams per class/term, marks per student/subject, auto-graded against the exam's grading scale |
| `exam_timetable_entries` | Added later (see Academic Operations below) — one `exams` row can span several subject-specific sittings across days |
| `attendance_records` | Daily attendance, one row per student per day |
| `discipline_records` | Punitive incident log — see also `conduct_points.ts` and `disciplinary_cases.ts` below for the fuller conduct system |
| `promotions` | Promotion/repeat/transfer/graduate/withdraw decisions — updates the student's `classId` or `status` as a side effect |

## Communication (`guardians.ts`, `notices.ts`, `notifications.ts`) — 4 tables

| Table | Purpose |
|---|---|
| `guardian_students` | Links a `users` row (a parent account) to one or more `students` rows, with `relationship` and `isPrimary` |
| `notices` | School announcements, targeted by audience (`all`/`parents`/`staff`/`class`) |
| `notification_templates`, `notifications` | Reusable `{{placeholder}}` templates and the actual send queue/log (channel, status, related entity) |

## HR (`staff.ts`, `leave.ts`, `contracts.ts`, `appraisals.ts`, `staffDiscipline.ts`) — 6 tables

| Table | Purpose |
|---|---|
| `staff` | Canonical registry for **every** staff member — teaching + non-teaching, TSC + BOM — with optional links into `employees` (payroll) and `teachers` (academic) |
| `leave_types`, `leave_requests` | Leave catalog and applications; balances are computed live from approved requests, not stored |
| `staff_contracts` | Permanent/fixed-term/probation contracts |
| `staff_appraisals` | Term-linked performance appraisals |
| `staff_disciplinary_records` | Staff conduct — distinct from `discipline_records`, which is for students |

## Admissions (`admissions.ts`) — 1 table

`admissions` — one wide table with an `admissionType` discriminator (`placement`/`transfer`/`direct`) and a `status` state machine. Placement and transfer skip straight to `admitted` (no interview); direct applications go through `pending → interview_scheduled → admitted/waitlisted/rejected`. All three converge on enrollment, which creates the actual `students` row.

## Student Conduct (`conductPoints.ts`, `disciplinaryCases.ts`, `counseling.ts`) — 4 tables

| Table | Purpose |
|---|---|
| `conduct_point_rules`, `conduct_points` | Merit/demerit point rules and the award ledger — running conduct score computed per student/term by summing |
| `disciplinary_cases` | The formal suspension/expulsion process — parent summons, hearing, **BOM review (required before an expulsion decision)**, decision, suspension dates, re-admission date |
| `counseling_sessions` | Confidential guidance & counseling records, deliberately separate from punitive discipline |

## Welfare & Facilities (`boarding.ts`, `health.ts`, `transport.ts`) — 9 tables

| Table | Purpose |
|---|---|
| `dormitories`, `bed_allocations` | Dormitory registry (with warden link to `staff`) and per-student bed assignment, capacity-checked |
| `boarding_attendance` | Nightly boarding presence — distinct from `attendance_records` (day/class attendance); an `absent` status triggers a guardian alert |
| `medical_conditions`, `clinic_visits`, `medication_administrations` | Confidential health records; a `clinic_visits.referredToHospital` flag triggers a guardian alert |
| `bus_routes`, `route_stops`, `student_transport_allocations` | Transport routes/stops and capacity-checked student allocations |

## Academic Operations & Student Life (`timetable.ts`, `library.ts`, `clubs.ts`) — 10 tables

| Table | Purpose |
|---|---|
| `lesson_periods` | Fixed daily period times (e.g. "Period 1" = 08:00–08:40), independent of which day |
| `timetable_entries` | The class timetable grid — class/stream + subject + teacher + day + lesson period + term, guarded against double-booking a class *or* a teacher in the same slot |
| `library_books`, `book_borrowings` | Catalog and borrowing; availability is computed live (`totalCopies` − active borrows), not stored; late returns compute a fine automatically |
| `clubs`, `club_memberships` | Clubs/sports/societies and student membership, with a `staff` patron link |
| `competitions`, `competition_participants` | Kenya's real competition tiers (school→zonal→county→regional→national), with per-student results/achievements |

## Compliance, Documents & Dashboard (`compliance.ts`, `documents.ts`) — 3 tables

| Table | Purpose |
|---|---|
| `compliance_reports` | NEMIS/TSC/MoE regulatory returns — `reportData` is a **frozen JSON snapshot** taken at generation time, since a filed return is a historical record and must not silently change if underlying data (e.g. a later-withdrawn student) changes afterward. Draft → submitted lifecycle carries the government's reference number |
| `document_templates`, `generated_documents` | Reusable `{{placeholder}}` letter templates (shares the rendering logic in `src/common/template.ts` with `notifications`) and the issued-document log — covers rendered letters *and* structured documents like transcripts (stored as JSON in `content`), each with a unique verifiable `referenceNumber` |

The dashboard module has no tables of its own — like `portal`, it's pure aggregation over other modules' services (Trial Balance + fee status + enrollment + most-recent-exam mean marks in one call).

## Cross-cutting design notes

- **Self-referencing FK**: `accounts.parentId` references `accounts.id` (Chart of Accounts hierarchy) — the only self-referencing table in the schema, requires `AnyPgColumn` typing in Drizzle to avoid a circular-type error.
- **Enum extension in place**: `student_status` was extended after the fact (`ALTER TYPE ... ADD VALUE 'suspended'`/`'expelled'`) rather than being redefined — Postgres enums can only be added to, never have values removed, without a table rewrite.
- **Long FK constraint names**: two auto-generated constraint names exceed Postgres's 63-character identifier limit and get silently truncated (a `NOTICE`, not an error) — cosmetic only, not a functional issue.
- **The one deliberate exception to "computed live, never stored"**: `compliance_reports.reportData` freezes a JSON snapshot at generation time rather than being recomputed on every read. This is intentional and different from the Trial Balance/leave-balance/conduct-score pattern elsewhere — a filed government return is a historical record of what was actually submitted, and must not silently change if the underlying data changes later (e.g. a student who was active at filing time is later marked withdrawn).
