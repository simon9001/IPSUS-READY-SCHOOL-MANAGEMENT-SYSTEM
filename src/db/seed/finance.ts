import { feesService } from '../../modules/fees/fees.service.js'
import { grantsService } from '../../modules/grants/grants.service.js'
import { budgetsService } from '../../modules/budgets/budgets.service.js'
import { budgetsRepository } from '../../modules/budgets/budgets.repository.js'
import { bankingService } from '../../modules/banking/banking.service.js'
import { randInt, pick, chance, tolerate, TERM_1, TERM_2, TERM_3, addDays } from './data.js'
import type { ReferenceDataSeed } from './reference.js'
import type { PeopleSeed } from './people.js'

export async function seedFinance({
  BANK,
  CAPITATION_BANK,
  FEE_DEBTORS,
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
  classes,
  allStudents,
}: ReferenceDataSeed & PeopleSeed) {
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
  // Repository, not service: without db:seed-demo-users every actor is the admin,
  // and the service would rightly refuse a creator approving their own budget.
  await budgetsRepository.approve(budget.id, PRINCIPAL)
  console.log(`  Budget "${budget.name}" approved`)

  // --- Bank accounts ---------------------------------------------------------
  console.log('Bank accounts...')
  await bankingService.createAccount({
    accountId: BANK,
    fundId: F_TUI,
    bankName: 'Kenya Commercial Bank',
    accountNumber: '1102938475',
    branch: 'Kilimani',
  })
  await bankingService.createAccount({
    accountId: CAPITATION_BANK,
    fundId: F_CAP,
    bankName: 'Kenya Commercial Bank',
    accountNumber: '1102938476',
    branch: 'Kilimani',
  })

  // --- Government capitation -------------------------------------------------
  console.log('FDSE capitation...')
  const capitationType = await grantsService.createType({
    name: 'Free Day Secondary Education (FDSE) Capitation',
    fundId: F_CAP,
    revenueAccountId: CAPITATION_INCOME,
    conditionsDescription:
      'Disbursed per enrolled learner per MoE guidelines; spend restricted to tuition and approved operational voteheads.',
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
      notes: t.conditionsMet
        ? 'Enrolment return accepted by the sub-county director.'
        : 'Awaiting acceptance of the Term 3 enrolment return.',
      recordedBy: BURSAR,
    })
  }
  console.log(`  3 tranches totalling KES ${annualCapitation.toLocaleString()} (Term 3 held as deferred income)`)

  // --- Fee structures, invoices and receipts ---------------------------------
  console.log('Fee structures, invoices and receipts...')
  const feeStructureFor = new Map<string, number>()

  for (const cls of classes) {
    for (const boarding of ['day', 'boarder'] as const) {
      for (const [term, periodId] of [
        [1, P1],
        [2, P2],
        [3, P3],
      ] as const) {
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

  for (const [term, periodId, invoiceDate] of [
    [1, P1, TERM_1.start],
    [2, P2, TERM_2.start],
    [3, P3, TERM_3.start],
  ] as const) {
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
}

export type FinanceSeed = Awaited<ReturnType<typeof seedFinance>>
