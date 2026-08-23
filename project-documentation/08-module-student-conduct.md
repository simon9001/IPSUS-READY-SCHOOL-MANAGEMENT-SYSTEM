# Student Conduct

Built in two passes: the base incident log (`discipline`, part of the Academic module — see [04-module-academic.md](04-module-academic.md#discipline-punitive-incident-log)) and then four extensions added afterward: parent notification, merit/demerit points, a formal suspension/expulsion process, and confidential counseling.

## Parent notification (extension to `discipline`)

`discipline.service.ts`'s `create` now looks up the student, then calls `guardiansService.notifyGuardians(...)` after saving the incident — every logged incident auto-SMS's the linked guardian(s) with the severity, date, and description. Verified in testing: logging a "major" incident produced exactly the expected SMS body in the notification log. If a student has no guardian linked yet, the notification call resolves to nothing (no error) — logging the incident is never blocked by a missing guardian link.

## `conductPoints` — merit/demerit ledger

`GET/POST /api/conduct-points/rules`, `GET /api/conduct-points/students/:studentId`, `GET /api/conduct-points/students/:studentId/score`, `POST /api/conduct-points`

A running conduct score per student per term, computed by summing a ledger — same pattern as leave balances and the trial balance, not a stored/mutated counter. Points can come from a reusable rule (`ruleId`, e.g. "Fighting: -10") or be awarded freeform (`points` + `reason` directly, e.g. "+5 for organizing sports day"). An award can optionally reference the `disciplineRecordId` it stemmed from, linking the punitive log to the point deduction that resulted from it. Verified: -10 (rule-based) + 5 (freeform) summed to a correct running score of -5.

## `disciplinaryCases` — the formal process

`GET/POST /api/disciplinary-cases`, `GET /api/disciplinary-cases/students/:studentId`, plus action endpoints: `/summon-parent`, `/parent-attendance`, `/hearing`, `/bom-review`, `/decide`, `/reinstate`, `/close`

This is the actual state-machine workflow the incident log doesn't provide on its own — modeled the same way `admissions` models its own multi-step process:

```
opened → parent_summoned → hearing_held → bom_reviewed → decided → closed
```

**Expulsion is hard-gated behind BOM review.** The Basic Education Act requires Board of Management sign-off before a student can be expelled, so `decide()` throws a `ValidationError` if `decision: 'expelled'` is attempted while the case status isn't yet `bom_reviewed` — verified in testing: attempting to decide "expelled" immediately after opening the case was correctly blocked, and only succeeded after walking through summon-parent → hearing → BOM review in order. `bomReview()` itself refuses to run on a `suspension`-type case at all (`ValidationError`, "BOM review only applies to expulsion cases") — suspension doesn't carry that legal requirement.

A decision of `suspended` or `expelled` updates the student's own `status` field directly (new enum values, see [02-database-schema.md](02-database-schema.md)) — verified: deciding "expelled" correctly flipped the student record's `status` to `'expelled'`. `suspended` requires `suspensionStartDate`/`suspensionEndDate` (enforced by a Zod refine); `reAdmissionDate` is set from the suspension end date. A separate `reinstate()` action (only valid on a decided suspension) sets the student back to `active` and closes the case.

Guardian notifications fire at four points automatically: case opened, parent summoned (with the summons date), and decision — all verified firing correctly with the right recipient and message in testing.

## `counseling` — deliberately separate and confidential

`GET /api/counseling/students/:studentId`, `GET /api/counseling/:id`, `POST /api/counseling`

Supportive, not punitive — session date, category (academic/behavioral/family/emotional/career/other), confidential notes, optional follow-up. **No automatic notification fires** on creation, unlike `discipline` and `disciplinaryCases` — counseling is meant to be between the counselor, the student, and only sometimes the parent, not something that should be exposed by default.

Its view permission is deliberately named `counseling.access`, **not** `counseling.view` — every other `*.view`-suffixed permission in the system is automatically swept into the `VIEW_ONLY` set granted to BOM members, internal auditors, and external auditors (see [09-rbac.md](09-rbac.md)). Naming this one differently keeps confidential counseling notes out of that automatic grant; only the `counselor` role and the Principal have `counseling.access` explicitly.

## RBAC summary

8 new permissions across `discipline.*`, `conduct_points.*`, `disciplinary_cases.*`, `counseling.*`; two new roles — `teacher` (day-to-day conduct logging: `discipline.manage`, `conduct_points.manage`, but **not** `disciplinary_cases.manage` — a teacher can't open a formal case) and `counselor` (`counseling.manage`, `counseling.access`, plus `discipline.view` for context). Principal gained `disciplinary_cases.manage` (formal case oversight) and `counseling.access` (escalation visibility), consistent with how these decisions work in practice.
