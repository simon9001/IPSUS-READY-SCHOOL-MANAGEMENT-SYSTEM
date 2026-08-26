# Cross-Cutting: Compliance, Documents, Dashboard

The last three modules built, all of them reading *across* other modules rather than owning a narrow slice of data themselves. `compliance` and `dashboard` both compose several other modules' services in a single call — `dashboard` has no tables of its own at all, the same pattern `portal` (Communication module) established first.

## `compliance`
`GET/POST /api/compliance`, `GET /api/compliance/:id`, `POST /api/compliance/:id/submit`

Compiles three Kenyan regulatory return types from live data:

| Report type | Compiled from | Key figures |
|---|---|---|
| `nemis_enrollment` | `students`, `classes`, `admissions`, `promotions` | Active enrollment by class/gender/boarding-status, new admissions in the period, exits (graduated/withdrawn/transferred) in the period |
| `tsc_staffing` | `teachers`, `students`, `subjects` (teacher assignments) | Total active teachers, TSC vs BOM-employed split, distinct subjects covered, student-teacher ratio |
| `moe_capitation` | `grants`, the ledger (`journalService.trialBalance`) | Capitation received in the period, and the Capitation fund's balance as of the period end date (cumulative to date, not an isolated in-period delta — noted in the service code as a simplification) |

All three were verified compiling correctly against real data in testing (e.g. the enrollment report correctly split 2 students into 1 male/1 female, 1 day/1 boarder).

**A generated report freezes a JSON snapshot** (`compliance_reports.reportData`) rather than being recomputed live on every read — see the design note in [02-database-schema.md](02-database-schema.md#cross-cutting-design-notes) for why. `POST /:id/submit` moves it from `draft` to `submitted`, recording the government's acknowledgment reference number; verified blocking a second submission attempt on an already-submitted report.

## `documents`
`GET/POST /api/documents/templates`, `GET /api/documents`, `GET /api/documents/students/:studentId`, `GET /api/documents/:id`, `POST /api/documents/:id/revoke`, `POST /api/documents/letters`, `POST /api/documents/transcripts`, `POST /api/documents/fee-clearance`

Two ways documents get generated:
- **Template-rendered letters** (admission letters, custom letters) — `{{placeholder}}` substitution shared with `notifications` via the extracted `src/common/template.ts` helper. Student-derived fields (`studentName`, `admissionNo`) are merged in automatically when a `studentId` is given, on top of whatever `templateData` the caller supplies. Verified rendering correctly with both sources combined.
- **Structured generators** that pull cross-module data directly, no template needed:
  - **Transcript** — every exam result a student has ever sat, compiled from `exams` via a new `examsService.getAllResultsForStudent()`, stored as JSON in `content`. Verified compiling a real result correctly.
  - **Fee clearance letter** — checks live balance via `feesService`, and the wording changes automatically between "NO outstanding balance" and "OUTSTANDING balance of KES X". Verified correctly identifying an outstanding KES 5,000 balance.

Every generated document gets a unique `referenceNumber` (format `DOC-<timestamp>`) for later verification, and can be `revoke`d without being deleted (an audit trail of what was issued, even if later invalidated).

## `dashboard`
`GET /api/dashboard/summary?asOfDate=`

No tables of its own — pure aggregation over `journalService` (Trial Balance), `feesService` (invoice totals/status), `studentsRepository` (active enrollment by class), and `examsService` (most recent exam's overall mean marks), returned as one combined JSON object. Verified in testing pulling real numbers from all three domains simultaneously in a single call: a balanced 5,000/5,000 trial balance, 2 active students in 1 class, and a mean of 70 correctly computed from two real exam scores (80 and 60).

## Design notes

- **Extracting `src/common/template.ts`**: `renderTemplate()` was originally written inline inside `notifications.service.ts`; when `documents` needed the identical `{{placeholder}}` logic, it was pulled out to `common/` rather than duplicated. This is the first shared *business* helper in `common/` (as opposed to `errors.ts`/`response.ts`/`validate.ts`, which are HTTP-layer plumbing) — a signal that if a third module needs the same kind of logic, it belongs in `common/`, not copy-pasted again.
- **`compliance` and `dashboard` both call other modules' *services*, never their repositories** — same convention as `portal`. This is what keeps a module's own business rules (e.g. a fee balance calculation) from being silently reimplemented (and potentially getting out of sync) in a second place.
