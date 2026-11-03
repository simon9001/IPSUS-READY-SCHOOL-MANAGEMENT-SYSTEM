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

import { like, sql } from 'drizzle-orm'
import { db } from '../client.js'
import { users } from '../schema/index.js'

// ---------------------------------------------------------------------------
// Deterministic pseudo-randomness
// ---------------------------------------------------------------------------
// A fixed-seed generator, not Math.random(), so two runs against a fresh
// database produce byte-identical data. That matters when you are comparing a
// report before and after a code change and need the difference to be the
// change rather than the dice.

export let rngState = 20260101
export const rand = () => {
  rngState = (rngState * 1664525 + 1013904223) % 4294967296
  return rngState / 4294967296
}
export const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))
export const pick = <T>(items: readonly T[]): T => items[Math.floor(rand() * items.length)]
export const chance = (probability: number) => rand() < probability

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

export const skipped: string[] = []

export async function tolerate<T>(label: string, work: () => Promise<T>): Promise<T | null> {
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

export const TERM_1 = { start: '2026-01-06', end: '2026-04-03' }
export const TERM_2 = { start: '2026-04-27', end: '2026-08-07' }
export const TERM_3 = { start: '2026-08-31', end: '2026-11-13' }

/** School days (Mon–Fri) from `start`, walking forward, capped at `count`. */
export function schoolDays(start: string, count: number): string[] {
  const days: string[] = []
  const cursor = new Date(`${start}T00:00:00Z`)
  while (days.length < count) {
    const weekday = cursor.getUTCDay()
    if (weekday !== 0 && weekday !== 6) days.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}

export const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

export const FIRST_NAMES_M = [
  'Brian',
  'Kevin',
  'Dennis',
  'Collins',
  'Victor',
  'Elijah',
  'Fredrick',
  'Isaac',
  'Nicholas',
  'Antony',
  'Emmanuel',
  'Gideon',
  'Bernard',
  'Cyrus',
  'Duncan',
  'Erick',
]
export const FIRST_NAMES_F = [
  'Mercy',
  'Faith',
  'Lydia',
  'Purity',
  'Winnie',
  'Sharon',
  'Beatrice',
  'Caroline',
  'Doreen',
  'Emily',
  'Gladys',
  'Hellen',
  'Irene',
  'Joyce',
  'Lilian',
  'Naomi',
]
export const SURNAMES = [
  'Kamau',
  'Ochieng',
  'Wafula',
  'Kiplagat',
  'Mutiso',
  'Njoroge',
  'Omondi',
  'Chebet',
  'Wanyama',
  'Muriuki',
  'Achieng',
  'Barasa',
  'Kirui',
  'Maina',
  'Nyaga',
  'Owino',
  'Simiyu',
  'Wekesa',
  'Gitonga',
  'Kilonzo',
]

export const SUBJECTS = [
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
export const STRANDS: Record<string, string[]> = {
  MAT: ['Numbers', 'Algebra', 'Measurement', 'Geometry', 'Data Handling'],
  BIO: ['Living Things', 'Nutrition', 'Transport in Organisms', 'Reproduction'],
}

export const TEACHERS = [
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
export const BOM_EMPLOYEES = [
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

export const NON_TEACHING_STAFF = [
  { staffNo: 'BOM/S01', fullName: 'Grace Mwikali' },
  { staffNo: 'BOM/S02', fullName: 'Julius Ndegwa' },
  { staffNo: 'BOM/S03', fullName: 'Patrick Wafula' },
  { staffNo: 'BOM/S04', fullName: 'Alice Nduta' },
  { staffNo: 'BOM/S05', fullName: 'Simon Kariuki' },
  { staffNo: 'BOM/S06', fullName: 'Michael Ouma' },
]

export const LESSON_PERIODS = [
  { name: 'Period 1', startTime: '08:00', endTime: '08:40', sortOrder: 1 },
  { name: 'Period 2', startTime: '08:40', endTime: '09:20', sortOrder: 2 },
  { name: 'Period 3', startTime: '09:20', endTime: '10:00', sortOrder: 3 },
  { name: 'Period 4', startTime: '10:20', endTime: '11:00', sortOrder: 4 },
  { name: 'Period 5', startTime: '11:00', endTime: '11:40', sortOrder: 5 },
  { name: 'Period 6', startTime: '11:40', endTime: '12:20', sortOrder: 6 },
  { name: 'Period 7', startTime: '14:00', endTime: '14:40', sortOrder: 7 },
  { name: 'Period 8', startTime: '14:40', endTime: '15:20', sortOrder: 8 },
]

export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const

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
export const SCHOOL_DATA_TABLES = [
  'admissions',
  'asset_categories',
  'asset_disposals',
  'assets',
  'attendance_records',
  'bank_accounts',
  'bank_reconciliation_items',
  'bank_reconciliations',
  'bed_allocations',
  'boarding_attendance',
  'book_borrowings',
  'budget_lines',
  'budgets',
  'bus_routes',
  'class_subjects',
  'classes',
  'clinic_visits',
  'club_memberships',
  'clubs',
  'competition_participants',
  'competitions',
  'compliance_reports',
  'conduct_point_rules',
  'conduct_points',
  'counseling_sessions',
  'depreciation_entries',
  'disciplinary_cases',
  'discipline_records',
  'document_templates',
  'dormitories',
  'employees',
  'exam_results',
  'exam_strand_results',
  'exam_timetable_entries',
  'exams',
  'fee_invoice_items',
  'fee_invoices',
  'fee_payment_allocations',
  'fee_payments',
  'fee_structure_items',
  'fee_structures',
  'generated_documents',
  'goods_received_notes',
  'grading_bands',
  'grading_scales',
  'grant_disbursements',
  'grant_types',
  'grn_items',
  'guardian_students',
  'imprest_requests',
  'imprest_retirements',
  'inventory_items',
  'journal_entries',
  'journal_lines',
  'leave_requests',
  'leave_types',
  'lesson_periods',
  'library_books',
  'medical_conditions',
  'medication_administrations',
  'notices',
  'notification_templates',
  'notifications',
  'payroll_runs',
  'payslips',
  'promotions',
  'purchase_order_items',
  'purchase_orders',
  'purchase_requisitions',
  'requisition_items',
  'route_stops',
  'salary_components',
  'staff',
  'staff_appraisals',
  'staff_contracts',
  'staff_disciplinary_records',
  'stock_movements',
  'streams',
  'student_transport_allocations',
  'students',
  'subject_strands',
  'subjects',
  'supplier_invoices',
  'supplier_payments',
  'suppliers',
  'teacher_assignments',
  'teachers',
  'timetable_entries',
]

export async function resetSchoolData() {
  console.log('Clearing existing school data...')
  const list = SCHOOL_DATA_TABLES.map((t) => `"${t}"`).join(', ')
  await db.execute(sql.raw(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`))

  // The parent logins this script creates live in `users`, which is not
  // truncated — remove just those, and let the user_roles FK cascade.
  await db.delete(users).where(like(users.email, 'parent%@school.local'))
  console.log(`  ${SCHOOL_DATA_TABLES.length} tables truncated, generated parent logins removed`)
}

// ---------------------------------------------------------------------------
