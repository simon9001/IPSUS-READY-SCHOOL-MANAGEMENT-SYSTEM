/**
 * Populates a freshly-seeded database with a full year of activity for one
 * fictional school — Kilimani Secondary School, 2026.
 *
 * Everything here goes through the module SERVICES rather than straight into
 * the tables. That is the whole point: a fee invoice raised this way posts a
 * real balanced journal entry, a payment allocates FIFO across invoice items,
 * depreciation charges against the right accumulated-depreciation account, and
 * capacity/double-booking rules are enforced exactly as they would be for a
 * real user. Inserting rows directly would produce data that *looks* right on
 * every list page while leaving the trial balance meaningless.
 *
 * Run after `pnpm db:seed` (chart of accounts, funds, periods, RBAC, admin)
 * and `pnpm db:seed-demo-users` (one login per role).
 *
 * RUNTIME. Calls are sequential and each one is a database round trip, so the
 * wall-clock cost is dominated entirely by network latency, not by the work:
 *   - local Docker Postgres (~1ms round trip):  roughly a minute
 *   - remote Supabase (~200ms round trip):      roughly an hour
 * Sequential is deliberate — the RNG below is advanced in call order, so the
 * dataset is reproducible only as long as the order is. If you need this fast
 * against a remote database, point DATABASE_URL at a local Postgres, seed
 * there, and dump/restore; do not parallelise it without first pre-generating
 * every random value up front.
 */
import { eq, like, sql } from 'drizzle-orm'
import { db } from './client.js'
import { accounts, funds, fiscalPeriods, students, roles, users, userRoles } from './schema/index.js'
import { hashPassword } from '../modules/identity/password.js'

import { studentsService } from '../modules/students/students.service.js'
import { guardiansService } from '../modules/guardians/guardians.service.js'
import { teachersService } from '../modules/teachers/teachers.service.js'
import { staffService } from '../modules/staff/staff.service.js'
import { subjectsService } from '../modules/subjects/subjects.service.js'
import { timetableService } from '../modules/timetable/timetable.service.js'
import { feesService } from '../modules/fees/fees.service.js'
import { grantsService } from '../modules/grants/grants.service.js'
import { budgetsService } from '../modules/budgets/budgets.service.js'
import { procurementService } from '../modules/procurement/procurement.service.js'
import { payrollService } from '../modules/payroll/payroll.service.js'
import { assetsService } from '../modules/assets/assets.service.js'
import { inventoryService } from '../modules/inventory/inventory.service.js'
import { bankingService } from '../modules/banking/banking.service.js'
import { examsService } from '../modules/exams/exams.service.js'
import { attendanceService } from '../modules/attendance/attendance.service.js'
import { disciplineService } from '../modules/discipline/discipline.service.js'
import { conductPointsService } from '../modules/conductPoints/conductPoints.service.js'
import { libraryService } from '../modules/library/library.service.js'
import { clubsService } from '../modules/clubs/clubs.service.js'
import { boardingService } from '../modules/boarding/boarding.service.js'
import { transportService } from '../modules/transport/transport.service.js'
import { healthService } from '../modules/health/health.service.js'
import { noticesService } from '../modules/notices/notices.service.js'

// ---------------------------------------------------------------------------
// Deterministic pseudo-randomness
// ---------------------------------------------------------------------------
// A fixed-seed generator, not Math.random(), so two runs against a fresh
// database produce byte-identical data. That matters when you are comparing a
// report before and after a code change and need the difference to be the
// change rather than the dice.

let rngState = 20260101
const rand = () => {
  rngState = (rngState * 1664525 + 1013904223) % 4294967296
  return rngState / 4294967296
}
const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))
const pick = <T>(items: readonly T[]): T => items[Math.floor(rand() * items.length)]
const chance = (probability: number) => rand() < probability

// ---------------------------------------------------------------------------
// Fault tolerance
// ---------------------------------------------------------------------------
// A full run is tens of thousands of round trips over an hour, and a hosted
// Postgres will occasionally reset the socket underneath it. postgres.js
// reconnects on the next query, so one dropped connection should cost one
// record — not the entire hour of work that came before it.
//
// Deliberately does NOT retry: these units insert rows and post journal
// entries, and a socket that dies after the server committed but before the
// reply arrived would leave a retry duplicating real financial data. Skipping
// is the safe direction — a missing invoice is visibly missing, a duplicated
// one silently corrupts the ledger.

const skipped: string[] = []

