# HR Module

5 sub-modules covering the staff lifecycle beyond payroll processing and beyond the lightweight academic teacher registry.

## `staff` — the canonical registry
`GET/POST /api/staff`, `GET/PATCH /api/staff/:id`

**Every** person working at the school — teaching and non-teaching, TSC and BOM — gets one `staff` row. `employeeId` and `teacherId` are optional links into the narrower `payroll.employees` (if BOM-paid) and `teachers` (if teaching) registries, the same optional-link pattern `teachers` already used for `employees`. This means a TSC-employed Deputy Principal (not on BOM payroll, not necessarily teaching) still gets a proper HR record even though neither of the other two tables would otherwise cover them.

## `leave`
`GET/POST /api/leave/types`, `GET /api/leave`, `GET /api/leave/staff/:staffId`, `GET /api/leave/staff/:staffId/balance`, `POST /api/leave`, `POST /api/leave/:id/approve|reject`

Leave balances are **computed, not stored**: `GET .../balance?leaveTypeId=&year=` sums approved requests' `daysRequested` for that staff/type/year and subtracts from the leave type's `defaultDaysPerYear`. Approval re-checks this balance and **rejects the approval** (not just the application) if it would push the staff member over their allocation for the year — verified in testing: a staff member with 21 annual-leave days applied for and was approved for 15, leaving 6; a second application for 10 more days was correctly blocked at the approval step with a clear "exceeds remaining balance" error, even though the *application* itself was allowed to be submitted (only approval enforces the cap).

## `contracts`
`GET /api/contracts/staff/:staffId`, `GET /api/contracts/:id`, `POST /api/contracts`, `PATCH /api/contracts/:id/status`

Permanent/fixed-term/probation contracts with a simple status lifecycle (active/expired/terminated).

## `appraisals`
`GET /api/appraisals/staff/:staffId`, `GET /api/appraisals/:id`, `POST /api/appraisals`, `PATCH /api/appraisals/:id`

Term-linked (via `periodId`) performance appraisals — rating, strengths, areas for improvement, goals. `draft`/`completed` status, editable while draft.

## `staffDiscipline`
`GET /api/staff-discipline/staff/:staffId`, `GET /api/staff-discipline/:id`, `POST /api/staff-discipline`

Staff conduct records — **distinct from `discipline_records`**, which is for students. Severity scale is staff-appropriate (`verbal_warning`/`written_warning`/`suspension`/`termination`), different from the student discipline module's `minor`/`moderate`/`major`.

## RBAC — added proactively this time

Unlike the academic module (see [04-module-academic.md](04-module-academic.md#known-gap-rbac)), HR's permissions were added *as the module was built*, not left as a gap: 11 permissions (`staff.manage`, `leave.approve`, `contracts.view`, etc.) and a new `hr_officer` role with manage+view across all five sub-domains. The Principal also picked up `leave.approve` plus view access across the module. See [09-rbac.md](09-rbac.md).
