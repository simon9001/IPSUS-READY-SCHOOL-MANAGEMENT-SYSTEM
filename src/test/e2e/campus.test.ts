import { beforeAll, describe, expect, it, vi } from 'vitest'
import { api, ledgerRefs, seedDatabase, superUser, type Actor } from '../harness.js'

vi.mock('../../db/client.js', () => import('../db.js'))

let staff: Actor
let refs: Awaited<ReturnType<typeof ledgerRefs>>
let classId: number
let nextNo = 1

beforeAll(async () => {
  await seedDatabase()
  refs = await ledgerRefs()
  staff = await superUser()
  classId = (await api('POST', '/api/students/classes', { as: staff, body: { name: 'Form 4', level: 4 } })).body.data.id
})

async function newStudent(boardingStatus: 'day' | 'boarder' = 'boarder') {
  const res = await api('POST', '/api/students', {
    as: staff,
    body: { admissionNo: `C${nextNo++}`, firstName: 'Kevin', lastName: 'Barasa', classId, boardingStatus, admissionDate: '2026-01-06' },
  })
  expect(res.status).toBe(201)
  return res.body.data
}

describe('boarding', () => {
  const dormitory = async (capacity = 2) =>
    (await api('POST', '/api/boarding/dormitories', { as: staff, body: { name: `Dorm ${nextNo++}`, gender: 'boys', capacity } })).body.data
  const allocate = (studentId: number, dormitoryId: number, bedNumber: string) =>
    api('POST', '/api/boarding/allocations', {
      as: staff,
      body: { studentId, dormitoryId, bedNumber, periodId: refs.period(1), allocatedDate: '2026-01-07' },
    })

  it('allocates a bed to a boarder, and refuses a day scholar', async () => {
    const dorm = await dormitory()
    expect((await allocate((await newStudent()).id, dorm.id, 'A1')).status).toBe(201)
    expect((await allocate((await newStudent('day')).id, dorm.id, 'A2')).status).toBe(400)
  })

  it('refuses a taken bed, a second bed for one student, and a full dormitory', async () => {
    const dorm = await dormitory(2)
    const first = await newStudent()
    await allocate(first.id, dorm.id, 'B1')

    expect((await allocate((await newStudent()).id, dorm.id, 'B1')).status).toBe(409)
    expect((await allocate(first.id, dorm.id, 'B2')).status).toBe(409)

    await allocate((await newStudent()).id, dorm.id, 'B2')
    const full = await allocate((await newStudent()).id, dorm.id, 'B3')
    expect(full.status).toBe(409)
    expect(full.body.error).toMatch(/full capacity/)
  })

  it('frees the bed when vacated, once', async () => {
    const dorm = await dormitory(1)
    const allocation = await allocate((await newStudent()).id, dorm.id, 'C1')
    const vacate = () =>
      api('POST', `/api/boarding/allocations/${allocation.body.data.id}/vacate`, { as: staff, body: { vacatedDate: '2026-02-01' } })

    expect((await vacate()).body.data.status).toBe('vacated')
    expect((await vacate()).status).toBe(409)
    expect((await allocate((await newStudent()).id, dorm.id, 'C1')).status).toBe(201)
    expect((await api('GET', `/api/boarding/dormitories/${dorm.id}/allocations`, { as: staff })).status).toBe(200)
  })

  it('takes the nightly roll, attributed to the signed-in user', async () => {
    const student = await newStudent()
    const record = { studentId: student.id, attendanceDate: '2026-02-01', status: 'present', recordedBy: 1 }
    const bulk = await api('POST', '/api/boarding/attendance/bulk', { as: staff, body: { records: [record] } })

    expect(bulk.status).toBe(201)
    const roll = await api('GET', `/api/boarding/attendance/students/${student.id}`, { as: staff })
    expect(roll.body.data[0].recordedBy).toBe(staff.id)
  })

  it('returns 404 for an unknown dormitory, student or allocation', async () => {
    expect((await api('GET', '/api/boarding/dormitories/999999', { as: staff })).status).toBe(404)
    expect((await allocate(999999, (await dormitory()).id, 'Z1')).status).toBe(404)
    expect((await api('POST', '/api/boarding/allocations/999999/vacate', { as: staff, body: { vacatedDate: '2026-02-01' } })).status).toBe(
      404,
    )
  })
})

