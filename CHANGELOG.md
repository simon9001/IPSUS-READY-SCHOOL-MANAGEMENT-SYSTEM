# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.0] - 2026-11-03

Behaviour changes to check against your frontend are marked **(changes behaviour)**.

### Security
- The acting user now comes from the session. Approver and creator ids in a request body are ignored, so nobody can act in someone else's name. **(changes behaviour)**
- Nobody can approve their own journal entry, budget or requisition. **(changes behaviour)**
- `POST /journal-entries/system` skipped approval with only the creator's permission. It now needs `ledger.journal.approve`. **(changes behaviour)**
- `approvedBy` is ignored when raising an LPO or supplier payment. **(changes behaviour)**
- Any logged-in user could read anyone's notifications. It's now your own inbox, or staff with `notifications.send`. **(changes behaviour)**
- Suspending an account now ends its sessions immediately.
- `/api/realtime/events` now needs a token, and a token in the query string only works there. **(changes behaviour)**
- `/metrics` needs `METRICS_TOKEN` in production and returns 404 without one. **(changes behaviour)**
- Login no longer reveals account status without the password. New passwords need at least 8 characters.
- Added security headers and a 10 MB request limit. `%` and `_` in search are now literal characters.

### Fixed
- A failed ledger posting left the invoice, receipt, payment, payslips or asset behind. Every posting is now one transaction.
- A fee receipt above the balance due was receipted in full while only part reached the ledger. It's now refused, as are supplier payments above what's owed. **(changes behaviour)**
- A receipt could be recorded against another student's invoice.
- The ledger accepted negative, all-zero and double-sided journal lines.
- Repeating a depreciation run charged every asset twice.
- Stock could go negative. Issuing more than is on hand is now refused. **(changes behaviour)**
- The same supplier invoice number could be entered twice.
- A decided disciplinary case could be reopened by a hearing or Board review.
- Marks above the maximum, or a paper out of zero, were accepted.
- Paying a library fine overwrote who received the book.
- The segregation-of-duties report ignored per-user permission overrides.
- Non-numeric amounts, invalid ids, duplicates and bad references returned 500. They now return 400 or 409.
- A lockout that had expired re-locked after one wrong password.

### Added
- End-to-end test suites on an in-process Postgres, a full school-year test, and a test that every API route refuses anonymous callers. Line coverage went from 8% to 90%.
- CI checks for schema changes without a migration, and tests are now type-checked.
- `SECURITY.md`.

### Changed
- The school seed and dashboard widgets are split into one file per domain. Seed output is unchanged.

## [0.1.0] - 2026-11-02

### Security
- Removed Cloudinary credentials that were hardcoded as fallbacks in `src/common/cloudinary.ts`. Avatar uploads now require `CLOUDINARY_*` env vars and return 503 without them. **The old key and secret are in git history and must be rotated.**
- Upgraded `hono` (4.13.3 → 4.13.14) and `zod` (4.4.3 → 4.6.7) past published advisories, including memory-exhaustion DoS in request-body parsing and validation.

### Fixed
- A supplier invoice paid in instalments is now marked `paid` once the payments add up to the invoice amount. Previously only a single full payment did that.
- A purchase order whose items arrive on several GRNs is now marked `received` once every item has arrived. Previously it stayed `partially_received`.
- `pnpm install --frozen-lockfile` and `pnpm test` now work on a fresh clone with no `.env`.

### Added
- `GET /health` readiness endpoint (database check, 503 on failure).
- Structured JSON logging with pino, including per-request `X-Request-Id`.
- CI: format check, lint, typecheck, tests with a coverage floor, build, dependency audit, Docker build, and a migrate + seed + boot smoke test against Postgres.
- ESLint, Prettier, Dependabot, a production Dockerfile, and `CONTRIBUTING.md`.
- Unit tests for the identity service (user/role and last-administrator guards), the procurement service, Cloudinary config, request logging and the health endpoint.

### Changed
- Node.js 22.12+ is now required, because the test runner (vitest 5) needs it.
