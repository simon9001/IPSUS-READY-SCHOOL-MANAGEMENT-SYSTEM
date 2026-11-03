# Security

## Reporting a vulnerability

Please don't open a public issue. Use [GitHub's private vulnerability reporting](https://github.com/simon9001/IPSUS-READY-SCHOOL-MANAGEMENT-SYSTEM/security/advisories/new) for this repository, with steps to reproduce.

## What this system protects

Student records (including minors' health, counselling and disciplinary records), staff and payroll data, and a school's financial ledger. The threats that matter most are one user reading another's records, someone moving money without a second person's approval, and the audit trail being forged.

## Authentication

- `POST /api/auth/login` checks a bcrypt hash (cost 12) and returns a JWT signed with `JWT_SECRET`, valid for 8 hours. The app won't start without that secret.
- Five wrong passwords lock an account for 15 minutes. Account status is only revealed after the correct password.
- The account's status is checked on every request, so suspending someone takes effect immediately.
- The token goes in the `Authorization: Bearer` header. Only `/api/realtime/events` also accepts it in the query string, because `EventSource` can't set headers.

## Authorization

- Every route declares what it needs, using `requirePermission`, `requireAuth`, `requireSelf` or `requireSelfOrPermission` from [src/common/auth.ts](src/common/auth.ts). Roles are defined in [src/modules/identity/rbac.ts](src/modules/identity/rbac.ts).
- A user's effective permissions are their roles' permissions, plus per-user grants, minus per-user revokes. A revoke beats a role.
- [src/test/e2e/access-control.test.ts](src/test/e2e/access-control.test.ts) requests every registered `/api` route with no session and requires a 401, so a new route without auth fails CI. Only login and search are exempt. Search returns nothing without a session.
- The last active holder of `users.manage` can't be removed, suspended or revoked.

## Who did what

The acting user always comes from the session. `getValidated()` in [src/common/validate.ts](src/common/validate.ts) overwrites fields such as `createdBy` and `approverId` whatever the request body says.

Maker-checker rules are enforced in the services: nobody can approve their own journal entry, budget or requisition. Manual journal entries stay out of the ledger until approved. `GET /api/system/rbac` reports any user who holds both sides of a segregated pair, whether through roles or per-user grants.

## Integrity of the books

A document and its journal entry are written in one transaction, so a refused posting leaves nothing behind. Entries must balance and can't contain negative amounts, closed periods accept no postings, and receipts or payments above the amount owed are refused.

## Endpoints without a session

| Endpoint | Exposes | Protection |
|---|---|---|
| `GET /health` | Up or down, uptime, database latency | None needed. Database errors are logged, never returned. |
| `GET /metrics` | Route names, traffic, error rates | Needs `METRICS_TOKEN` as a bearer token. Returns 404 in production without one. |
| `GET /` | A fixed banner | None needed |
| `POST /api/auth/login` | Nothing without valid credentials | Account lockout |

## Secrets

All secrets come from environment variables, listed in [.env.example](.env.example). `.env` is git-ignored. CI uses throwaway values.

Cloudinary credentials were committed in early history and removed in `4467f60`. Removing them from the code doesn't remove them from git history, so they must be treated as compromised and rotated.

The database connection requires TLS for anything other than localhost ([src/db/client.ts](src/db/client.ts)). With Supabase's transaction pooler, prepared statements are turned off.

## Other protections

Security headers on every response, a 10 MB request limit, Zod validation at every write endpoint, parameterised SQL through Drizzle, CORS limited to `CORS_ORIGIN`, and passwords and tokens redacted from logs. `pnpm audit` runs in CI and fails on high or critical advisories.

## Known gaps

- **A password change doesn't end other sessions.** Suspending an account takes effect on the next request, but after a password change an existing token keeps working until it expires, up to 8 hours later.
- **No per-IP rate limit.** Lockout is per account, so one address can still try many accounts. Add limiting at the reverse proxy.
- **Clinician fields are client-supplied.** `attendedBy` and `administeredBy` on clinic records, and `requestedBy` on imprests, name a person other than the typist, so they aren't overwritten.
- **`approvedBy` on LPOs and supplier payments is always empty for now.** Raising one no longer approves it, and there's no separate approval step yet.
- **Journal numbers can collide under concurrent posting.** Numbers come from a count, so two simultaneous postings can conflict. The unique constraint makes one fail with a 409 rather than corrupting anything.