describe('transport', () => {
  const route = async (capacity = 1) =>
    (await api('POST', '/api/transport/routes', { as: staff, body: { routeName: `Route ${nextNo++}`, capacity, feeAmount: 5000 } })).body
      .data
  const allocate = (studentId: number, routeId: number) =>
    api('POST', '/api/transport/allocations', {
      as: staff,
      body: { studentId, routeId, periodId: refs.period(1), startDate: '2026-01-07' },
    })

  it('adds stops and fills a route up to capacity', async () => {
    const bus = await route(1)
    const stop = await api('POST', '/api/transport/stops', { as: staff, body: { routeId: bus.id, stopName: 'Westlands', stopOrder: 1 } })
    expect(stop.status).toBe(201)
    expect((await api('GET', `/api/transport/routes/${bus.id}/stops`, { as: staff })).body.data).toHaveLength(1)

    expect((await allocate((await newStudent('day')).id, bus.id)).status).toBe(201)
    expect((await allocate((await newStudent('day')).id, bus.id)).status).toBe(409)
  })

  it('allows one active route per student, until it is ended, once', async () => {
    const student = await newStudent('day')
    const allocation = await allocate(student.id, (await route(5)).id)
    expect((await allocate(student.id, (await route(5)).id)).status).toBe(409)

    const end = () =>
      api('POST', `/api/transport/allocations/${allocation.body.data.id}/end`, { as: staff, body: { endDate: '2026-03-01' } })
    expect((await end()).body.data.status).toBe('inactive')
    expect((await end()).status).toBe(409)
    expect((await allocate(student.id, (await route(5)).id)).status).toBe(201)
  })

  it('returns 404 for an unknown route or allocation', async () => {
    expect((await api('GET', '/api/transport/routes/999999', { as: staff })).status).toBe(404)
    expect((await api('POST', '/api/transport/allocations/999999/end', { as: staff, body: { endDate: '2026-03-01' } })).status).toBe(404)
  })
})

describe('health records', () => {
  it('keeps conditions, clinic visits and medication against a student', async () => {
    const student = await newStudent()
    const condition = await api('POST', '/api/health/conditions', {
      as: staff,
      body: { studentId: student.id, condition: 'Asthma', severity: 'moderate', recordedBy: 1 },
    })
    expect(condition.body.data.recordedBy).toBe(staff.id)

    const visit = await api('POST', '/api/health/visits', {
      as: staff,
      body: {
        studentId: student.id,
        visitDate: '2026-02-03',
        presentingComplaint: 'Wheezing',
        referredToHospital: true,
        attendedBy: staff.id,
      },
    })
    expect(visit.status).toBe(201)

    const dose = await api('POST', '/api/health/medications', {
      as: staff,
      body: { studentId: student.id, clinicVisitId: visit.body.data.id, medicationName: 'Salbutamol', administeredBy: staff.id },
    })
    expect(dose.status).toBe(201)

    for (const part of ['conditions', 'visits', 'medications']) {
      expect((await api('GET', `/api/health/${part}/students/${student.id}`, { as: staff })).body.data, part).toHaveLength(1)
    }
    expect((await api('GET', `/api/health/visits/${visit.body.data.id}`, { as: staff })).status).toBe(200)
    expect((await api('GET', '/api/health/visits/999999', { as: staff })).status).toBe(404)
  })
})

describe('clubs and competitions', () => {
  it('runs a club, its members and a competition', async () => {
    const student = await newStudent()
    const club = await api('POST', '/api/clubs', { as: staff, body: { name: 'Drama', category: 'society' } })
    expect(club.status).toBe(201)

    const join = () =>
      api('POST', '/api/clubs/memberships', {
        as: staff,
        body: { clubId: club.body.data.id, studentId: student.id, joinedDate: '2026-01-20' },
      })
    expect((await join()).status).toBe(201)
    expect((await join()).status).toBe(409)
    expect((await api('GET', `/api/clubs/${club.body.data.id}/members`, { as: staff })).body.data).toHaveLength(1)
    expect((await api('GET', `/api/clubs/students/${student.id}/memberships`, { as: staff })).body.data).toHaveLength(1)

    const competition = await api('POST', '/api/clubs/competitions', {
      as: staff,
      body: { name: 'Festival', clubId: club.body.data.id, level: 'county', competitionDate: '2026-03-10' },
    })
    expect(competition.status).toBe(201)
    const entered = await api('POST', '/api/clubs/competitions/participants', {
      as: staff,
      body: { competitionId: competition.body.data.id, studentId: student.id, result: 'First' },
    })
    expect(entered.status).toBe(201)
    expect((await api('GET', `/api/clubs/competitions/${competition.body.data.id}/participants`, { as: staff })).body.data).toHaveLength(1)
  })

  it('returns 404 for an unknown club or competition', async () => {
    expect((await api('GET', '/api/clubs/999999', { as: staff })).status).toBe(404)
    expect((await api('GET', '/api/clubs/competitions/999999', { as: staff })).status).toBe(404)
  })
})

