import { beforeAll, describe, expect, it, vi } from 'vitest'
import { api, ledgerRefs, seedDatabase, superUser, userWithPermissions, userWithRole, type Actor } from '../harness.js'

vi.mock('../../db/client.js', () => import('../db.js'))

let staff: Actor
let refs: Awaited<ReturnType<typeof ledgerRefs>>
let classId: number
let nextNo = 1

beforeAll(async () => {
  await seedDatabase()
  refs = await ledgerRefs()
  staff = await superUser()
  const created = await api('POST', '/api/students/classes', { as: staff, body: { name: 'Form 3', level: 3 } })
  classId = created.body.data.id
})

async function newStudent(overrides = {}) {
  const res = await api('POST', '/api/students', {
    as: staff,
    body: { admissionNo: `L${nextNo++}`, firstName: 'Brian', lastName: 'Mutiso', classId, admissionDate: '2026-01-06', ...overrides },
  })
  expect(res.status).toBe(201)
  return res.body.data
}

describe('students', () => {
  it('reports a duplicate admission number as a conflict, not a server error', async () => {
    await newStudent({ admissionNo: 'DUP-1' })
    const res = await api('POST', '/api/students', {
      as: staff,
      body: { admissionNo: 'DUP-1', firstName: 'A', lastName: 'B', classId, admissionDate: '2026-01-06' },
    })
    expect(res.status).toBe(409)
  })

  it('reports a reference to a class that does not exist as a bad request', async () => {
    const res = await api('POST', '/api/students', {
      as: staff,
      body: { admissionNo: `L${nextNo++}`, firstName: 'A', lastName: 'B', classId: 999999, admissionDate: '2026-01-06' },
    })
    expect(res.status).toBe(400)
  })

  it('updates a student and lists them by class', async () => {
    const student = await newStudent()
    const updated = await api('PATCH', `/api/students/${student.id}`, { as: staff, body: { guardianPhone: '0712000000' } })
    const inClass = await api('GET', `/api/students/classes/${classId}/students`, { as: staff })

    expect(updated.body.data.guardianPhone).toBe('0712000000')
    expect(inClass.body.data.map((s: { id: number }) => s.id)).toContain(student.id)
  })
})

describe('admissions', () => {
  const bio = () => ({ firstName: 'Faith', lastName: 'Chebet', targetClassId: classId, recordedBy: staff.id })
  let nextUpi = 1
  const upi = () => `UPI${nextUpi++}`

  it('takes a government placement straight to admitted, then enrols it as a student', async () => {
    const placed = await api('POST', '/api/admissions/placements', {
      as: staff,
      body: { ...bio(), nemisUpi: upi(), placementLetterRef: 'PL-1' },
    })
    expect(placed.status).toBe(201)
    expect(placed.body.data.status).toBe('admitted')

    const enrolled = await api('POST', `/api/admissions/${placed.body.data.id}/enroll`, {
      as: staff,
      body: { admissionNo: `E${nextNo++}`, admissionDate: '2026-01-10' },
    })
    expect(enrolled.status).toBe(201)
    expect(enrolled.body.data.status).toBe('enrolled')
    expect((await api('GET', `/api/students/${enrolled.body.data.studentId}`, { as: staff })).body.data.firstName).toBe('Faith')
  })

  it('refuses a second admission for the same NEMIS UPI', async () => {
    const nemisUpi = upi()
    await api('POST', '/api/admissions/transfers', { as: staff, body: { ...bio(), nemisUpi, previousSchoolName: 'Alliance' } })
    const again = await api('POST', '/api/admissions/placements', { as: staff, body: { ...bio(), nemisUpi, placementLetterRef: 'PL-2' } })
    expect(again.status).toBe(409)
  })

  it('takes a direct application through interview to a decision', async () => {
    const applied = await api('POST', '/api/admissions/applications', { as: staff, body: bio() })
    const id = applied.body.data.id
    expect(applied.body.data.status).toBe('pending')

    const noInterviewYet = await api('POST', `/api/admissions/${id}/interview/result`, { as: staff, body: { interviewScore: 70 } })
    expect(noInterviewYet.status).toBe(409)

    await api('POST', `/api/admissions/${id}/interview/schedule`, {
      as: staff,
      body: { interviewDate: '2026-01-05', interviewerId: staff.id },
    })
    const result = await api('POST', `/api/admissions/${id}/interview/result`, {
      as: staff,
      body: { interviewScore: 70, interviewNotes: 'Good' },
    })
    expect(result.body.data.interviewScore).toBe('70.00')

    const decided = await api('POST', `/api/admissions/${id}/decide`, { as: staff, body: { decision: 'admitted', decidedBy: 1 } })
    expect(decided.body.data.status).toBe('admitted')
    expect(decided.body.data.decidedBy).toBe(staff.id)
  })

  it('only interviews direct applicants', async () => {
    const placed = await api('POST', '/api/admissions/placements', {
      as: staff,
      body: { ...bio(), nemisUpi: upi(), placementLetterRef: 'PL-3' },
    })
    const res = await api('POST', `/api/admissions/${placed.body.data.id}/interview/schedule`, {
      as: staff,
      body: { interviewDate: '2026-01-05', interviewerId: staff.id },
    })
    expect(res.status).toBe(400)
  })

  it('requires a reason to reject, and refuses to enrol anyone not admitted', async () => {
    const applied = await api('POST', '/api/admissions/applications', { as: staff, body: bio() })
    const id = applied.body.data.id

    expect((await api('POST', `/api/admissions/${id}/decide`, { as: staff, body: { decision: 'rejected', decidedBy: 1 } })).status).toBe(
      400,
    )
    expect(
      (await api('POST', `/api/admissions/${id}/enroll`, { as: staff, body: { admissionNo: `E${nextNo++}`, admissionDate: '2026-01-10' } }))
        .status,
    ).toBe(409)
  })

  it('leaves the applicant admitted when enrolment fails on a taken admission number', async () => {
    const placed = await api('POST', '/api/admissions/placements', {
      as: staff,
      body: { ...bio(), nemisUpi: upi(), placementLetterRef: 'PL-4' },
    })
    const taken = await newStudent()

    const res = await api('POST', `/api/admissions/${placed.body.data.id}/enroll`, {
      as: staff,
      body: { admissionNo: taken.admissionNo, admissionDate: '2026-01-10' },
    })

    expect(res.status).toBe(409)
    expect((await api('GET', `/api/admissions/${placed.body.data.id}`, { as: staff })).body.data.status).toBe('admitted')
  })
})

