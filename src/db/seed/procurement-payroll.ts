import { procurementService } from '../../modules/procurement/procurement.service.js'
import { procurementRepository } from '../../modules/procurement/procurement.repository.js'
import { payrollService } from '../../modules/payroll/payroll.service.js'
import { randInt, TERM_1, TERM_2, addDays, BOM_EMPLOYEES } from './data.js'
import type { ReferenceDataSeed } from './reference.js'

export async function seedProcurementAndPayroll({
  BANK,
  CREDITORS,
  PAYE,
  NSSF,
  SHIF,
  SALARIES,
  TEACHING_MATERIALS,
  FOOD,
  REPAIRS,
  F_CAP,
  F_TUI,
  F_BRD,
  F_DEV,
  P1,
  P2,
  P3,
  PRINCIPAL,
  BURSAR,
  PROCUREMENT,
  STOREKEEPER,
  PAYROLL_OFFICER,
}: ReferenceDataSeed) {
  // --- Procurement -----------------------------------------------------------
  console.log('Procurement chain...')
  const suppliers = []
  for (const s of [
    { name: 'Nakuru Cereals & Produce Ltd', kraPin: 'P051234567A', contactPerson: 'Joseph Maina', phone: '0722100200' },
    { name: 'Text Book Centre', kraPin: 'P051987654B', contactPerson: 'Anne Kilonzo', phone: '0733400500' },
    { name: 'Kilimani Hardware Supplies', kraPin: 'P051555444C', contactPerson: 'Ali Hassan', phone: '0711900800' },
  ]) {
    suppliers.push(
      await procurementService.createSupplier({ ...s, bankName: 'Equity Bank', bankAccountNo: String(randInt(1000000000, 1999999999)) }),
    )
  }

  const procurementRuns = [
    {
      supplier: 0,
      department: 'Kitchen / Boarding',
      account: FOOD,
      fundId: F_BRD,
      description: 'Maize (90kg bags)',
      quantity: 120,
      unitCost: 4_800,
      date: '2026-01-20',
      pay: true,
    },
    {
      supplier: 1,
      department: 'Academics',
      account: TEACHING_MATERIALS,
      fundId: F_CAP,
      description: 'Form 1 textbook set',
      quantity: 60,
      unitCost: 3_200,
      date: '2026-02-10',
      pay: true,
    },
    {
      supplier: 2,
      department: 'Maintenance',
      account: REPAIRS,
      fundId: F_DEV,
      description: 'Roofing sheets and timber',
      quantity: 40,
      unitCost: 2_750,
      date: '2026-05-18',
      pay: true,
    },
    // Left unpaid on purpose: gives the Procurement dashboard widget and the
    // Principal's approval queue something real to show.
    {
      supplier: 0,
      department: 'Kitchen / Boarding',
      account: FOOD,
      fundId: F_BRD,
      description: 'Beans (90kg bags)',
      quantity: 45,
      unitCost: 9_500,
      date: '2026-09-03',
      pay: false,
    },
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
    await procurementRepository.updateRequisitionStatus(requisition.id, 'approved', { approvedBy: PRINCIPAL, approvedAt: new Date() })

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
    await payrollService.addSalaryComponent(employee.id, {
      componentType: 'basic',
      name: 'Basic Salary',
      amount: e.basic,
      isPercentageOfBasic: false,
    })
    await payrollService.addSalaryComponent(employee.id, {
      componentType: 'allowance',
      name: 'House Allowance',
      amount: e.houseAllowance,
      isPercentageOfBasic: false,
    })
    await payrollService.addSalaryComponent(employee.id, {
      componentType: 'allowance',
      name: 'Responsibility Allowance',
      amount: 5,
      isPercentageOfBasic: true,
    })
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
}

export type ProcurementAndPayrollSeed = Awaited<ReturnType<typeof seedProcurementAndPayroll>>
