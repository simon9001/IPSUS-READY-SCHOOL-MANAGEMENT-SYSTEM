import { assetsService } from '../../modules/assets/assets.service.js'
import { inventoryService } from '../../modules/inventory/inventory.service.js'
import { bankingService } from '../../modules/banking/banking.service.js'
import { TERM_1 } from './data.js'
import type { ReferenceDataSeed } from './reference.js'

export async function seedAssetsAndStores({
  BANK,
  PETTY_CASH,
  INVENTORY_ACCT,
  PPE,
  ACCUM_DEP,
  CREDITORS,
  TEACHING_MATERIALS,
  FOOD,
  TRANSPORT_EXPENSE,
  DEPRECIATION,
  ADMIN_EXPENSE,
  F_CAP,
  F_TUI,
  F_BRD,
  F_DEV,
  P1,
  P2,
  P3,
  BURSAR,
  STOREKEEPER,
}: ReferenceDataSeed) {
  // --- Fixed assets ----------------------------------------------------------
  console.log('Fixed assets and depreciation...')
  const categories = {
    vehicles: await assetsService.createCategory({
      name: 'Motor Vehicles',
      defaultUsefulLifeYears: 8,
      depreciationMethod: 'straight_line',
      assetAccountId: PPE,
      depreciationExpenseAccountId: DEPRECIATION,
      accumulatedDepreciationAccountId: ACCUM_DEP,
    }),
    ict: await assetsService.createCategory({
      name: 'ICT Equipment',
      defaultUsefulLifeYears: 4,
      depreciationMethod: 'straight_line',
      assetAccountId: PPE,
      depreciationExpenseAccountId: DEPRECIATION,
      accumulatedDepreciationAccountId: ACCUM_DEP,
    }),
    furniture: await assetsService.createCategory({
      name: 'Furniture and Fittings',
      defaultUsefulLifeYears: 10,
      depreciationMethod: 'straight_line',
      assetAccountId: PPE,
      depreciationExpenseAccountId: DEPRECIATION,
      accumulatedDepreciationAccountId: ACCUM_DEP,
    }),
    lab: await assetsService.createCategory({
      name: 'Laboratory Equipment',
      defaultUsefulLifeYears: 6,
      depreciationMethod: 'straight_line',
      assetAccountId: PPE,
      depreciationExpenseAccountId: DEPRECIATION,
      accumulatedDepreciationAccountId: ACCUM_DEP,
    }),
  }

  const assetList = [
    {
      tag: 'KSS/VEH/001',
      category: categories.vehicles.id,
      name: 'School Bus - KDA 331P',
      cost: 6_800_000,
      fundId: F_DEV,
      location: 'Main gate',
      date: '2026-01-15',
    },
    {
      tag: 'KSS/ICT/001',
      category: categories.ict.id,
      name: 'Computer Lab - 25 desktop units',
      cost: 1_250_000,
      fundId: F_CAP,
      location: 'Computer Laboratory',
      date: '2026-02-03',
    },
    {
      tag: 'KSS/ICT/002',
      category: categories.ict.id,
      name: 'Staffroom printers and projectors',
      cost: 320_000,
      fundId: F_TUI,
      location: 'Staffroom',
      date: '2026-02-20',
    },
    {
      tag: 'KSS/FUR/001',
      category: categories.furniture.id,
      name: 'Classroom desks and chairs - 240 sets',
      cost: 960_000,
      fundId: F_DEV,
      location: 'Classroom block',
      date: '2026-01-22',
    },
    {
      tag: 'KSS/FUR/002',
      category: categories.furniture.id,
      name: 'Dormitory double-decker beds - 80 units',
      cost: 720_000,
      fundId: F_BRD,
      location: 'Dormitories',
      date: '2026-04-30',
    },
    {
      tag: 'KSS/LAB/001',
      category: categories.lab.id,
      name: 'Chemistry laboratory apparatus',
      cost: 480_000,
      fundId: F_CAP,
      location: 'Chemistry Laboratory',
      date: '2026-05-06',
    },
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
}

export type AssetsAndStoresSeed = Awaited<ReturnType<typeof seedAssetsAndStores>>