describe('disciplinary cases', () => {
  async function openCase(caseType: 'suspension' | 'expulsion', studentId?: number) {
    const student = studentId ?? (await newStudent()).id
    const res = await api('POST', '/api/disciplinary-cases', { as: staff, body: { studentId: student, caseType, openedBy: 1 } })
    expect(res.status).toBe(201)
    return { id: res.body.data.id as number, studentId: student }
  }

  const suspend = (id: number) =>
    api('POST', `/api/disciplinary-cases/${id}/decide`, {
      as: staff,
      body: { decision: 'suspended', decidedBy: 1, suspensionStartDate: '2026-02-01', suspensionEndDate: '2026-02-14' },
    })

  it('suspends a student on decision and reinstates them afterwards', async () => {
    const { id, studentId } = await openCase('suspension')
    await api('POST', `/api/disciplinary-cases/${id}/summon-parent`, { as: staff, body: { summonsDate: '2026-01-20' } })
    await api('POST', `/api/disciplinary-cases/${id}/parent-attendance`, { as: staff, body: { attended: true } })
    await api('POST', `/api/disciplinary-cases/${id}/hearing`, { as: staff, body: { hearingDate: '2026-01-25', hearingNotes: 'Heard' } })

    expect((await suspend(id)).status).toBe(200)
    expect((await api('GET', `/api/students/${studentId}`, { as: staff })).body.data.status).toBe('suspended')

    const reinstated = await api('POST', `/api/disciplinary-cases/${id}/reinstate`, { as: staff, body: { reinstatedBy: 1 } })
    expect(reinstated.body.data.status).toBe('closed')
    expect((await api('GET', `/api/students/${studentId}`, { as: staff })).body.data.status).toBe('active')
  })

  it('will not expel without Board of Management review', async () => {
    const { id, studentId } = await openCase('expulsion')

    const early = await api('POST', `/api/disciplinary-cases/${id}/decide`, { as: staff, body: { decision: 'expelled', decidedBy: 1 } })
    expect(early.status).toBe(400)

    await api('POST', `/api/disciplinary-cases/${id}/bom-review`, { as: staff, body: { bomReviewDate: '2026-02-01' } })
    const decided = await api('POST', `/api/disciplinary-cases/${id}/decide`, { as: staff, body: { decision: 'expelled', decidedBy: 1 } })

    expect(decided.status).toBe(200)
    expect((await api('GET', `/api/students/${studentId}`, { as: staff })).body.data.status).toBe('expelled')
  })

  it('only sends expulsion cases to the Board', async () => {
    const { id } = await openCase('suspension')
    expect(
      (await api('POST', `/api/disciplinary-cases/${id}/bom-review`, { as: staff, body: { bomReviewDate: '2026-02-01' } })).status,
    ).toBe(400)
  })

  it('cannot be reopened once decided, by a hearing or a Board review', async () => {
    const suspension = await openCase('suspension')
    await suspend(suspension.id)
    const hearing = await api('POST', `/api/disciplinary-cases/${suspension.id}/hearing`, {
      as: staff,
      body: { hearingDate: '2026-03-01' },
    })
    expect(hearing.status).toBe(409)
    expect((await api('GET', `/api/disciplinary-cases/${suspension.id}`, { as: staff })).body.data.status).toBe('decided')

    const expulsion = await openCase('expulsion')
    await api('POST', `/api/disciplinary-cases/${expulsion.id}/bom-review`, { as: staff, body: { bomReviewDate: '2026-02-01' } })
    await api('POST', `/api/disciplinary-cases/${expulsion.id}/decide`, { as: staff, body: { decision: 'dismissed', decidedBy: 1 } })
    const review = await api('POST', `/api/disciplinary-cases/${expulsion.id}/bom-review`, {
      as: staff,
      body: { bomReviewDate: '2026-03-01' },
    })
    expect(review.status).toBe(409)
  })

  it('refuses to decide twice, or to reinstate a case that was not a suspension', async () => {
    const { id } = await openCase('suspension')
    await api('POST', `/api/disciplinary-cases/${id}/decide`, { as: staff, body: { decision: 'dismissed', decidedBy: 1 } })

    expect((await suspend(id)).status).toBe(409)
    expect((await api('POST', `/api/disciplinary-cases/${id}/reinstate`, { as: staff, body: { reinstatedBy: 1 } })).status).toBe(409)
  })

  it('tells linked guardians about a summons, by SMS', async () => {
    const student = await newStudent()
    const parent = await userWithRole('parent')
    await api('POST', '/api/guardians', { as: staff, body: { userId: parent.id, studentId: student.id, relationship: 'mother' } })
    const { id } = await openCase('suspension', student.id)

    await api('POST', `/api/disciplinary-cases/${id}/summon-parent`, { as: staff, body: { summonsDate: '2026-01-20' } })

    const inbox = await api('GET', `/api/notifications/users/${parent.id}`, { as: parent })
    expect(inbox.body.data.some((n: { body: string }) => n.body.includes('summoned'))).toBe(true)
  })
})