async function tolerate<T>(label: string, work: () => Promise<T>): Promise<T | null> {
  try {
    return await work()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    skipped.push(`${label}: ${message.split('\n')[0]}`)
    process.stdout.write('!')
    return null
  }
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

const TERM_1 = { start: '2026-01-06', end: '2026-04-03' }
const TERM_2 = { start: '2026-04-27', end: '2026-08-07' }
const TERM_3 = { start: '2026-08-31', end: '2026-11-13' }

/** School days (Mon–Fri) from `start`, walking forward, capped at `count`. */
function schoolDays(start: string, count: number): string[] {
  const days: string[] = []
  const cursor = new Date(`${start}T00:00:00Z`)
  while (days.length < count) {
    const weekday = cursor.getUTCDay()
    if (weekday !== 0 && weekday !== 6) days.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

const FIRST_NAMES_M = ['Brian', 'Kevin', 'Dennis', 'Collins', 'Victor', 'Elijah', 'Fredrick', 'Isaac', 'Nicholas', 'Antony', 'Emmanuel', 'Gideon', 'Bernard', 'Cyrus', 'Duncan', 'Erick']
const FIRST_NAMES_F = ['Mercy', 'Faith', 'Lydia', 'Purity', 'Winnie', 'Sharon', 'Beatrice', 'Caroline', 'Doreen', 'Emily', 'Gladys', 'Hellen', 'Irene', 'Joyce', 'Lilian', 'Naomi']
const SURNAMES = ['Kamau', 'Ochieng', 'Wafula', 'Kiplagat', 'Mutiso', 'Njoroge', 'Omondi', 'Chebet', 'Wanyama', 'Muriuki', 'Achieng', 'Barasa', 'Kirui', 'Maina', 'Nyaga', 'Owino', 'Simiyu', 'Wekesa', 'Gitonga', 'Kilonzo']

const SUBJECTS = [
  { code: 'MAT', name: 'Mathematics', isCompulsory: true },
  { code: 'ENG', name: 'English', isCompulsory: true },
  { code: 'KIS', name: 'Kiswahili', isCompulsory: true },
  { code: 'BIO', name: 'Biology', isCompulsory: false },
  { code: 'CHE', name: 'Chemistry', isCompulsory: false },
  { code: 'PHY', name: 'Physics', isCompulsory: false },
  { code: 'HIS', name: 'History & Government', isCompulsory: false },
  { code: 'GEO', name: 'Geography', isCompulsory: false },
  { code: 'CRE', name: 'Christian Religious Education', isCompulsory: false },
  { code: 'BST', name: 'Business Studies', isCompulsory: false },
  { code: 'AGR', name: 'Agriculture', isCompulsory: false },
  { code: 'COM', name: 'Computer Studies', isCompulsory: false },
]

/** CBC strand breakdown for two subjects — the rest are graded whole-subject,
 *  which is what the 8-4-4 side of the dual-mode design expects. */
const STRANDS: Record<string, string[]> = {
  MAT: ['Numbers', 'Algebra', 'Measurement', 'Geometry', 'Data Handling'],
  BIO: ['Living Things', 'Nutrition', 'Transport in Organisms', 'Reproduction'],
}

const TEACHERS = [
  { staffNo: 'TSC/001', fullName: 'Peter Njuguna', tscNumber: 'TSC/2011/44821', subjects: ['MAT', 'PHY'] },
  { staffNo: 'TSC/002', fullName: 'Rose Atieno', tscNumber: 'TSC/2013/51902', subjects: ['ENG'] },
  { staffNo: 'TSC/003', fullName: 'Samuel Kiprotich', tscNumber: 'TSC/2009/33410', subjects: ['KIS'] },
  { staffNo: 'TSC/004', fullName: 'Jane Wanjiru', tscNumber: 'TSC/2015/60277', subjects: ['BIO', 'AGR'] },
  { staffNo: 'TSC/005', fullName: 'Charles Otieno', tscNumber: 'TSC/2012/47118', subjects: ['CHE'] },
  { staffNo: 'TSC/006', fullName: 'Agnes Muthoni', tscNumber: 'TSC/2016/64530', subjects: ['HIS', 'CRE'] },
  { staffNo: 'TSC/007', fullName: 'Dennis Barasa', tscNumber: 'TSC/2014/55801', subjects: ['GEO'] },
  { staffNo: 'TSC/008', fullName: 'Mary Chelangat', tscNumber: 'TSC/2017/70114', subjects: ['MAT'] },
  { staffNo: 'TSC/009', fullName: 'Joseph Mwendwa', tscNumber: 'TSC/2010/38765', subjects: ['BST'] },
  { staffNo: 'BOM/T01', fullName: 'Caroline Nekesa', tscNumber: undefined, subjects: ['COM'] },
  { staffNo: 'BOM/T02', fullName: 'Felix Karanja', tscNumber: undefined, subjects: ['PHY', 'CHE'] },
  { staffNo: 'BOM/T03', fullName: 'Esther Wangui', tscNumber: undefined, subjects: ['ENG', 'CRE'] },
]

/** BOM-paid staff only — TSC teachers are paid by the Commission and are
 *  deliberately not on this school's payroll (see 02-database-schema.md). */
const BOM_EMPLOYEES = [
  { staffNo: 'BOM/T01', fullName: 'Caroline Nekesa', jobTitle: 'Teacher - Computer Studies', basic: 38000, houseAllowance: 8000 },
  { staffNo: 'BOM/T02', fullName: 'Felix Karanja', jobTitle: 'Teacher - Sciences', basic: 36000, houseAllowance: 8000 },
  { staffNo: 'BOM/T03', fullName: 'Esther Wangui', jobTitle: 'Teacher - Languages', basic: 35000, houseAllowance: 8000 },
  { staffNo: 'BOM/S01', fullName: 'Grace Mwikali', jobTitle: 'School Secretary', basic: 24000, houseAllowance: 5000 },
  { staffNo: 'BOM/S02', fullName: 'Julius Ndegwa', jobTitle: 'Head Cook', basic: 21000, houseAllowance: 4000 },
  { staffNo: 'BOM/S03', fullName: 'Patrick Wafula', jobTitle: 'Groundsman', basic: 17000, houseAllowance: 3000 },
  { staffNo: 'BOM/S04', fullName: 'Alice Nduta', jobTitle: 'Matron', basic: 23000, houseAllowance: 5000 },
  { staffNo: 'BOM/S05', fullName: 'Simon Kariuki', jobTitle: 'Driver', basic: 22000, houseAllowance: 4000 },
  { staffNo: 'BOM/S06', fullName: 'Michael Ouma', jobTitle: 'Watchman', basic: 16000, houseAllowance: 3000 },
]

const NON_TEACHING_STAFF = [
  { staffNo: 'BOM/S01', fullName: 'Grace Mwikali' },
  { staffNo: 'BOM/S02', fullName: 'Julius Ndegwa' },
  { staffNo: 'BOM/S03', fullName: 'Patrick Wafula' },
  { staffNo: 'BOM/S04', fullName: 'Alice Nduta' },
  { staffNo: 'BOM/S05', fullName: 'Simon Kariuki' },
  { staffNo: 'BOM/S06', fullName: 'Michael Ouma' },
]

const LESSON_PERIODS = [
  { name: 'Period 1', startTime: '08:00', endTime: '08:40', sortOrder: 1 },
  { name: 'Period 2', startTime: '08:40', endTime: '09:20', sortOrder: 2 },
  { name: 'Period 3', startTime: '09:20', endTime: '10:00', sortOrder: 3 },
  { name: 'Period 4', startTime: '10:20', endTime: '11:00', sortOrder: 4 },
  { name: 'Period 5', startTime: '11:00', endTime: '11:40', sortOrder: 5 },
  { name: 'Period 6', startTime: '11:40', endTime: '12:20', sortOrder: 6 },
  { name: 'Period 7', startTime: '14:00', endTime: '14:40', sortOrder: 7 },
  { name: 'Period 8', startTime: '14:40', endTime: '15:20', sortOrder: 8 },
]

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------
// Every table this script writes to, and nothing else. Deliberately excluded:
// accounts, funds, fiscal_periods, users/roles/permissions and their junctions,
// and audit_log — those come from `pnpm db:seed` and must survive a reset, or
// you would have to re-bootstrap the whole system to reload demo data.
//
// One TRUNCATE ... CASCADE rather than ordered DELETEs: it is atomic, it does
// not care about foreign-key ordering, and RESTART IDENTITY puts the sequences
// back so a re-run produces the same ids as a first run.
const SCHOOL_DATA_TABLES = [
  'admissions', 'asset_categories', 'asset_disposals', 'assets', 'attendance_records',
  'bank_accounts', 'bank_reconciliation_items', 'bank_reconciliations', 'bed_allocations',
  'boarding_attendance', 'book_borrowings', 'budget_lines', 'budgets', 'bus_routes',
  'class_subjects', 'classes', 'clinic_visits', 'club_memberships', 'clubs',
  'competition_participants', 'competitions', 'compliance_reports', 'conduct_point_rules',
  'conduct_points', 'counseling_sessions', 'depreciation_entries', 'disciplinary_cases',
  'discipline_records', 'document_templates', 'dormitories', 'employees', 'exam_results',
  'exam_strand_results', 'exam_timetable_entries', 'exams', 'fee_invoice_items', 'fee_invoices',
  'fee_payment_allocations', 'fee_payments', 'fee_structure_items', 'fee_structures',
  'generated_documents', 'goods_received_notes', 'grading_bands', 'grading_scales',
  'grant_disbursements', 'grant_types', 'grn_items', 'guardian_students', 'imprest_requests',
  'imprest_retirements', 'inventory_items', 'journal_entries', 'journal_lines', 'leave_requests',
  'leave_types', 'lesson_periods', 'library_books', 'medical_conditions',
  'medication_administrations', 'notices', 'notification_templates', 'notifications',
  'payroll_runs', 'payslips', 'promotions', 'purchase_order_items', 'purchase_orders',
  'purchase_requisitions', 'requisition_items', 'route_stops', 'salary_components', 'staff',
  'staff_appraisals', 'staff_contracts', 'staff_disciplinary_records', 'stock_movements',
  'streams', 'student_transport_allocations', 'students', 'subject_strands', 'subjects',
  'supplier_invoices', 'supplier_payments', 'suppliers', 'teacher_assignments', 'teachers',
  'timetable_entries',
]

async function resetSchoolData() {
  console.log('Clearing existing school data...')
  const list = SCHOOL_DATA_TABLES.map((t) => `"${t}"`).join(', ')
  await db.execute(sql.raw(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`))

  // The parent logins this script creates live in `users`, which is not
  // truncated — remove just those, and let the user_roles FK cascade.
  await db.delete(users).where(like(users.email, 'parent%@school.local'))
  console.log(`  ${SCHOOL_DATA_TABLES.length} tables truncated, generated parent logins removed`)
}

// ---------------------------------------------------------------------------

async function main() {
  const reset = process.argv.includes('--reset')

  console.log('\n=== Seeding Kilimani Secondary School — 2026 ===\n')

  if (reset) {
    await resetSchoolData()
  } else {
    // This script is additive and not idempotent, so a second run would double
    // every invoice and journal entry. Refuse rather than corrupt.
    const [existingStudent] = await db.select().from(students).limit(1)
    if (existingStudent) {
      console.error('Students already exist — this database already holds school data.')
      console.error('This script is not idempotent: re-running would duplicate every invoice and journal entry.')
      console.error('Re-run with --reset to clear the school data first (the chart of accounts, funds,')
      console.error('fiscal periods and all logins are preserved):')
      console.error('\n    pnpm db:seed-school --reset\n')
      process.exit(1)
    }
  }

  // --- Reference lookups -----------------------------------------------------
  const accountRows = await db.select().from(accounts)
  const fundRows = await db.select().from(funds)
  const periodRows = await db.select().from(fiscalPeriods)

  if (accountRows.length === 0 || fundRows.length === 0 || periodRows.length === 0) {
    console.error('Chart of accounts, funds, or fiscal periods are missing. Run `pnpm db:seed` first.')
    process.exit(1)
  }

  const acct = (code: string) => {
    const row = accountRows.find((a) => a.code === code)
    if (!row) throw new Error(`Account ${code} not found — is the chart of accounts seeded?`)
    return row.id
  }
  const fund = (code: string) => {
    const row = fundRows.find((f) => f.code === code)
    if (!row) throw new Error(`Fund ${code} not found`)
    return row.id
  }
  const period = (term: number) => {
    const row = periodRows.find((p) => p.term === term && p.fiscalYear === 2026)
    if (!row) throw new Error(`2026 Term ${term} not found`)
    return row.id
  }

  const BANK = acct('1010')
  const CAPITATION_BANK = acct('1020')
  const PETTY_CASH = acct('1030')
  const FEE_DEBTORS = acct('1100')
  const INVENTORY_ACCT = acct('1200')
  const PPE = acct('1500')
  const ACCUM_DEP = acct('1510')
  const CREDITORS = acct('2000')
  const PAYE = acct('2100')
  const NSSF = acct('2110')
  const SHIF = acct('2120')
  const TUITION_INCOME = acct('4000')
  const BOARDING_INCOME = acct('4010')
  const ACTIVITY_INCOME = acct('4020')
  const CAPITATION_INCOME = acct('4100')
  const TRADING_INCOME = acct('4300')
  const SALARIES = acct('5000')
  const TEACHING_MATERIALS = acct('5100')
  const FOOD = acct('5200')
  const UTILITIES = acct('5300')
  const REPAIRS = acct('5400')
  const TRANSPORT_EXPENSE = acct('5500')
  const MEDICAL = acct('5600')
  const DEPRECIATION = acct('5700')
  const ADMIN_EXPENSE = acct('5900')

  const F_CAP = fund('FUND-CAP')
  const F_TUI = fund('FUND-TUI')
  const F_BRD = fund('FUND-BRD')
  const F_DEV = fund('FUND-DEV')
  const F_PTA = fund('FUND-PTA')
  const F_TRD = fund('FUND-TRD')

  const P1 = period(1)
  const P2 = period(2)
  const P3 = period(3)

  // Actor ids for createdBy/recordedBy/approvedBy. Falls back to the admin
  // when a demo login is absent, so this works with or without db:seed-demo-users.
  const userRows = await db.select().from(users)
  const userIdByEmail = new Map(userRows.map((u) => [u.email, u.id]))
  const adminId = userRows[0].id
  const actor = (email: string) => userIdByEmail.get(email) ?? adminId

  const PRINCIPAL = actor('principal@school.local')
  const BURSAR = actor('bursar@school.local')
  const CLERK = actor('accounts.clerk@school.local')
  const PROCUREMENT = actor('procurement@school.local')
  const STOREKEEPER = actor('storekeeper@school.local')
  const PAYROLL_OFFICER = actor('payroll@school.local')
  const TEACHER_USER = actor('teacher@school.local')
  const NURSE = actor('nurse@school.local')
  const LIBRARIAN = actor('librarian@school.local')
  const BOARDING_OFFICER = actor('boarding@school.local')
  const DEAN = actor('dean@school.local')

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

  // --- Subjects, strands, class offerings, teacher assignments ----------------
  console.log('Subjects, CBC strands, offerings and assignments...')
  const subjectByCode = new Map<string, number>()
  for (const s of SUBJECTS) {
    const subject = await subjectsService.create(s)
    subjectByCode.set(s.code, subject.id)
  }

  let strandCount = 0
  for (const [code, names] of Object.entries(STRANDS)) {
    for (const name of names) {
      await subjectsService.createStrand({ subjectId: subjectByCode.get(code)!, name })
      strandCount++
    }
  }

  // Forms 1-2 take the full compulsory set plus the sciences and humanities;
  // Forms 3-4 drop to a narrower KCSE selection, which is what actually happens
  // after subject selection at the end of Form 2.
  const JUNIOR_SUBJECTS = ['MAT', 'ENG', 'KIS', 'BIO', 'CHE', 'PHY', 'HIS', 'GEO', 'CRE', 'AGR']
  const SENIOR_SUBJECTS = ['MAT', 'ENG', 'KIS', 'BIO', 'CHE', 'PHY', 'GEO', 'BST']

  const subjectsForClass = (level: number) => (level <= 2 ? JUNIOR_SUBJECTS : SENIOR_SUBJECTS)

  // teacherFor: which teacher teaches a given subject to a given class. Round
  // robins between the teachers qualified for that subject so no one person
  // ends up owning every class of it.
  const teachersBySubject = new Map<string, number[]>()
  for (const t of TEACHERS) {
    for (const code of t.subjects) {
      const list = teachersBySubject.get(code) ?? []
      list.push(teacherByStaffNo.get(t.staffNo)!)
      teachersBySubject.set(code, list)
    }
  }
  const teacherFor = (code: string, level: number) => {
    const candidates = teachersBySubject.get(code)
    if (!candidates || candidates.length === 0) return teacherByStaffNo.get(TEACHERS[0].staffNo)!
    return candidates[(level - 1) % candidates.length]
  }

  let offerings = 0
  let assignments = 0
  for (const cls of classes) {
    for (const code of subjectsForClass(cls.level)) {
      await subjectsService.offerToClass({ classId: cls.id, subjectId: subjectByCode.get(code)! })
      offerings++
      for (const periodId of [P1, P2, P3]) {
        await subjectsService.assignTeacher({
          teacherId: teacherFor(code, cls.level),
          subjectId: subjectByCode.get(code)!,
          classId: cls.id,
          periodId,
        })
        assignments++
      }
    }
  }
  console.log(`  ${SUBJECTS.length} subjects, ${strandCount} CBC strands, ${offerings} class offerings, ${assignments} teacher assignments`)

  // --- Timetable -------------------------------------------------------------
  console.log('Class timetable for Term 3...')
  const lessonPeriodIds: number[] = []
  for (const lp of LESSON_PERIODS) {
    const created = await timetableService.createLessonPeriod(lp)
    lessonPeriodIds.push(created.id)
  }

  // The service rejects double-booking a class OR a teacher in the same slot,
  // so occupancy is tracked here and a busy teacher's subject is rotated past
  // rather than relying on catching the resulting ConflictError.
  const teacherBusy = new Set<string>()
  let timetableEntries = 0

  for (const cls of classes) {
    const codes = subjectsForClass(cls.level)
    let rotation = cls.level * 3
    for (const day of WEEKDAYS) {
      for (const lessonPeriodId of lessonPeriodIds) {
        let placed = false
        for (let attempt = 0; attempt < codes.length && !placed; attempt++) {
          const code = codes[(rotation + attempt) % codes.length]
          const teacherId = teacherFor(code, cls.level)
          const slotKey = `${teacherId}|${day}|${lessonPeriodId}`
          if (teacherBusy.has(slotKey)) continue

          await timetableService.createEntry({
            classId: cls.id,
            subjectId: subjectByCode.get(code)!,
            teacherId,
            lessonPeriodId,
            dayOfWeek: day,
            periodId: P3,
          })
          teacherBusy.add(slotKey)
          timetableEntries++
          placed = true
        }
        rotation++
      }
    }
  }
  console.log(`  ${LESSON_PERIODS.length} lesson periods, ${timetableEntries} timetable entries`)

  // --- Budget ----------------------------------------------------------------
  console.log('2026 budget...')
  const budget = await budgetsService.create({
    fiscalYear: 2026,
    name: 'Kilimani Secondary School — 2026 Annual Budget',
    createdBy: BURSAR,
    lines: [
      { accountId: SALARIES, fundId: F_TUI, amount: 9_600_000 },
      { accountId: FOOD, fundId: F_BRD, amount: 7_200_000 },
      { accountId: TEACHING_MATERIALS, fundId: F_CAP, amount: 2_400_000 },
      { accountId: UTILITIES, fundId: F_TUI, amount: 1_200_000 },
      { accountId: REPAIRS, fundId: F_DEV, amount: 1_800_000 },
      { accountId: TRANSPORT_EXPENSE, fundId: F_TUI, amount: 900_000 },
      { accountId: MEDICAL, fundId: F_TUI, amount: 300_000 },
      { accountId: ADMIN_EXPENSE, fundId: F_TUI, amount: 750_000 },
    ],
  })
  await budgetsService.approve(budget.id, PRINCIPAL)
  console.log(`  Budget "${budget.name}" approved`)

  // --- Bank accounts ---------------------------------------------------------
  console.log('Bank accounts...')
  await bankingService.createAccount({ accountId: BANK, fundId: F_TUI, bankName: 'Kenya Commercial Bank', accountNumber: '1102938475', branch: 'Kilimani' })
  await bankingService.createAccount({ accountId: CAPITATION_BANK, fundId: F_CAP, bankName: 'Kenya Commercial Bank', accountNumber: '1102938476', branch: 'Kilimani' })

  // --- Government capitation -------------------------------------------------
  console.log('FDSE capitation...')
  const capitationType = await grantsService.createType({
    name: 'Free Day Secondary Education (FDSE) Capitation',
    fundId: F_CAP,
    revenueAccountId: CAPITATION_INCOME,
    conditionsDescription: 'Disbursed per enrolled learner per MoE guidelines; spend restricted to tuition and approved operational voteheads.',
  })

  // The real disbursement pattern: 50% in Term 1, 30% in Term 2, 20% in Term 3.
  const capitationPerLearner = 22244
  const annualCapitation = capitationPerLearner * allStudents.length
  const tranches = [
    { periodId: P1, date: '2026-01-28', share: 0.5, conditionsMet: true },
    { periodId: P2, date: '2026-05-14', share: 0.3, conditionsMet: true },
    // Term 3 tranche has landed but the enrolment return that unlocks it has
    // not been accepted yet — so it is NOT yet recognised as revenue.
    { periodId: P3, date: '2026-09-08', share: 0.2, conditionsMet: false },
  ]
  for (const t of tranches) {
    await grantsService.recordDisbursement({
      grantTypeId: capitationType.id,
      periodId: t.periodId,
      cashAccountId: CAPITATION_BANK,
      expectedAmount: Math.round(annualCapitation * t.share),
      amountReceived: Math.round(annualCapitation * t.share),
      dateReceived: t.date,
      conditionsMet: t.conditionsMet,
      notes: t.conditionsMet ? 'Enrolment return accepted by the sub-county director.' : 'Awaiting acceptance of the Term 3 enrolment return.',
      recordedBy: BURSAR,
    })
  }
  console.log(`  3 tranches totalling KES ${annualCapitation.toLocaleString()} (Term 3 held as deferred income)`)

  // --- Fee structures, invoices and receipts ---------------------------------
  console.log('Fee structures, invoices and receipts...')
  const feeStructureFor = new Map<string, number>()

  for (const cls of classes) {
    for (const boarding of ['day', 'boarder'] as const) {
      for (const [term, periodId] of [[1, P1], [2, P2], [3, P3]] as const) {
        const items = [
          { accountId: TUITION_INCOME, fundId: F_TUI, description: 'Tuition', amount: 5_500 + cls.level * 500 },
          { accountId: ACTIVITY_INCOME, fundId: F_PTA, description: 'Activity & PTA', amount: 2_000 },
          { accountId: TUITION_INCOME, fundId: F_DEV, description: 'Development levy', amount: 1_500 },
        ]
        if (boarding === 'boarder') {
          items.push({ accountId: BOARDING_INCOME, fundId: F_BRD, description: 'Boarding & meals', amount: 16_000 })
        }

        const structure = await feesService.createStructure({
          fiscalYear: 2026,
          periodId,
          classId: cls.id,
          boardingStatus: boarding,
          items,
        })
        feeStructureFor.set(`${cls.id}|${boarding}|${term}`, structure.id)
      }
    }
  }

  let invoiceCount = 0
  let paymentCount = 0
  let receiptedTotal = 0

  for (const [term, periodId, invoiceDate] of [[1, P1, TERM_1.start], [2, P2, TERM_2.start], [3, P3, TERM_3.start]] as const) {
    for (const student of allStudents) {
      const structureId = feeStructureFor.get(`${student.classId}|${student.boarding}|${term}`)!

      // Collection realism: earlier terms are largely settled, the current term
      // is mid-collection. A slice of every term stays unpaid — a school with a
      // 100% collection rate would make the fee-arrears reporting meaningless.
      const settlementProfile = term === 3 ? 0.45 : term === 2 ? 0.85 : 0.92
      const settles = chance(settlementProfile)
      const payInFull = chance(0.7)
      const partialShare = randInt(30, 80)
      const paymentOffset = randInt(2, 40)
      const method = pick(['mpesa', 'bank', 'cash', 'cheque'] as const)
      const reference = `REF${randInt(100000, 999999)}`

      const invoice = await tolerate(`Term ${term} invoice for ${student.name}`, () =>
        feesService.createInvoice({
          studentId: student.id,
          periodId,
          feeStructureId: structureId,
          invoiceDate,
          debtorsAccountId: FEE_DEBTORS,
          createdBy: CLERK,
        }),
      )
      if (!invoice) continue
      invoiceCount++
      if (!settles) continue

      const total = Number(invoice.totalAmount)
      const amount = payInFull ? total : Math.round((total * partialShare) / 100)

      const payment = await tolerate(`Term ${term} receipt for ${student.name}`, () =>
        feesService.recordPayment({
          studentId: student.id,
          invoiceId: invoice.id,
          paymentDate: addDays(invoiceDate, paymentOffset),
          amount,
          paymentMethod: method,
          referenceNo: reference,
          cashAccountId: BANK,
          debtorsAccountId: FEE_DEBTORS,
          periodId,
          receivedBy: CLERK,
        }),
      )
      if (!payment) continue
      paymentCount++
      receiptedTotal += amount
    }
  }
  console.log(`  ${invoiceCount} invoices, ${paymentCount} receipts, KES ${receiptedTotal.toLocaleString()} collected`)

  // --- Procurement -----------------------------------------------------------
  console.log('Procurement chain...')
  const suppliers = []
  for (const s of [
    { name: 'Nakuru Cereals & Produce Ltd', kraPin: 'P051234567A', contactPerson: 'Joseph Maina', phone: '0722100200' },
    { name: 'Text Book Centre', kraPin: 'P051987654B', contactPerson: 'Anne Kilonzo', phone: '0733400500' },
    { name: 'Kilimani Hardware Supplies', kraPin: 'P051555444C', contactPerson: 'Ali Hassan', phone: '0711900800' },
  ]) {
    suppliers.push(await procurementService.createSupplier({ ...s, bankName: 'Equity Bank', bankAccountNo: String(randInt(1000000000, 1999999999)) }))
  }

  const procurementRuns = [
    { supplier: 0, department: 'Kitchen / Boarding', account: FOOD, fundId: F_BRD, description: 'Maize (90kg bags)', quantity: 120, unitCost: 4_800, date: '2026-01-20', pay: true },
    { supplier: 1, department: 'Academics', account: TEACHING_MATERIALS, fundId: F_CAP, description: 'Form 1 textbook set', quantity: 60, unitCost: 3_200, date: '2026-02-10', pay: true },
    { supplier: 2, department: 'Maintenance', account: REPAIRS, fundId: F_DEV, description: 'Roofing sheets and timber', quantity: 40, unitCost: 2_750, date: '2026-05-18', pay: true },
    // Left unpaid on purpose: gives the Procurement dashboard widget and the
    // Principal's approval queue something real to show.
    { supplier: 0, department: 'Kitchen / Boarding', account: FOOD, fundId: F_BRD, description: 'Beans (90kg bags)', quantity: 45, unitCost: 9_500, date: '2026-09-03', pay: false },
  ]

  let poCount = 0
  for (const [index, run] of procurementRuns.entries()) {
    const periodId = run.date < TERM_1.end ? P1 : run.date < TERM_2.end ? P2 : P3

    const requisition = await procurementService.createRequisition({
      requestedBy: PROCUREMENT,
      department: run.department,
      requestDate: run.date,
      items: [{ description: run.description, quantity: run.quantity, estimatedUnitCost: run.unitCost, accountId: run.account }],
    })
    await procurementService.approveRequisition(requisition.id, { approvedBy: PRINCIPAL })

    const po = await procurementService.createPurchaseOrder({
      supplierId: suppliers[run.supplier].id,
      requisitionId: requisition.id,
      orderDate: addDays(run.date, 2),
      items: [{ description: run.description, quantity: run.quantity, unitCost: run.unitCost, accountId: run.account }],
      approvedBy: PRINCIPAL,
    })
    poCount++

    const poDetail = await procurementService.getPurchaseOrderById(po.id)
    const grn = await procurementService.createGrn({
      purchaseOrderId: po.id,
      receivedDate: addDays(run.date, 9),
      receivedBy: STOREKEEPER,
      items: poDetail.items.map((item) => ({ purchaseOrderItemId: item.id, quantityReceived: item.quantity, condition: 'Good' })),
    })

    const total = run.quantity * run.unitCost
    const invoice = await procurementService.createSupplierInvoice({
      invoiceNo: `SINV-2026-${String(index + 1).padStart(3, '0')}`,
      supplierId: suppliers[run.supplier].id,
      purchaseOrderId: po.id,
      grnId: grn.id,
      invoiceDate: addDays(run.date, 11),
      dueDate: addDays(run.date, 41),
      fundId: run.fundId,
      creditorsAccountId: CREDITORS,
      periodId,
      createdBy: BURSAR,
      lines: [{ accountId: run.account, amount: total, description: run.description }],
    })

    if (run.pay) {
      await procurementService.createSupplierPayment({
        supplierInvoiceId: invoice.id,
        paymentDate: addDays(run.date, 25),
        amount: total,
        paymentMethod: 'bank',
        referenceNo: `CHQ${randInt(10000, 99999)}`,
        fundId: run.fundId,
        cashAccountId: BANK,
        creditorsAccountId: CREDITORS,
        periodId,
        paidBy: BURSAR,
        approvedBy: PRINCIPAL,
      })
    }
  }
  console.log(`  ${suppliers.length} suppliers, ${poCount} full requisition→LPO→GRN→invoice chains (1 left unpaid)`)

  // --- Payroll ---------------------------------------------------------------
  console.log('Payroll...')
  for (const e of BOM_EMPLOYEES) {
    const employee = await payrollService.createEmployee({
      staffNo: e.staffNo,
      fullName: e.fullName,
      idNumber: String(randInt(20000000, 39999999)),
      kraPin: `A0${randInt(10000000, 99999999)}Z`,
      nssfNo: String(randInt(100000, 999999)),
      shifNo: String(randInt(100000, 999999)),
      jobTitle: e.jobTitle,
      employmentType: 'permanent',
      bankName: 'Equity Bank',
      bankAccountNo: String(randInt(1000000000, 1999999999)),
      employmentDate: `${randInt(2015, 2023)}-01-15`,
    })
    await payrollService.addSalaryComponent(employee.id, { componentType: 'basic', name: 'Basic Salary', amount: e.basic, isPercentageOfBasic: false })
    await payrollService.addSalaryComponent(employee.id, { componentType: 'allowance', name: 'House Allowance', amount: e.houseAllowance, isPercentageOfBasic: false })
    await payrollService.addSalaryComponent(employee.id, { componentType: 'allowance', name: 'Responsibility Allowance', amount: 5, isPercentageOfBasic: true })
  }

  const payrollMonths: { monthYear: string; periodId: number; entryDate: string }[] = [
    { monthYear: '2026-01', periodId: P1, entryDate: '2026-01-28' },
    { monthYear: '2026-02', periodId: P1, entryDate: '2026-02-26' },
    { monthYear: '2026-03', periodId: P1, entryDate: '2026-03-27' },
    { monthYear: '2026-05', periodId: P2, entryDate: '2026-05-28' },
    { monthYear: '2026-06', periodId: P2, entryDate: '2026-06-26' },
    { monthYear: '2026-07', periodId: P2, entryDate: '2026-07-29' },
  ]
  for (const month of payrollMonths) {
    const run = await payrollService.createRun({ periodId: month.periodId, monthYear: month.monthYear })
    await payrollService.processRun(run.id, {
      fundId: F_TUI,
      salariesExpenseAccountId: SALARIES,
      payeAccountId: PAYE,
      nssfAccountId: NSSF,
      shifAccountId: SHIF,
      netPayAccountId: BANK,
      entryDate: month.entryDate,
      processedBy: PAYROLL_OFFICER,
    })
  }
  // September is raised but deliberately left in draft — the Payroll dashboard
  // widget reads the latest run, and "awaiting processing" is the state a
  // payroll officer actually logs in to find.
  await payrollService.createRun({ periodId: P3, monthYear: '2026-09' })
  console.log(`  ${BOM_EMPLOYEES.length} BOM employees, ${payrollMonths.length} runs posted, September left in draft`)

  // --- Fixed assets ----------------------------------------------------------
  console.log('Fixed assets and depreciation...')
  const categories = {
    vehicles: await assetsService.createCategory({ name: 'Motor Vehicles', defaultUsefulLifeYears: 8, depreciationMethod: 'straight_line', assetAccountId: PPE, depreciationExpenseAccountId: DEPRECIATION, accumulatedDepreciationAccountId: ACCUM_DEP }),
    ict: await assetsService.createCategory({ name: 'ICT Equipment', defaultUsefulLifeYears: 4, depreciationMethod: 'straight_line', assetAccountId: PPE, depreciationExpenseAccountId: DEPRECIATION, accumulatedDepreciationAccountId: ACCUM_DEP }),
    furniture: await assetsService.createCategory({ name: 'Furniture and Fittings', defaultUsefulLifeYears: 10, depreciationMethod: 'straight_line', assetAccountId: PPE, depreciationExpenseAccountId: DEPRECIATION, accumulatedDepreciationAccountId: ACCUM_DEP }),
    lab: await assetsService.createCategory({ name: 'Laboratory Equipment', defaultUsefulLifeYears: 6, depreciationMethod: 'straight_line', assetAccountId: PPE, depreciationExpenseAccountId: DEPRECIATION, accumulatedDepreciationAccountId: ACCUM_DEP }),
  }

  const assetList = [
    { tag: 'KSS/VEH/001', category: categories.vehicles.id, name: 'School Bus - KDA 331P', cost: 6_800_000, fundId: F_DEV, location: 'Main gate', date: '2026-01-15' },
    { tag: 'KSS/ICT/001', category: categories.ict.id, name: 'Computer Lab - 25 desktop units', cost: 1_250_000, fundId: F_CAP, location: 'Computer Laboratory', date: '2026-02-03' },
    { tag: 'KSS/ICT/002', category: categories.ict.id, name: 'Staffroom printers and projectors', cost: 320_000, fundId: F_TUI, location: 'Staffroom', date: '2026-02-20' },
    { tag: 'KSS/FUR/001', category: categories.furniture.id, name: 'Classroom desks and chairs - 240 sets', cost: 960_000, fundId: F_DEV, location: 'Classroom block', date: '2026-01-22' },
    { tag: 'KSS/FUR/002', category: categories.furniture.id, name: 'Dormitory double-decker beds - 80 units', cost: 720_000, fundId: F_BRD, location: 'Dormitories', date: '2026-04-30' },
    { tag: 'KSS/LAB/001', category: categories.lab.id, name: 'Chemistry laboratory apparatus', cost: 480_000, fundId: F_CAP, location: 'Chemistry Laboratory', date: '2026-05-06' },
  ]
  for (const a of assetList) {
    await assetsService.acquire({
      assetTag: a.tag,
      categoryId: a.category,
      name: a.name,
      acquisitionDate: a.date,
      acquisitionCost: a.cost,
      fundId: a.fundId,
      location: a.location,
      periodId: a.date < TERM_1.end ? P1 : P2,
      creditAccountId: BANK,
      createdBy: BURSAR,
    })
  }
  const depreciationEntries = await assetsService.runDepreciation({ periodId: P2, asOfDate: '2026-08-07', createdBy: BURSAR })
  console.log(`  ${assetList.length} assets acquired, ${depreciationEntries.length} depreciation charges posted`)

  // --- Inventory / stores ----------------------------------------------------
  console.log('Stores and stock movements...')
  const items = []
  for (const i of [
    { itemCode: 'STK-MAIZE', name: 'Maize', unit: '90kg bag', category: 'Foodstuff', reorderLevel: 20 },
    { itemCode: 'STK-BEANS', name: 'Beans', unit: '90kg bag', category: 'Foodstuff', reorderLevel: 15 },
    { itemCode: 'STK-RICE', name: 'Rice', unit: '50kg bag', category: 'Foodstuff', reorderLevel: 10 },
    { itemCode: 'STK-BOOKS', name: 'Exercise Books', unit: 'dozen', category: 'Stationery', reorderLevel: 50 },
    { itemCode: 'STK-CHALK', name: 'Chalk', unit: 'box', category: 'Stationery', reorderLevel: 25 },
    { itemCode: 'STK-DTGT', name: 'Detergent', unit: 'litre', category: 'Cleaning', reorderLevel: 30 },
  ]) {
    items.push(await inventoryService.createItem(i))
  }

  const stockPlan = [
    { item: 0, received: 200, unitCost: 4_800, issued: 186, fundId: F_BRD, expense: FOOD },
    { item: 1, received: 90, unitCost: 9_500, issued: 82, fundId: F_BRD, expense: FOOD },
    { item: 2, received: 60, unitCost: 6_400, issued: 52, fundId: F_BRD, expense: FOOD },
    { item: 3, received: 400, unitCost: 720, issued: 355, fundId: F_CAP, expense: TEACHING_MATERIALS },
    { item: 4, received: 120, unitCost: 350, issued: 104, fundId: F_CAP, expense: TEACHING_MATERIALS },
    { item: 5, received: 150, unitCost: 280, issued: 128, fundId: F_TUI, expense: ADMIN_EXPENSE },
  ]
  for (const plan of stockPlan) {
    await inventoryService.receiveStock({
      itemId: items[plan.item].id,
      movementDate: '2026-01-19',
      quantity: plan.received,
      unitCost: plan.unitCost,
      reference: 'Opening term stock',
      periodId: P1,
      fundId: plan.fundId,
      inventoryAccountId: INVENTORY_ACCT,
      creditAccountId: CREDITORS,
      recordedBy: STOREKEEPER,
    })
    await inventoryService.issueStock({
      itemId: items[plan.item].id,
      movementDate: '2026-07-31',
      quantity: plan.issued,
      unitCost: plan.unitCost,
      reference: 'Consumption to date',
      periodId: P2,
      fundId: plan.fundId,
      inventoryAccountId: INVENTORY_ACCT,
      expenseAccountId: plan.expense,
      recordedBy: STOREKEEPER,
    })
  }
  console.log(`  ${items.length} stock items, ${stockPlan.length * 2} movements (several now below reorder level)`)

  // --- Imprest and bank reconciliation ---------------------------------------
  console.log('Imprest and bank reconciliation...')
  const imprest = await bankingService.issueImprest({
    requestedBy: BURSAR,
    purpose: 'Term 2 games and drama festival travel to the county finals',
    amountRequested: 85_000,
    dateIssued: '2026-06-02',
    periodId: P2,
    fundId: F_TUI,
    cashAccountId: BANK,
    imprestControlAccountId: PETTY_CASH,
  })
  await bankingService.retireImprest(imprest.id, {
    retirementDate: '2026-06-19',
    periodId: P2,
    fundId: F_TUI,
    imprestControlAccountId: PETTY_CASH,
    cashAccountId: BANK,
    receiptsAttached: true,
    balanceReturned: 6_400,
    expenseLines: [
      { accountId: TRANSPORT_EXPENSE, amount: 52_000, description: 'Bus fuel and driver allowance' },
      { accountId: ADMIN_EXPENSE, amount: 26_600, description: 'Registration, meals and accommodation' },
    ],
    recordedBy: BURSAR,
  })

  // A second imprest issued but not yet retired — the outstanding-imprest
  // warning on the banking dashboard widget needs something to warn about.
  await bankingService.issueImprest({
    requestedBy: BURSAR,
    purpose: 'Term 3 KCSE registration logistics',
    amountRequested: 60_000,
    dateIssued: '2026-09-07',
    periodId: P3,
    fundId: F_TUI,
    cashAccountId: BANK,
    imprestControlAccountId: PETTY_CASH,
  })

  const bankAccounts = await bankingService.listAccounts()
  const reconciliation = await bankingService.createReconciliation({
    bankAccountId: bankAccounts[0].id,
    periodId: P2,
    statementDate: '2026-07-31',
    statementBalance: 2_480_000,
    bookBalance: 2_437_500,
    items: [
      { description: 'Cheque 004512 — Kilimani Hardware, not yet presented', amount: 38_000, itemType: 'outstanding_cheque' },
      { description: 'Fee banking of 31 July, credited 1 August', amount: 96_500, itemType: 'deposit_in_transit' },
      { description: 'Bank ledger fees and commissions', amount: 4_000, itemType: 'bank_charge' },
    ],
  })
  await bankingService.markReconciled(reconciliation.id, BURSAR)
  console.log('  1 imprest retired, 1 outstanding, 1 bank reconciliation completed')

  // --- Exams and results -----------------------------------------------------
  console.log('Grading scales, exams and results...')
  const kcseScale = await examsService.createScale({
    name: 'KCSE Grading Scale (8-4-4)',
    isDefault: true,
    bands: [
      { minMarks: 80, maxMarks: 100, grade: 'A', points: 12 },
      { minMarks: 75, maxMarks: 79, grade: 'A-', points: 11 },
      { minMarks: 70, maxMarks: 74, grade: 'B+', points: 10 },
      { minMarks: 65, maxMarks: 69, grade: 'B', points: 9 },
      { minMarks: 60, maxMarks: 64, grade: 'B-', points: 8 },
      { minMarks: 55, maxMarks: 59, grade: 'C+', points: 7 },
      { minMarks: 50, maxMarks: 54, grade: 'C', points: 6 },
      { minMarks: 45, maxMarks: 49, grade: 'C-', points: 5 },
      { minMarks: 40, maxMarks: 44, grade: 'D+', points: 4 },
      { minMarks: 35, maxMarks: 39, grade: 'D', points: 3 },
      { minMarks: 30, maxMarks: 34, grade: 'D-', points: 2 },
      { minMarks: 0, maxMarks: 29, grade: 'E', points: 1 },
    ],
  })

  // Proves the dual-mode design: same table, same lookup, CBC rubric bands.
  await examsService.createScale({
    name: 'CBC Competency Rubric',
    isDefault: false,
    bands: [
      { minMarks: 76, maxMarks: 100, grade: 'Exceeds Expectation', points: 4 },
      { minMarks: 51, maxMarks: 75, grade: 'Meets Expectation', points: 3 },
      { minMarks: 26, maxMarks: 50, grade: 'Approaching Expectation', points: 2 },
      { minMarks: 0, maxMarks: 25, grade: 'Below Expectation', points: 1 },
    ],
  })

  // A per-student ability offset so the same learner is consistently strong or
  // weak across subjects and terms — random marks per row would make every
  // report card statistically identical and the mean-score trend meaningless.
  const abilityByStudent = new Map(allStudents.map((s) => [s.id, randInt(-18, 18)]))

  const examPlan = [
    { name: 'Term 1 Opener Examination', periodId: P1, date: '2026-01-29' },
    { name: 'Term 1 End of Term Examination', periodId: P1, date: '2026-03-25' },
    { name: 'Term 2 Mid Term Examination', periodId: P2, date: '2026-06-10' },
    { name: 'Term 2 End of Term Examination', periodId: P2, date: '2026-07-30' },
  ]

  let examCount = 0
  let resultCount = 0
  for (const plan of examPlan) {
    for (const cls of classes) {
      const exam = await examsService.createExam({
        name: `${cls.name} — ${plan.name}`,
        periodId: plan.periodId,
        classId: cls.id,
        gradingScaleId: kcseScale.id,
        examDate: plan.date,
      })
      examCount++

      const codes = subjectsForClass(cls.level)
      const classStudents = allStudents.filter((s) => s.classId === cls.id)
      const results = []

      for (const student of classStudents) {
        const ability = abilityByStudent.get(student.id)!
        for (const code of codes) {
          // Sciences and maths sit a little lower than languages, which is the
          // familiar shape of a Kenyan secondary mark sheet.
          const subjectBias = ['MAT', 'PHY', 'CHE'].includes(code) ? -6 : ['ENG', 'KIS', 'CRE'].includes(code) ? 4 : 0
          const marks = Math.max(8, Math.min(98, 52 + ability + subjectBias + randInt(-10, 10)))
          results.push({
            examId: exam.id,
            studentId: student.id,
            subjectId: subjectByCode.get(code)!,
            marks,
            maxMarks: 100,
            enteredBy: TEACHER_USER,
          })
        }
      }
      // Chunked so a dropped connection costs one chunk rather than a whole
      // class's mark sheet.
      for (let offset = 0; offset < results.length; offset += 40) {
        const chunk = results.slice(offset, offset + 40)
        const written = await tolerate(`${cls.name} ${plan.name} results`, () => examsService.bulkRecordResults(chunk))
        if (written) resultCount += chunk.length
      }

      // Exam timetable for the end-of-term sittings only — an opener is done
      // in normal lesson slots, which is why not every exam has one.
      if (plan.name.includes('End of Term')) {
        for (const [i, code] of codes.entries()) {
          await examsService.addTimetableEntry({
            examId: exam.id,
            subjectId: subjectByCode.get(code)!,
            examDate: addDays(plan.date, Math.floor(i / 2)),
            startTime: i % 2 === 0 ? '08:30' : '11:00',
            endTime: i % 2 === 0 ? '10:30' : '13:00',
            venue: `${cls.name} Hall`,
          })
        }
      }
    }
  }
  console.log(`  2 grading scales, ${examCount} exams, ${resultCount} subject results`)

  // --- Attendance ------------------------------------------------------------
  console.log('Daily attendance register...')
  const attendanceDays = [...schoolDays(TERM_2.start, 18), ...schoolDays(TERM_3.start, 4)]
  let attendanceRows = 0
  for (const day of attendanceDays) {
    const records = allStudents.map((student) => ({
      studentId: student.id,
      attendanceDate: day,
      status: (chance(0.94) ? 'present' : chance(0.5) ? 'absent' : chance(0.5) ? 'late' : 'excused') as 'present' | 'absent' | 'late' | 'excused',
      recordedBy: TEACHER_USER,
    }))
    const written = await tolerate(`attendance for ${day}`, () => attendanceService.markBulk(records))
    if (written) attendanceRows += records.length
  }
  console.log(`  ${attendanceDays.length} school days, ${attendanceRows} attendance records`)

  // --- Conduct: rules, points, incidents -------------------------------------
  console.log('Student conduct...')
  const conductRules = []
  for (const r of [
    { code: 'MERIT-ACAD', description: 'Outstanding academic performance', points: 10 },
    { code: 'MERIT-HELP', description: 'Helping a fellow student or member of staff', points: 5 },
    { code: 'MERIT-LEAD', description: 'Leadership in a club, house or class role', points: 8 },
    { code: 'MERIT-SPORT', description: 'Representing the school in a competition', points: 12 },
    { code: 'DEM-LATE', description: 'Late arrival to class or assembly', points: -3 },
    { code: 'DEM-NOISE', description: 'Noise-making during preps', points: -4 },
    { code: 'DEM-UNIF', description: 'Improper school uniform', points: -2 },
    { code: 'DEM-ABSENT', description: 'Absconding lessons or duties', points: -10 },
  ]) {
    conductRules.push(await conductPointsService.createRule(r))
  }

  let awards = 0
  for (const student of allStudents) {
    for (let i = 0, target = randInt(1, 5); i < target; i++) {
      const periodId = chance(0.5) ? P2 : P3
      const ruleId = pick(conductRules).id
      const awarded = await tolerate(`conduct points for ${student.name}`, () =>
        conductPointsService.award({ studentId: student.id, periodId, ruleId, awardedBy: TEACHER_USER }),
      )
      if (awarded) awards++
    }
  }

  const incidents = [
    { severity: 'minor' as const, description: 'Found outside the classroom during a lesson without permission.', actionTaken: 'Verbal warning issued and the class teacher informed.' },
    { severity: 'moderate' as const, description: 'Repeated noise-making during evening preps despite prior warnings.', actionTaken: 'Two days of supervised manual work; parent contacted by phone.' },
    { severity: 'minor' as const, description: 'Reported to the parade in an incomplete school uniform.', actionTaken: 'Uniform corrected the same day; recorded for monitoring.' },
    { severity: 'major' as const, description: 'Left the school compound without a gate pass during afternoon lessons.', actionTaken: 'Parent summoned; referred to the Deputy Principal for a formal hearing.' },
    { severity: 'moderate' as const, description: 'Damage to a laboratory stool during a practical session.', actionTaken: 'Restitution agreed with the parent; counselled on laboratory conduct.' },
  ]
  for (const [i, incident] of incidents.entries()) {
    await disciplineService.create({
      studentId: allStudents[i * 7].id,
      incidentDate: addDays(TERM_2.start, randInt(10, 60)),
      description: incident.description,
      actionTaken: incident.actionTaken,
      severity: incident.severity,
      recordedBy: TEACHER_USER,
    })
  }
  console.log(`  ${conductRules.length} conduct rules, ${awards} point awards, ${incidents.length} discipline incidents`)

  // --- Boarding --------------------------------------------------------------
  console.log('Dormitories and boarding...')
  const boarders = allStudents.filter((s) => s.boarding === 'boarder')
  const dormitories = [
    await boardingService.createDormitory({ name: 'Kirinyaga House', gender: 'boys', capacity: 40, wardenStaffId: staffByStaffNo.get('BOM/S06') }),
    await boardingService.createDormitory({ name: 'Elgon House', gender: 'boys', capacity: 40, wardenStaffId: staffByStaffNo.get('TSC/001') }),
    await boardingService.createDormitory({ name: 'Nyandarua House', gender: 'girls', capacity: 40, wardenStaffId: staffByStaffNo.get('BOM/S04') }),
    await boardingService.createDormitory({ name: 'Menengai House', gender: 'girls', capacity: 40, wardenStaffId: staffByStaffNo.get('TSC/004') }),
  ]

  const boysDorms = [dormitories[0], dormitories[1]]
  const girlsDorms = [dormitories[2], dormitories[3]]
  const bedCounters = new Map<number, number>(dormitories.map((d) => [d.id, 1]))
  const allocatedBoarders: typeof boarders = []

  for (const student of boarders) {
    const options = student.gender === 'male' ? boysDorms : girlsDorms
    const dorm = options[allocatedBoarders.filter((s) => s.gender === student.gender).length % options.length]
    const bedNumber = bedCounters.get(dorm.id)!
    bedCounters.set(dorm.id, bedNumber + 1)

    await boardingService.allocateBed({
      studentId: student.id,
      dormitoryId: dorm.id,
      bedNumber: `B${String(bedNumber).padStart(3, '0')}`,
      periodId: P3,
      allocatedDate: TERM_3.start,
    })
    allocatedBoarders.push(student)
  }

  let boardingRows = 0
  for (const night of schoolDays(TERM_3.start, 3)) {
    const records = allocatedBoarders.map((student) => ({
      studentId: student.id,
      attendanceDate: night,
      status: (chance(0.96) ? 'present' : chance(0.5) ? 'absent' : 'on_leave') as 'present' | 'absent' | 'on_leave',
      recordedBy: BOARDING_OFFICER,
    }))
    await boardingService.markAttendanceBulk(records)
    boardingRows += records.length
  }
  console.log(`  ${dormitories.length} dormitories, ${allocatedBoarders.length} beds allocated, ${boardingRows} nightly roll-call records`)

  // --- Transport -------------------------------------------------------------
  console.log('Transport routes...')
  const routePlan = [
    { routeName: 'Route A — Kilimani / Kawangware', vehicleRegistration: 'KDA 331P', driverName: 'Simon Kariuki', capacity: 45, feeAmount: 6_000, stops: ['Kilimani Stage', 'Yaya Centre', 'Kawangware 46', 'Dagoretti Corner'] },
    { routeName: 'Route B — Langata / Karen', vehicleRegistration: 'KCX 774T', driverName: 'Boniface Otieno', capacity: 40, feeAmount: 7_500, stops: ['Langata Shopping Centre', 'Bomas', 'Karen Roundabout'] },
  ]
  const dayScholars = allStudents.filter((s) => s.boarding === 'day')
  let transportAllocations = 0

  for (const [index, plan] of routePlan.entries()) {
    const route = await transportService.createRoute({
      routeName: plan.routeName,
      vehicleRegistration: plan.vehicleRegistration,
      driverName: plan.driverName,
      driverPhone: `07${randInt(10, 99)}${randInt(100000, 999999)}`,
      capacity: plan.capacity,
      feeAmount: plan.feeAmount,
    })
    const stops = []
    for (const [order, stopName] of plan.stops.entries()) {
      stops.push(await transportService.addStop({ routeId: route.id, stopName, stopOrder: order, pickupTime: `0${6 + Math.floor(order / 2)}:${order % 2 === 0 ? '00' : '30'}` }))
    }

    for (const student of dayScholars.filter((_, i) => i % routePlan.length === index)) {
      await transportService.allocate({ studentId: student.id, routeId: route.id, stopId: pick(stops).id, periodId: P3, startDate: TERM_3.start })
      transportAllocations++
    }
  }
  console.log(`  ${routePlan.length} routes, ${transportAllocations} student allocations`)

  // --- Health ----------------------------------------------------------------
  console.log('Health records...')
  const conditions = [
    { condition: 'Asthma', severity: 'moderate' as const, notes: 'Carries a salbutamol inhaler; avoid dusty duties.' },
    { condition: 'Peanut allergy', severity: 'severe' as const, notes: 'Kitchen and matron notified. Antihistamines held at the clinic.' },
    { condition: 'Sickle cell trait', severity: 'mild' as const, notes: 'Ensure adequate hydration during games.' },
    { condition: 'Epilepsy', severity: 'moderate' as const, notes: 'On regular medication; dormitory captain briefed.' },
  ]
  for (const [i, c] of conditions.entries()) {
    await healthService.createCondition({
      studentId: allStudents[i * 9].id,
      condition: c.condition,
      severity: c.severity,
      diagnosedDate: `${2020 + i}-0${randInt(1, 9)}-1${randInt(0, 9)}`,
      notes: c.notes,
      recordedBy: NURSE,
    })
  }

  const visits = [
    { complaint: 'Headache and mild fever since morning parade.', diagnosis: 'Suspected malaria', treatment: 'Paracetamol administered; blood slide requested.', referred: false },
    { complaint: 'Sprained ankle during a games session.', diagnosis: 'Grade 1 ankle sprain', treatment: 'Cold compress, crepe bandage, excused from games for one week.', referred: false },
    { complaint: 'Persistent abdominal pain over three days.', diagnosis: 'For further investigation', treatment: 'Initial analgesia given.', referred: true },
    { complaint: 'Sore throat and difficulty swallowing.', diagnosis: 'Tonsillitis', treatment: 'Amoxicillin course started; warm saline gargle advised.', referred: false },
    { complaint: 'Cut to the left hand from a laboratory glass breakage.', diagnosis: 'Superficial laceration', treatment: 'Cleaned and dressed; tetanus status confirmed current.', referred: false },
    { complaint: 'Fainted during morning assembly.', diagnosis: 'Suspected anaemia', treatment: 'Rested at the clinic; parent contacted.', referred: true },
  ]
  for (const [i, v] of visits.entries()) {
    const visit = await healthService.createVisit({
      studentId: allStudents[i * 6].id,
      visitDate: addDays(TERM_3.start, randInt(0, 3)),
      presentingComplaint: v.complaint,
      diagnosis: v.diagnosis,
      treatmentGiven: v.treatment,
      referredToHospital: v.referred,
      referralNotes: v.referred ? 'Referred to Kilimani Sub-County Hospital; guardian notified.' : undefined,
      attendedBy: NURSE,
    })
    await healthService.recordMedication({
      studentId: allStudents[i * 6].id,
      clinicVisitId: visit.id,
      medicationName: pick(['Paracetamol 500mg', 'Amoxicillin 250mg', 'Ibuprofen 400mg', 'Oral Rehydration Salts']),
      dosage: pick(['1 tablet twice daily', '2 tablets three times daily', '1 sachet after meals']),
      administeredBy: NURSE,
    })
  }
  console.log(`  ${conditions.length} chronic conditions, ${visits.length} clinic visits (2 referred to hospital)`)

  // --- Library ---------------------------------------------------------------
  console.log('Library...')
  const books = []
  for (const b of [
    { isbn: '9789966493217', title: 'Secondary Mathematics Book 4', author: 'KLB', category: 'Mathematics', totalCopies: 60 },
    { isbn: '9789966251534', title: 'Head of State', author: 'Andrew Ekwuru', category: 'Set Text', totalCopies: 45 },
    { isbn: '9789966560421', title: 'Fathers of Nations', author: 'Paul B. Vitta', category: 'Set Text', totalCopies: 50 },
    { isbn: '9789966101112', title: 'A Doll’s House', author: 'Henrik Ibsen', category: 'Set Text', totalCopies: 48 },
    { isbn: '9789966257788', title: 'Secondary Chemistry Book 3', author: 'KLB', category: 'Sciences', totalCopies: 40 },
    { isbn: '9789966339900', title: 'Golden Tips Biology', author: 'Longhorn', category: 'Sciences', totalCopies: 35 },
    { isbn: '9789966447711', title: 'Kamusi ya Kiswahili Sanifu', author: 'TUKI', category: 'Kiswahili', totalCopies: 30 },
    { isbn: '9789966998822', title: 'Certificate Geography Form 3', author: 'KLB', category: 'Humanities', totalCopies: 32 },
  ]) {
    books.push(await libraryService.createBook(b))
  }

  let borrowings = 0
  let overdue = 0
  for (let i = 0; i < 26; i++) {
    const student = allStudents[(i * 3) % allStudents.length]
    const book = books[i % books.length]
    // A third of the loans are already past their due date, so the overdue
    // widget and the automatic fine calculation both have real input.
    const isOverdue = i % 3 === 0
    const borrowedDate = isOverdue ? addDays(TERM_3.start, -20) : addDays(TERM_3.start, 1)
    const dueDate = isOverdue ? addDays(TERM_3.start, -6) : addDays(TERM_3.start, 15)

    const borrowing = await libraryService.borrow({
      bookId: book.id,
      studentId: student.id,
      borrowedDate,
      dueDate,
      issuedBy: LIBRARIAN,
    })
    borrowings++
    if (isOverdue) overdue++

    // Some loans come back; the rest stay out on loan.
    if (i % 4 === 1) {
      await libraryService.returnBook(borrowing.id, { returnedDate: addDays(TERM_3.start, 2), returnedTo: LIBRARIAN, lost: false })
    }
  }
  console.log(`  ${books.length} titles, ${borrowings} borrowings (${overdue} overdue)`)

  // --- Clubs and competitions ------------------------------------------------
  console.log('Clubs and competitions...')
  const clubPlan = [
    { name: 'Drama Club', category: 'club' as const, patron: 'TSC/002' },
    { name: 'Science Congress', category: 'society' as const, patron: 'TSC/005' },
    { name: 'Football (Boys)', category: 'sport' as const, patron: 'TSC/001' },
    { name: 'Volleyball (Girls)', category: 'sport' as const, patron: 'TSC/004' },
    { name: 'Christian Union', category: 'society' as const, patron: 'TSC/006' },
    { name: 'Debate & Journalism Club', category: 'club' as const, patron: 'BOM/T03' },
  ]
  const clubs = []
  for (const c of clubPlan) {
    clubs.push(await clubsService.createClub({
      name: c.name,
      category: c.category,
      patronStaffId: staffByStaffNo.get(c.patron),
      description: `${c.name} meets every Wednesday afternoon during the co-curricular slot.`,
    }))
  }

  let memberships = 0
  for (const student of allStudents) {
    for (const club of [clubs[randInt(0, clubs.length - 1)], clubs[randInt(0, clubs.length - 1)]]) {
      try {
        await clubsService.joinClub({
          clubId: club.id,
          studentId: student.id,
          joinedDate: TERM_1.start,
          role: chance(0.1) ? pick(['Chairperson', 'Secretary', 'Treasurer']) : 'Member',
        })
        memberships++
      } catch {
        // The same student drawn twice for one club — the service rejects the
        // duplicate membership, which is the behaviour we want to keep.
      }
    }
  }

  const competitionPlan = [
    { name: 'Sub-County Drama Festival', clubIndex: 0, level: 'zonal' as const, date: '2026-05-20', venue: 'Dagoretti High School' },
    { name: 'County Science Congress', clubIndex: 1, level: 'county' as const, date: '2026-06-17', venue: 'Nairobi School' },
    { name: 'Regional Term 2 Ball Games', clubIndex: 2, level: 'regional' as const, date: '2026-07-08', venue: 'Nyayo National Stadium' },
    { name: 'National Drama Festival', clubIndex: 0, level: 'national' as const, date: '2026-04-14', venue: 'Nakuru' },
  ]
  let participants = 0
  for (const c of competitionPlan) {
    const competition = await clubsService.createCompetition({
      name: c.name,
      clubId: clubs[c.clubIndex].id,
      level: c.level,
      competitionDate: c.date,
      venue: c.venue,
    })
    for (let i = 0; i < 6; i++) {
      await clubsService.addParticipant({
        competitionId: competition.id,
        studentId: allStudents[(participants * 5 + 3) % allStudents.length].id,
        result: pick(['1st', '2nd', '3rd', 'Participant', 'Finalist']),
        achievement: chance(0.35) ? 'Qualified for the next level' : undefined,
      })
      participants++
    }
  }
  console.log(`  ${clubs.length} clubs, ${memberships} memberships, ${competitionPlan.length} competitions, ${participants} participants`)

  // --- Notices ---------------------------------------------------------------
  console.log('Notices...')
  const noticePlan = [
    { title: 'Term 3 Opening — 31 August 2026', body: 'All learners report on Monday 31 August 2026 by 4.00pm. Boarders should carry the full list of personal effects circulated last term. Fee balances for Term 2 must be cleared before reporting.', audience: 'all' as const },
    { title: 'Form 4 KCSE Registration', body: 'Form 4 candidates must confirm their KCSE registration details at the Deputy Principal’s office before Friday 11 September 2026. Corrections cannot be made after the KNEC deadline.', audience: 'all' as const },
    { title: 'Parents’ Academic Day — 26 September 2026', body: 'Parents and guardians are invited to the Term 3 Academic Day on Saturday 26 September 2026 from 9.00am. Class teachers will issue Term 2 report forms and discuss individual progress.', audience: 'parents' as const },
    { title: 'Staff Briefing — Monday 7 September', body: 'All teaching staff to attend a briefing in the staffroom at 4.15pm on the Term 3 examination calendar and syllabus coverage returns.', audience: 'staff' as const },
    { title: 'Water Rationing Advisory', body: 'Following the county water supply interruption, dormitories will have running water between 5.00am–8.00am and 5.00pm–9.00pm until further notice.', audience: 'all' as const },
  ]
  for (const n of noticePlan) {
    await noticesService.create({ ...n, publishedBy: PRINCIPAL, publishNow: true })
  }
  console.log(`  ${noticePlan.length} notices published`)

  // --- Verification ----------------------------------------------------------
  console.log('\nVerifying the ledger...')
  const { journalService } = await import('../modules/journal/journal.service.js')
  const trialBalance = await journalService.trialBalance('2026-12-31')
  console.log(`  Total debit:  KES ${trialBalance.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`)
  console.log(`  Total credit: KES ${trialBalance.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`)
  console.log(`  Balanced: ${trialBalance.isBalanced ? 'YES' : 'NO — this is a bug, please report it'}`)

  if (skipped.length > 0) {
    console.log(`\n${skipped.length} record(s) were skipped after a database error — the dataset is complete apart from these:`)
    for (const entry of skipped.slice(0, 15)) console.log(`  - ${entry}`)
    if (skipped.length > 15) console.log(`  ...and ${skipped.length - 15} more`)
    console.log('Re-run with --reset for a clean full dataset.')
  }

  console.log('\n=== Done. Kilimani Secondary School is open for business. ===\n')
  process.exit(trialBalance.isBalanced ? 0 : 1)
}

main().catch((err) => {
  console.error('\nSeeding failed:', err)
  process.exit(1)
})
