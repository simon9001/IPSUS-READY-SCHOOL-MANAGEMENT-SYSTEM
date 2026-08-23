# Kenyan Secondary School Management System — Project Documentation

This is the documentation for the school management system built in this repository. It started as an IPSAS-compliant accounting system for a Kenyan secondary school and has grown into a full school management backend covering finance, academics, communication, HR, admissions, and student conduct.

## Current scope

- **32 feature modules**, **76 database tables**, all on PostgreSQL (Drizzle ORM), Node.js/TypeScript, Hono web framework
- Every module follows the same layered architecture: `routes → controller → service → repository`, with `schema` (Zod validation) and `types` alongside
- Custom authentication/RBAC (no third-party auth provider) — 16 roles, 60+ granular permissions
- Verified end-to-end against a live PostgreSQL database at every stage (not just type-checked)

## Documents in this folder

| Document | Covers |
|---|---|
| [01-architecture.md](01-architecture.md) | Tech stack, the layered module pattern, project structure, conventions |
| [02-database-schema.md](02-database-schema.md) | All 76 tables, grouped by domain, with purpose and key relationships |
| [03-module-financial.md](03-module-financial.md) | The 12 financial sub-modules: ledger, budgets, fees, grants, procurement, payroll, assets, inventory, banking |
| [04-module-academic.md](04-module-academic.md) | Teachers, subjects, exams/grading, attendance, student discipline, promotions |
| [05-module-communication.md](05-module-communication.md) | Guardians/parent accounts, notices, notifications, parent portal |
| [06-module-hr.md](06-module-hr.md) | Staff registry, leave, contracts, appraisals, staff discipline |
| [07-module-admissions.md](07-module-admissions.md) | Government placement, inter-school transfer, and direct-application pathways |
| [08-module-student-conduct.md](08-module-student-conduct.md) | Merit/demerit points, formal suspension/expulsion process, confidential counseling |
| [09-rbac.md](09-rbac.md) | Full roles/permissions matrix and the design rules behind it |
| [10-ipsas-compliance.md](10-ipsas-compliance.md) | How the financial design maps to specific IPSAS standards |
| [11-setup-and-development.md](11-setup-and-development.md) | Running locally, migrations, environment variables, known local-dev quirks |

## Quick orientation

If you only read one other document, read **01-architecture.md** — it explains the pattern every module follows, which makes the rest of the codebase predictable regardless of which module you're looking at.

If you're trying to understand *why* something was built a certain way rather than *what* it does, the module documents (03–08) each include a short "design notes" section covering the non-obvious decisions — things like why the parent portal has its own ownership check separate from RBAC, or why counseling records are deliberately excluded from the general staff view-permission sweep.

## What this system does not yet include

Documented explicitly so it isn't mistaken for an oversight:
- No live NEMIS API integration (admissions/transfers capture NEMIS data as attested fields entered from physical documents, not a real-time government lookup)
- No real SMS/email provider wired up — `notifications` uses a console-logging stub provider (`src/modules/notifications/notifications.provider.ts`) ready to be swapped for Africa's Talking/SMTP
- No frontend — this is a backend/API only
- No live authentication middleware — the system was deliberately built with actor IDs (`createdBy`, `recordedBy`, etc.) passed explicitly in requests, as an integration point for the user's own auth system, which was intentionally left for the user to build separately
- Academic-module RBAC gaps exist in a few places noted in [09-rbac.md](09-rbac.md) — permissions were added incrementally as modules were built, and a couple of early modules (exams internals) don't yet have dedicated permission gates
