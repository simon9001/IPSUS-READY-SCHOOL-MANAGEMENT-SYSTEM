# Academic Operations & Student Life

4 pieces: a new `timetable` module, an extension to the existing `exams` module, and two new modules (`library`, `clubs`) for student life outside academics.

## `timetable`
`GET/POST /api/timetable/lesson-periods`, `GET /api/timetable/classes/:classId`, `GET /api/timetable/teachers/:teacherId`, `GET /api/timetable/teachers/:teacherId/workload`, `POST /api/timetable/entries`, `DELETE /api/timetable/entries/:id`

Builds on the `teacher_assignments` table (from `subjects`, in the Academic module) which only records *which* teacher covers *which* subject for a class each term — `timetable` adds the actual day/period grid on top. `lesson_periods` defines fixed daily period times (e.g. "Period 1" = 08:00–08:40, the same every day); `timetable_entries` pins a class+subject+teacher to a specific day+period+term.

**Two hard guards, both checked before insert**: a class/stream can't have two lessons in the same day+period slot, and a teacher can't be scheduled in two places at once in the same slot. Both verified in testing — scheduling English for Form 4 in an already-Math-occupied slot was blocked (class conflict), and scheduling the same teacher for a different class in the same slot was separately blocked (teacher conflict), while a genuinely non-conflicting entry (same teacher, different period) succeeded.

`GET .../teachers/:teacherId/workload?periodId=` is computed live from `timetable_entries` — total periods/week and a breakdown by subject. Verified correctly summing 2 periods across 2 subjects in testing.

## `exams` — extended with a timetable

New endpoints added to the existing exams module (see [04-module-academic.md](04-module-academic.md)): `GET /api/exams/:examId/timetable`, `POST /api/exams/timetable`

A single `exams` row (e.g. "Term 1 Mid-Term") can now span several days, one subject examined per sitting (`exam_timetable_entries`: subject, date, start/end time, venue). A unique constraint (one sitting per subject per exam) is enforced with a friendly pre-check — verified blocking a duplicate Mathematics sitting on a second attempt.

## `library`
`GET/POST /api/library/books`, `GET /api/library/books/:id`, `GET /api/library/students/:studentId/borrowings`, `GET /api/library/overdue`, `POST /api/library/borrowings`, `POST /api/library/borrowings/:id/return`, `POST /api/library/borrowings/:id/pay-fine`

**Availability is computed, not stored**: `GET /books/:id` returns `availableCopies` as `totalCopies` minus a live count of active (`status: 'borrowed'`) borrowings — same "computed live" convention used for leave balances and conduct scores. Borrowing is blocked if the book has no available copies, or if the same student already has that exact book out. Returning a book **automatically calculates a late fine** (`daysLate × a placeholder flat rate`, clearly commented in `library.service.ts` — adjust to the school's real policy) — verified in testing: a book returned 5 days late correctly computed a KES 25 fine (5 × KES 5/day).

## `clubs`
`GET/POST /api/clubs`, `GET /api/clubs/:clubId/members`, `GET /api/clubs/students/:studentId/memberships`, `POST /api/clubs/memberships`, `GET/POST /api/clubs/competitions`, `GET/POST /api/clubs/competitions/participants`

Clubs, sports, and societies with a `staff` patron link (see [12-module-welfare.md](12-module-welfare.md) design notes on why `staff`, not `teachers`). Competition levels follow Kenya's real tier structure — `school → zonal → county → regional → national` — matching how KSSSA sports and drama/music festivals are actually structured, so a "Qualified for Regionals" result is a meaningful, structured value rather than free text.

## Design notes

- `timetable` and the exam-timetable extension are two *separate* concepts that are easy to conflate: the class timetable says when a subject is taught; the exam timetable says when a subject is examined. They don't share a table, though both use the same `lesson_periods`-style day/time fields independently.
- This is also where the RBAC gap noted in [09-rbac.md](09-rbac.md#known-gaps) got more visible: `timetable`, `library`, and `clubs` all got permission codes when built (the habit was established by then), while the original `exams`/`attendance`/`promotions` actions they sit next to still don't.
