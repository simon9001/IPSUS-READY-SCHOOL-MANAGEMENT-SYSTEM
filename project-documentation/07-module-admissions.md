# Admissions Module

One module, one table (`admissions`), three genuinely different pathways — because Kenyan school admission isn't a single uniform process. This was designed deliberately around a specific distinction: the difference between a school-run interview process and the government's centralized placement system.

## The three pathways

### 1. Government placement — `POST /api/admissions/placements`
For JSS/Senior School students placed by the Ministry's centralized system (NEMIS/KPSEA). **No interview** — the placement decision has already been made by the government; the school's job is only to capture it. Goes straight to `status: 'admitted'`.

Fields captured: the student's **NEMIS UPI** (Unique Personal Identifier — follows the learner for their entire schooling life, not just this school), the placement letter reference, KPSEA index number, and the sending primary school's NEMIS institution code.

### 2. Inter-school transfer — `POST /api/admissions/transfers`
Also **no interview** — also goes straight to `admitted`. The key field is the same *continuing* NEMIS UPI (proving this is the same learner moving schools, not a new admission), plus the previous school's name/code, transfer reason, and a transfer certificate reference.

> Neither pathway does a live NEMIS API lookup — there's no government API access configured. Both capture NEMIS data as **attested fields** the registrar enters from the physical placement letter or transfer certificate.

### 3. Direct/local admission — `POST /api/admissions/applications`
The only pathway with an interview. Full flow: `pending` → `POST /:id/interview/schedule` → `POST /:id/interview/result` → `POST /:id/decide` (`admitted`/`waitlisted`/`rejected`, with `rejectionReason` required — enforced by a Zod `.refine()` — when rejecting).

## Convergence: enrollment

All three pathways converge on `POST /api/admissions/:id/enroll`, which is only allowed once `status = 'admitted'` (verified: attempting to enroll a still-`pending` direct application returns a clear "must be admitted before enrolling" error). Enrollment creates the actual `students` row from the admission record's captured bio data, and **carries the NEMIS UPI forward** onto the new student record — verified end-to-end: a placement's UPI survived intact from capture → enrollment → the resulting student record.

A duplicate UPI is rejected at capture time (`ConflictError`), so the same learner can't accidentally be admitted twice under two different admission records.

## RBAC

`admissions.manage`/`admissions.view`, and a new `registrar` role. Principal also has both permissions, since admission decisions (especially direct/interview-based ones) often need Principal sign-off in practice.

## Why one table instead of three

Placement, transfer, and direct admissions all end up needing the same things — applicant bio, target class, a decision, and an enrollment link — with only a handful of type-specific fields differing. One table with an `admissionType` discriminator and nullable type-specific columns avoided three near-duplicate tables while still keeping each pathway's distinct fields clearly separated in the schema (grouped and commented by pathway in `src/db/schema/admissions.ts`).