describe('subjects, teachers and the timetable', () => {
  let subjectId: number
  let teacherId: number
  let lessonPeriodId: number

  beforeAll(async () => {
    subjectId = (await api('POST', '/api/subjects', { as: staff, body: { code: 'ENG', name: 'English' } })).body.data.id
    teacherId = (await api('POST', '/api/teachers', { as: staff, body: { staffNo: 'T-1', fullName: 'Agnes Moraa', tscNumber: '12345' } }))
      .body.data.id
    lessonPeriodId = (
      await api('POST', '/api/timetable/lesson-periods', {
        as: staff,
        body: { name: 'P1', startTime: '08:00', endTime: '08:40', sortOrder: 1 },
      })
    ).body.data.id
  })

  it('refuses a duplicate subject code, strand or class offering', async () => {
    expect((await api('POST', '/api/subjects', { as: staff, body: { code: 'ENG', name: 'Again' } })).status).toBe(409)

    const strand = { subjectId, name: 'Reading' }
    expect((await api('POST', '/api/subjects/strands', { as: staff, body: strand })).status).toBe(201)
    expect((await api('POST', '/api/subjects/strands', { as: staff, body: strand })).status).toBe(409)
    expect((await api('GET', `/api/subjects/${subjectId}/strands`, { as: staff })).body.data).toHaveLength(1)

    const offering = { classId, subjectId }
    expect((await api('POST', '/api/subjects/offerings', { as: staff, body: offering })).status).toBe(201)
    expect((await api('POST', '/api/subjects/offerings', { as: staff, body: offering })).status).toBe(409)
    expect((await api('GET', `/api/subjects/classes/${classId}/offerings`, { as: staff })).body.data).toHaveLength(1)
  })

  it('assigns a teacher to a class', async () => {
    const res = await api('POST', '/api/subjects/assignments', {
      as: staff,
      body: { teacherId, subjectId, classId, periodId: refs.period(1) },
    })
    expect(res.status).toBe(201)
    expect(
      (await api('GET', `/api/subjects/classes/${classId}/assignments?periodId=${refs.period(1)}`, { as: staff })).body.data,
    ).toHaveLength(1)
    expect((await api('GET', `/api/subjects/classes/${classId}/assignments`, { as: staff })).status).toBe(400)
  })

  it('updates a teacher and refuses a duplicate staff number', async () => {
    expect((await api('PATCH', `/api/teachers/${teacherId}`, { as: staff, body: { status: 'on_leave' } })).body.data.status).toBe(
      'on_leave',
    )
    expect((await api('POST', '/api/teachers', { as: staff, body: { staffNo: 'T-1', fullName: 'Copy' } })).status).toBe(409)
    expect((await api('GET', '/api/teachers/999999', { as: staff })).status).toBe(404)
    expect((await api('GET', '/api/subjects/999999', { as: staff })).status).toBe(404)
  })

  it('refuses to double-book a class or a teacher, and frees the slot on delete', async () => {
    const secondClass = (await api('POST', '/api/students/classes', { as: staff, body: { name: 'Form 4B', level: 4 } })).body.data.id
    const otherTeacher = (await api('POST', '/api/teachers', { as: staff, body: { staffNo: 'T-2', fullName: 'Paul Oduor' } })).body.data.id
    const slot = { subjectId, lessonPeriodId, dayOfWeek: 'monday', periodId: refs.period(1) }
    const book = (body: object) => api('POST', '/api/timetable/entries', { as: staff, body: { ...slot, ...body } })

    const first = await book({ classId, teacherId })
    expect(first.status).toBe(201)
    expect((await book({ classId, teacherId: otherTeacher })).body.error).toMatch(/class\/stream already/)
    expect((await book({ classId: secondClass, teacherId })).body.error).toMatch(/teacher is already/)

    expect((await api('GET', `/api/timetable/classes/${classId}?periodId=${refs.period(1)}`, { as: staff })).body.data).toHaveLength(1)
    expect((await api('GET', `/api/timetable/teachers/${teacherId}?periodId=${refs.period(1)}`, { as: staff })).status).toBe(200)
    expect((await api('GET', `/api/timetable/teachers/${teacherId}/workload?periodId=${refs.period(1)}`, { as: staff })).status).toBe(200)

    expect((await api('DELETE', `/api/timetable/entries/${first.body.data.id}`, { as: staff })).status).toBeLessThan(300)
    expect((await api('DELETE', `/api/timetable/entries/${first.body.data.id}`, { as: staff })).status).toBe(404)
    expect((await book({ classId: secondClass, teacherId })).status).toBe(201)
  })
})

describe('daily attendance', () => {
  it('records a class register and keeps one mark per student per day', async () => {
    const student = await newStudent('day')
    const mark = (status: string) => ({ studentId: student.id, attendanceDate: '2026-02-02', status, recordedBy: 1 })

    expect((await api('POST', '/api/attendance', { as: staff, body: mark('late') })).status).toBe(201)
    expect((await api('POST', '/api/attendance/bulk', { as: staff, body: { records: [mark('present')] } })).status).toBe(201)

    const history = await api('GET', `/api/attendance/students/${student.id}`, { as: staff })
    expect(history.body.data).toHaveLength(1)
    expect(history.body.data[0]).toMatchObject({ status: 'present', recordedBy: staff.id })
    expect((await api('GET', `/api/attendance/classes/${classId}?date=2026-02-02`, { as: staff })).status).toBe(200)
  })
})
