import { db } from '../client.js'
import { accounts, funds, fiscalPeriods, users } from '../schema/index.js'

export async function seedReferenceData() {
  // --- Reference lookups -----------------------------------------------------
  const accountRows = await db.select().from(accounts)
  const fundRows = await db.select().from(funds)
  const periodRows = await db.select().from(fiscalPeriods)

  if (accountRows.length === 0 || fundRows.length === 0 || periodRows.length === 0) {
    console.error('Chart of accounts, funds, or fiscal periods are missing. Run `pnpm db:seed` first.')
    throw new Error('Seeding stopped: see the message above')
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

  return {
    BANK,
    CAPITATION_BANK,
    PETTY_CASH,
    FEE_DEBTORS,
    INVENTORY_ACCT,
    PPE,
    ACCUM_DEP,
    CREDITORS,
    PAYE,
    NSSF,
    SHIF,
    TUITION_INCOME,
    BOARDING_INCOME,
    ACTIVITY_INCOME,
    CAPITATION_INCOME,
    SALARIES,
    TEACHING_MATERIALS,
    FOOD,
    UTILITIES,
    REPAIRS,
    TRANSPORT_EXPENSE,
    MEDICAL,
    DEPRECIATION,
    ADMIN_EXPENSE,
    F_CAP,
    F_TUI,
    F_BRD,
    F_DEV,
    F_PTA,
    P1,
    P2,
    P3,
    PRINCIPAL,
    BURSAR,
    CLERK,
    PROCUREMENT,
    STOREKEEPER,
    PAYROLL_OFFICER,
    TEACHER_USER,
    NURSE,
    LIBRARIAN,
    BOARDING_OFFICER,
  }
}

export type ReferenceDataSeed = Awaited<ReturnType<typeof seedReferenceData>>
