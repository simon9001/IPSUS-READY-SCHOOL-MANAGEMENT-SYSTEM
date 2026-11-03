import { db } from '../client.js'
import { students } from '../schema/index.js'
import { skipped, resetSchoolData } from './data.js'
import { seedReferenceData } from './reference.js'
import { seedPeople } from './people.js'
import { seedAcademics } from './academics.js'
import { seedFinance } from './finance.js'
import { seedProcurementAndPayroll } from './procurement-payroll.js'
import { seedAssetsAndStores } from './stores.js'
import { seedAssessment } from './assessment.js'
import { seedWelfare } from './welfare.js'
import { seedActivities } from './activities.js'

export async function seedSchoolData({ reset = false }: { reset?: boolean } = {}): Promise<{ balanced: boolean }> {
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
      throw new Error('Seeding stopped: see the message above')
    }
  }

  const reference = await seedReferenceData()
  const people = await seedPeople()
  const academics = await seedAcademics({ ...reference, ...people })
  await seedFinance({ ...reference, ...people, ...academics })
  await seedProcurementAndPayroll({ ...reference, ...people, ...academics })
  await seedAssetsAndStores({ ...reference, ...people, ...academics })
  await seedAssessment({ ...reference, ...people, ...academics })
  await seedWelfare({ ...reference, ...people, ...academics })
  await seedActivities({ ...reference, ...people, ...academics })

  // --- Verification ----------------------------------------------------------
  console.log('\nVerifying the ledger...')
  const { journalService } = await import('../../modules/journal/journal.service.js')
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
  return { balanced: trialBalance.isBalanced }
}
