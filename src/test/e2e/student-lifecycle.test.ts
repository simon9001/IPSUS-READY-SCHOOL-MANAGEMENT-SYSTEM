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
