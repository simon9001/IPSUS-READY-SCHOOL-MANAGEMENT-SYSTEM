# Academic / Student Records Module

6 sub-modules covering the non-financial side of running a school: who teaches what, exams and grading, attendance, punitive discipline logging, and class promotion. Reuses `students`/`classes`/`streams` (originally added for fees) and `fiscalPeriods` (school terms double as exam periods).

## `teachers`
`GET/POST /api/teachers`, `GET/PATCH /api/teachers/:id`

Covers **both** TSC-employed teachers (tracked via `tscNumber`, not paid through this system) and BOM-paid teaching staff (optionally linked to `payroll.employees` via `employeeId`). This is a lightweight registry for academic assignment purposes — the fuller HR lifecycle (leave, contracts, appraisals) lives in the separate `staff` module (see [06-module-hr.md](06-module-hr.md)), which links back to `teachers` the same optional way.

## `subjects`
`GET/POST /api/subjects`, `GET /api/subjects/classes/:classId/offerings`, `POST /api/subjects/offerings`, `GET /api/subjects/classes/:classId/assignments`, `POST /api/subjects/assignments`

Subject catalog, which subjects a class offers (`class_subjects`), and which teacher teaches which subject to which class/stream in a given term (`teacher_assignments`, term-scoped via `periodId`).

## `exams` — the largest piece of this module
`GET/POST /api/exams/grading-scales`, `GET/POST /api/exams`, `POST /api/exams/results`, `POST /api/exams/results/bulk`, `GET /api/exams/:examId/report-cards/:studentId`

**Grading scales are data, not hardcoded logic** — a scale is a named set of `min/max marks → grade → points` bands, so the same mechanism works for 8-4-4/KCSE letter grades (A/B+/B/...) or a CBC rubric (Exceeding/Meeting/Approaching/Below Expectation). Recording a result computes the percentage (`marks / maxMarks * 100`) and looks up the matching band automatically.

Report cards are computed on read, not stored: `GET /:examId/report-cards/:studentId` returns each subject's marks/grade/points, the student's total and mean marks, the mean grade (looked up against the same bands), and **class position** — computed by ranking every student who has any result recorded for that exam by total marks. Verified in testing with a two-student exam: mean marks and mean grade were both correct, and rank/class-size matched expectations.

## `attendance`
`GET /api/attendance/students/:studentId`, `GET /api/attendance/classes/:classId?date=...`, `POST /api/attendance`, `POST /api/attendance/bulk`

One row per student per day (`unique(studentId, attendanceDate)`), so re-marking the same day upserts rather than duplicating.

## `discipline` (punitive incident log)
`GET /api/discipline/students/:studentId`, `GET /api/discipline/:id`, `POST /api/discipline`

The base incident log — `severity` (minor/moderate/major), free-text description and action taken. **Extended later** (see [08-module-student-conduct.md](08-module-student-conduct.md)) to auto-notify the student's guardian(s) on every incident, and to feed into the merit/demerit points ledger and the formal disciplinary-case workflow. Those three additions live in their own modules (`conductPoints`, `disciplinaryCases`, `counseling`) rather than being bolted onto this one, since they're distinct concerns with their own state machines.

## `promotions`
`GET /api/promotions/students/:studentId`, `POST /api/promotions`

Records a promotion/repeat/transfer/graduate/withdraw decision **and applies its side effect automatically**: `outcome: 'promoted'` updates the student's `classId` (and clears `streamId`, since streams are class-specific); `transferred`/`graduated`/`withdrawn` update the student's `status`. Verified in testing: promoting a student to Form 2 correctly changed their `classId` from the Form 1 class to the Form 2 class in the same request.

## Known gap: RBAC

Unlike every module built after it, the academic module's endpoints were **not** given dedicated RBAC permissions when it was built — this was flagged by the user afterward and is tracked as a known gap in [09-rbac.md](09-rbac.md#known-gaps). It doesn't block anything functionally (no auth middleware is wired up yet regardless — see [01-architecture.md](01-architecture.md#no-authentication-middleware--deliberately)), but if/when auth is wired up, academic endpoints will need permission codes added (e.g. `exams.manage`, `attendance.manage`, `academic_records.view`) before they can be gated like every other module.
