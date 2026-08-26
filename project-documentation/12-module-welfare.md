# Welfare & Facilities Module

3 sub-modules covering student welfare outside the classroom: boarding, health, and transport. Two of the three wire into the guardian-notification pipeline for genuinely urgent events, following the pattern established in [08-module-student-conduct.md](08-module-student-conduct.md).

## `boarding`
`GET/POST /api/boarding/dormitories`, `GET /api/boarding/dormitories/:dormitoryId/allocations`, `POST /api/boarding/allocations`, `POST /api/boarding/allocations/:id/vacate`, `GET /api/boarding/attendance/students/:studentId`, `POST /api/boarding/attendance`, `POST /api/boarding/attendance/bulk`

Bed allocation enforces two guards: a student can't hold two active allocations at once (must vacate first), and a dormitory can't be allocated past its `capacity` — both verified in testing with a capacity-1 dormitory.

**Boarding attendance is distinct from day/class attendance** (`attendance_records`, in the Academic module) — this tracks whether a boarder was actually in the dormitory at night, a welfare/safety concern, not academic presence. Marking a student `absent` (not `on_leave`) **automatically SMS's their guardian** — verified firing the exact expected message in testing. This is the module's one genuinely safety-critical feature: an unaccounted-for boarder is worth an immediate alert, unlike a routine class absence.

## `health`
`GET/POST /api/health/conditions/students/:studentId`, `GET/POST /api/health/visits/students/:studentId`, `GET /api/health/visits/:id`, `GET/POST /api/health/medications/students/:studentId`

Medical conditions, clinic visits, and medication administration — confidential, gated by `health.access` rather than `health.view` (same exception pattern as `counseling.access`, see [09-rbac.md](09-rbac.md)).

Recording a clinic visit with `referredToHospital: true` **automatically SMS's the guardian**; a routine visit without a referral stays silent. Verified in testing: two visits recorded back-to-back, only the referral one produced a notification.

## `transport`
`GET/POST /api/transport/routes`, `GET/POST /api/transport/routes/:routeId/stops`, `GET /api/transport/routes/:routeId/allocations`, `POST /api/transport/allocations`, `POST /api/transport/allocations/:id/end`

Bus routes with stops and student allocations. Same capacity-guard pattern as boarding — a route can't be over-allocated past its (optional) `capacity`, verified in testing. `feeAmount` on a route is informational only; actual transport fee billing runs through the `fees` module separately (no automatic invoice generation from a transport allocation — a deliberate scope limit, noted as an extension point in the schema comments).

## Design notes

- All three modules reuse the same capacity/duplicate-allocation guard shape first established by `boarding` (check for an existing active allocation, check capacity, then insert) — if extending any of them, keep new allocation-type actions consistent with that shape.
- `boarding.wardenStaffId` and `clubs.patronStaffId` (Academic Operations module) both link to the `staff` table, not `teachers` or `employees` directly — consistent with `staff` being the canonical registry for anyone who might supervise a non-teaching responsibility.
