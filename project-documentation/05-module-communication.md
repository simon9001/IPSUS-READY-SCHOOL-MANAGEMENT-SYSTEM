# Communication Module

4 sub-modules: parent accounts, school notices, an SMS/email queue, and the parent-facing portal that ties the financial and academic modules together for guardians.

## `guardians`
`GET /api/guardians/users/:userId/students`, `GET /api/guardians/students/:studentId/guardians`, `POST /api/guardians`

Parent/guardian accounts are **not** a separate account type — they're ordinary rows in `users` with the `parent` RBAC role. `guardian_students` is a junction table linking a `userId` to one or more `studentId`s (a parent with children in different classes, or multiple guardians per student, both work).

Also home to `guardiansService.notifyGuardians(studentId, params)` — a fire-and-forget helper (errors are caught and logged, never thrown) that looks up every guardian of a student and sends each one a notification via the `notifications` module. This is what the discipline and disciplinary-case modules call to reach parents (see [08-module-student-conduct.md](08-module-student-conduct.md)).

And `guardiansService.assertGuardianOfStudent(userId, studentId)` — a **resource-ownership check**, deliberately distinct from RBAC. The `portal.access` permission only says a user is allowed to use the portal at all; this check is what stops guardian A from viewing guardian B's child. Verified in testing: a linked student's data returns normally, an unlinked student's data returns `403 Forbidden`.

## `notices`
`GET/POST /api/notices`, `GET /api/notices/:id`

School-wide announcements, targeted by `audience` (`all`/`parents`/`staff`/`class`, the last requiring a `classId`). Notices are draft until `publishNow: true` is passed (`publishedAt` set) or published later by another mechanism; an optional `expiresAt` stops them showing once past.

## `notifications`
`GET/POST /api/notifications/templates`, `GET /api/notifications/users/:userId`, `POST /api/notifications/send`

A queue/log, not a live send-only fire-and-forget call — every notification is persisted with a `status` (`pending`/`sent`/`failed`) regardless of outcome. Two ways to send:
- **With a template** (`templateCode` + `templateData`) — `{{placeholder}}` substitution against the template's `bodyTemplate`, verified working in testing
- **Freeform** (`body` directly) — used by `guardiansService.notifyGuardians` so callers don't need to pre-seed a template just to send a one-off message

**The actual dispatch is a stub.** `src/modules/notifications/notifications.provider.ts` defines a `NotificationProvider` interface and ships a `consoleNotificationProvider` that logs the message instead of calling a real SMS/email API — clearly commented as a local-dev placeholder. Swapping in a real provider (Africa's Talking for SMS is the common choice in Kenya, SMTP/SES for email) means implementing that interface and passing it into `createNotificationsService(provider)` instead of using the default export. Recipient contact info (phone/email) is resolved from the `users` table at send time if only a `recipientUserId` is given.

## `portal`
`GET /api/portal/:userId/children`, `GET /api/portal/:userId/students/:studentId/fee-statement`, `GET /api/portal/:userId/students/:studentId/exams/:examId/report-card`, `GET /api/portal/:userId/students/:studentId/attendance`, `GET /api/portal/:userId/notices`

**Has no repository or tables of its own** — it's a pure aggregation layer composing `guardiansService`, `feesService`, `examsService`, `attendanceService`, and `noticesService`, with every call scoped to the requesting guardian's own children via `assertGuardianOfStudent`. The fee statement sums a student's invoices and payments into a single `{ totalInvoiced, totalPaid, balance }` view; notices are deduplicated across the parent's children's classes plus general parent-audience notices.

The `:userId` in every route stands in for "the authenticated guardian" — same explicit-actor-ID convention used everywhere else in this API pending real auth middleware (see [01-architecture.md](01-architecture.md#no-authentication-middleware--deliberately)).

## Verified end-to-end

Linked a parent user to a student, confirmed the portal blocks a non-linked student (403), confirmed the fee statement correctly summed a real KES 12,000 invoice to a matching balance, sent a templated SMS fee reminder and confirmed both the rendered placeholders and the console-stub provider firing in the server log, and confirmed a published "parents" notice appeared through the portal.
