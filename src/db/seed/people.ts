import { eq } from 'drizzle-orm'
import { db } from '../client.js'
import { roles, users, userRoles } from '../schema/index.js'
import { hashPassword } from '../../modules/identity/password.js'
import { studentsService } from '../../modules/students/students.service.js'
import { guardiansService } from '../../modules/guardians/guardians.service.js'
import { teachersService } from '../../modules/teachers/teachers.service.js'
import { staffService } from '../../modules/staff/staff.service.js'
import { randInt, pick, chance, FIRST_NAMES_M, FIRST_NAMES_F, SURNAMES, TEACHERS, NON_TEACHING_STAFF } from './data.js'

export async function seedPeople() {
  // --- Classes and streams ---------------------------------------------------
  console.log('Classes and streams...')
  const classes = []
  for (let level = 1; level <= 4; level++) {
    const cls = await studentsService.createClass({ name: `Form ${level}`, level })
    const north = await studentsService.createStream({ classId: cls.id, name: 'North' })
    const south = await studentsService.createStream({ classId: cls.id, name: 'South' })
    classes.push({ ...cls, streams: [north, south] })
  }
  console.log(`  ${classes.length} classes, ${classes.length * 2} streams`)

  // --- Students --------------------------------------------------------------
  console.log('Students...')
  const allStudents: { id: number; classId: number; level: number; boarding: 'day' | 'boarder'; name: string; gender: string }[] = []
  let admissionCounter = 1

  for (const cls of classes) {
    for (let i = 0; i < 14; i++) {
      const gender = chance(0.5) ? 'male' : 'female'
      const firstName = gender === 'male' ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F)
      const lastName = pick(SURNAMES)
      // Boarding is the majority pattern in Kenyan secondary schools, but a
      // real roll always has day scholars — the fee structure below depends on
      // both existing.
      const boarding: 'day' | 'boarder' = chance(0.65) ? 'boarder' : 'day'
      const admissionYear = 2026 - (cls.level - 1)
      const guardianSurname = lastName

      const student = await studentsService.create({
        admissionNo: `KSS/${String(admissionCounter).padStart(4, '0')}`,
        firstName,
        lastName,
        otherNames: pick(SURNAMES),
        gender,
        dateOfBirth: `${2026 - 13 - cls.level}-${String(randInt(1, 12)).padStart(2, '0')}-${String(randInt(1, 28)).padStart(2, '0')}`,
        classId: cls.id,
        streamId: pick(cls.streams).id,
        boardingStatus: boarding,
        guardianName: `${chance(0.5) ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F)} ${guardianSurname}`,
        guardianPhone: `07${randInt(10, 99)}${randInt(100000, 999999)}`,
        admissionDate: `${admissionYear}-01-06`,
      })

      allStudents.push({ id: student.id, classId: cls.id, level: cls.level, boarding, name: `${firstName} ${lastName}`, gender })
      admissionCounter++
    }
  }
  console.log(`  ${allStudents.length} students across 4 forms`)

  // --- Parent accounts, linked to their children -----------------------------
  console.log('Parent/guardian accounts...')
  const [parentRole] = await db.select().from(roles).where(eq(roles.code, 'parent'))
  const parentPassword = await hashPassword(process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!')
  let guardianLinks = 0

  // Every 4th student gets a real portal login, so the parent portal has
  // something to serve without creating 56 near-identical accounts.
  for (let i = 0; i < allStudents.length; i += 4) {
    const child = allStudents[i]
    const [parentUser] = await db
      .insert(users)
      .values({
        email: `parent${i / 4 + 1}@school.local`,
        passwordHash: parentPassword,
        fullName: `Guardian of ${child.name}`,
        phone: `07${randInt(10, 99)}${randInt(100000, 999999)}`,
        mustChangePassword: false,
      })
      .returning()

    if (parentRole) await db.insert(userRoles).values({ userId: parentUser.id, roleId: parentRole.id })

    await guardiansService.link({
      userId: parentUser.id,
      studentId: child.id,
      relationship: chance(0.5) ? 'father' : 'mother',
      isPrimary: true,
    })
    guardianLinks++
  }
  console.log(`  ${guardianLinks} parent logins linked to their children`)

  // --- Teachers and staff registry -------------------------------------------
  console.log('Teachers and staff...')
  const teacherByStaffNo = new Map<string, number>()
  for (const t of TEACHERS) {
    const teacher = await teachersService.create({
      staffNo: t.staffNo,
      fullName: t.fullName,
      tscNumber: t.tscNumber,
      email: `${t.fullName.toLowerCase().replace(/\s+/g, '.')}@school.local`,
      phone: `07${randInt(10, 99)}${randInt(100000, 999999)}`,
    })
    teacherByStaffNo.set(t.staffNo, teacher.id)
  }

  const staffByStaffNo = new Map<string, number>()
  for (const t of TEACHERS) {
    const record = await staffService.create({
      staffNo: t.staffNo,
      fullName: t.fullName,
      category: 'teaching',
      employmentBody: t.tscNumber ? 'tsc' : 'bom',
      teacherId: teacherByStaffNo.get(t.staffNo),
      phone: `07${randInt(10, 99)}${randInt(100000, 999999)}`,
      employmentDate: `${randInt(2009, 2023)}-${String(randInt(1, 12)).padStart(2, '0')}-01`,
    })
    staffByStaffNo.set(t.staffNo, record.id)
  }
  for (const s of NON_TEACHING_STAFF) {
    const record = await staffService.create({
      staffNo: s.staffNo,
      fullName: s.fullName,
      category: 'non_teaching',
      employmentBody: 'bom',
      phone: `07${randInt(10, 99)}${randInt(100000, 999999)}`,
      employmentDate: `${randInt(2015, 2024)}-${String(randInt(1, 12)).padStart(2, '0')}-01`,
    })
    staffByStaffNo.set(s.staffNo, record.id)
  }
  console.log(`  ${TEACHERS.length} teachers, ${TEACHERS.length + NON_TEACHING_STAFF.length} staff records`)

  return { classes, allStudents, teacherByStaffNo, staffByStaffNo }
}

export type PeopleSeed = Awaited<ReturnType<typeof seedPeople>>