describe('exams', () => {
  let examId: number
  let subjectId: number

  beforeAll(async () => {
    const scale = await api('POST', '/api/exams/grading-scales', {
      as: staff,
      body: {
        name: 'KCSE',
        bands: [
          { minMarks: 80, maxMarks: 100, grade: 'A', points: 12 },
          { minMarks: 50, maxMarks: 79.99, grade: 'C', points: 6 },
          { minMarks: 0, maxMarks: 49.99, grade: 'E', points: 1 },
        ],
      },
    })
    expect(scale.status).toBe(201)
    const exam = await api('POST', '/api/exams', {
      as: staff,
      body: { name: 'CAT 1', periodId: refs.period(1), classId, gradingScaleId: scale.body.data.id, examDate: '2026-02-20' },
    })
    expect(exam.status).toBe(201)
    examId = exam.body.data.id
    const subject = await api('POST', '/api/subjects', { as: staff, body: { name: 'Mathematics', code: 'MAT' } })
    expect(subject.status).toBe(201)
    subjectId = subject.body.data.id
  })

  const result = (studentId: number, marks: number, maxMarks: number = 100) => ({
    examId,
    studentId,
    subjectId,
    marks,
    maxMarks,
    enteredBy: 1,
  })

  it('grades a mark by percentage against the exam’s scale', async () => {
    const student = await newStudent()
    const res = await api('POST', '/api/exams/results', { as: staff, body: result(student.id, 40, 50) })

    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ grade: 'A', enteredBy: staff.id })
  })

  it('replaces a corrected mark rather than adding a second one', async () => {
    const student = await newStudent()
    await api('POST', '/api/exams/results', { as: staff, body: result(student.id, 30) })
    await api('POST', '/api/exams/results', { as: staff, body: result(student.id, 85) })

    const card = await api('GET', `/api/exams/${examId}/report-cards/${student.id}`, { as: staff })
    expect(card.status).toBe(200)
    expect(card.body.data.results ?? card.body.data.subjects).toHaveLength(1)
  })

  it.each([
    ['more marks than the paper has', 120, 100],
    ['a paper out of zero', 0, 0],
  ])('refuses %s', async (_label, marks, maxMarks) => {
    const student = await newStudent()
    expect((await api('POST', '/api/exams/results', { as: staff, body: result(student.id, marks, maxMarks) })).status).toBe(400)
  })

  it('records results in bulk, and reports a missing report card as 404', async () => {
    const [first, second] = [await newStudent(), await newStudent()]
    const bulk = await api('POST', '/api/exams/results/bulk', {
      as: staff,
      body: { results: [result(first.id, 55), result(second.id, 20)] },
    })
    expect(bulk.status).toBe(201)
    expect(bulk.body.data.map((r: { grade: string }) => r.grade)).toEqual(['C', 'E'])

    const nobody = await newStudent()
    expect((await api('GET', `/api/exams/${examId}/report-cards/${nobody.id}`, { as: staff })).status).toBe(404)
  })

  it('schedules one sitting per subject', async () => {
    const entry = { examId, subjectId, examDate: '2026-02-20', startTime: '08:00', endTime: '10:00' }
    expect((await api('POST', '/api/exams/timetable', { as: staff, body: entry })).status).toBe(201)
    expect((await api('POST', '/api/exams/timetable', { as: staff, body: entry })).status).toBe(409)
    expect((await api('GET', `/api/exams/${examId}/timetable`, { as: staff })).body.data).toHaveLength(1)
  })
})

