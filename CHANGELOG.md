# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