describe('library', () => {
  async function book(totalCopies = 1) {
    const res = await api('POST', '/api/library/books', { as: staff, body: { title: 'River and the Source', totalCopies } })
    expect(res.status).toBe(201)
    return res.body.data
  }
  const borrow = (bookId: number, studentId: number) =>
    api('POST', '/api/library/borrowings', {
      as: staff,
      body: { bookId, studentId, borrowedDate: '2026-02-01', dueDate: '2026-02-08', issuedBy: 1 },
    })
  const giveBack = (id: number, returnedDate: string) =>
    api('POST', `/api/library/borrowings/${id}/return`, { as: staff, body: { returnedDate, returnedTo: staff.id } })

  it('tracks copies out, and refuses a loan when none are left', async () => {
    const title = await book(1)
    const [first, second] = [await newStudent(), await newStudent()]

    expect((await borrow(title.id, first.id)).status).toBe(201)
    expect((await api('GET', `/api/library/books/${title.id}`, { as: staff })).body.data.availableCopies).toBe(0)
    expect((await borrow(title.id, second.id)).status).toBe(409)
  })

  it('refuses a second copy of a book to the same student', async () => {
    const title = await book(5)
    const student = await newStudent()
    await borrow(title.id, student.id)
    expect((await borrow(title.id, student.id)).status).toBe(409)
  })

  it('charges no fine on time, and 5 a day when late', async () => {
    const student = await newStudent()
    const onTime = await borrow((await book()).id, student.id)
    const late = await borrow((await book()).id, student.id)

    expect((await giveBack(onTime.body.data.id, '2026-02-08')).body.data.fineAmount).toBe('0.00')
    expect((await giveBack(late.body.data.id, '2026-02-11')).body.data.fineAmount).toBe('15.00')
  })

  it('takes a fine once, keeping the record of who received the book', async () => {
    const librarian = await userWithPermissions('library.manage')
    const student = await newStudent()
    const late = await borrow((await book()).id, student.id)
    await giveBack(late.body.data.id, '2026-02-11')

    const paid = await api('POST', `/api/library/borrowings/${late.body.data.id}/pay-fine`, {
      as: librarian,
      body: { paidTo: librarian.id },
    })
    expect(paid.status).toBe(200)
    expect(paid.body.data).toMatchObject({ finePaid: true, returnedTo: staff.id })

    expect(
      (await api('POST', `/api/library/borrowings/${late.body.data.id}/pay-fine`, { as: librarian, body: { paidTo: librarian.id } }))
        .status,
    ).toBe(409)
  })

  it('refuses to take a fine that was never charged, or to return a book twice', async () => {
    const student = await newStudent()
    const loan = await borrow((await book()).id, student.id)
    await giveBack(loan.body.data.id, '2026-02-08')

    expect(
      (await api('POST', `/api/library/borrowings/${loan.body.data.id}/pay-fine`, { as: staff, body: { paidTo: staff.id } })).status,
    ).toBe(400)
    expect((await giveBack(loan.body.data.id, '2026-02-09')).status).toBe(409)
  })

  it('lists what is overdue on a given date', async () => {
    const student = await newStudent()
    const loan = await borrow((await book()).id, student.id)
    const overdue = await api('GET', '/api/library/overdue?asOfDate=2026-03-01', { as: staff })
    expect(overdue.body.data.map((b: { id?: number; borrowing?: { id: number } }) => b.borrowing?.id ?? b.id)).toContain(loan.body.data.id)
  })
})
