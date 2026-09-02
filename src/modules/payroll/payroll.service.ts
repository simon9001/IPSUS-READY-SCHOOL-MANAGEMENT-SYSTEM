import { payrollRepository } from './payroll.repository.js'
import { journalService } from '../journal/journal.service.js'
import { ConflictError, NotFoundError } from '../../common/errors.js'
import { broadcastChange } from '../../common/events.js'
import type {
  AddSalaryComponentInput,
  CreateEmployeeInput,
  CreatePayrollRunInput,
  ProcessPayrollRunInput,
} from './payroll.schema.js'

/**
 * Illustrative statutory deduction rates only — Kenya's PAYE bands, NSFF
 * tier limits, and SHIF rate change periodically. Verify against current
 * KRA/NSSF/SHIF guidance before relying on this for real payroll.
 */
function calculateStatutoryDeductions(grossPay: number) {
  const paye = grossPay <= 24000 ? grossPay * 0.1 : 2400 + (grossPay - 24000) * 0.25
  const nssf = Math.min(grossPay, 18000) * 0.06
  const shif = grossPay * 0.0275
  return { paye: Math.round(paye), nssf: Math.round(nssf), shif: Math.round(shif) }
}

async function computeGrossAndDeductions(employeeId: number) {
  const components = await payrollRepository.findComponentsByEmployee(employeeId)
  const basic = components.find((cp) => cp.componentType === 'basic')
  const basicAmount = Number(basic?.amount ?? 0)

  let grossPay = 0
  let otherDeductions = 0
  for (const cp of components) {
    const amount = cp.isPercentageOfBasic ? (basicAmount * Number(cp.amount)) / 100 : Number(cp.amount)
    if (cp.componentType === 'basic' || cp.componentType === 'allowance') grossPay += amount
    else otherDeductions += amount
  }

  return { grossPay, otherDeductions }
}

export const payrollService = {
  listEmployees: () => payrollRepository.findAllEmployees(),

  async getEmployeeById(id: number) {
    const employee = await payrollRepository.findEmployeeById(id)
    if (!employee) throw new NotFoundError(`Employee ${id} not found`)
    return employee
  },

  createEmployee: async (input: CreateEmployeeInput) => {
    const created = await payrollRepository.createEmployee(input)
    broadcastChange('payroll', 'employee_created')
    return created
  },

  listSalaryComponents: (employeeId: number) => payrollRepository.findComponentsByEmployee(employeeId),

  addSalaryComponent: (employeeId: number, input: AddSalaryComponentInput) =>
    payrollRepository.addComponent({ ...input, employeeId, amount: String(input.amount) }),

  listRuns: () => payrollRepository.findAllRuns(),

  async getRunById(id: number) {
    const run = await payrollRepository.findRunById(id)
    if (!run) throw new NotFoundError(`Payroll run ${id} not found`)
    const slips = await payrollRepository.findPayslipsByRun(id)
    return { ...run, payslips: slips }
  },

  createRun: async (input: CreatePayrollRunInput) => {
    const created = await payrollRepository.createRun({ ...input, status: 'draft' })
    broadcastChange('payroll', 'run_created')
    broadcastChange('dashboard', 'updated')
    return created
  },

  /** Computes a payslip per active employee, then posts one summary journal entry. */
  async processRun(runId: number, input: ProcessPayrollRunInput) {
    const run = await payrollRepository.findRunById(runId)
    if (!run) throw new NotFoundError(`Payroll run ${runId} not found`)
    if (run.status !== 'draft') throw new ConflictError(`Payroll run ${runId} is already ${run.status}`)

    const employees = await payrollRepository.findActiveEmployees()

    let totalGross = 0
    let totalPaye = 0
    let totalNssf = 0
    let totalShif = 0
    let totalOtherDeductions = 0
    let totalNet = 0

    for (const employee of employees) {
      const { grossPay, otherDeductions } = await computeGrossAndDeductions(employee.id)
      if (grossPay === 0) continue
      const { paye, nssf, shif } = calculateStatutoryDeductions(grossPay)
      const netPay = grossPay - paye - nssf - shif - otherDeductions

      await payrollRepository.createPayslip({
        payrollRunId: runId,
        employeeId: employee.id,
        grossPay: grossPay.toFixed(2),
        paye: paye.toFixed(2),
        nssf: nssf.toFixed(2),
        shif: shif.toFixed(2),
        otherDeductions: otherDeductions.toFixed(2),
        netPay: netPay.toFixed(2),
      })

      totalGross += grossPay
      totalPaye += paye
      totalNssf += nssf
      totalShif += shif
      totalOtherDeductions += otherDeductions
      totalNet += netPay
    }

    if (totalOtherDeductions > 0 && !input.otherDeductionsAccountId) {
      throw new ConflictError('This run has non-statutory deductions; otherDeductionsAccountId is required')
    }

    const entry = await journalService.postSystemEntry({
      periodId: run.periodId,
      entryDate: input.entryDate,
      description: `Payroll ${run.monthYear}`,
      sourceModule: 'payroll',
      sourceReference: `payroll-run-${runId}`,
      createdBy: input.processedBy,
      lines: [
        { accountId: input.salariesExpenseAccountId, fundId: input.fundId, debit: totalGross },
        { accountId: input.payeAccountId, fundId: input.fundId, credit: totalPaye },
        { accountId: input.nssfAccountId, fundId: input.fundId, credit: totalNssf },
        { accountId: input.shifAccountId, fundId: input.fundId, credit: totalShif },
        ...(totalOtherDeductions > 0
          ? [{ accountId: input.otherDeductionsAccountId as number, fundId: input.fundId, credit: totalOtherDeductions }]
          : []),
        { accountId: input.netPayAccountId, fundId: input.fundId, credit: totalNet },
      ],
    })

    const updated = await payrollRepository.updateRunStatus(runId, 'posted', {
      processedBy: input.processedBy,
      processedAt: new Date(),
      journalEntryId: entry.id,
    })

    broadcastChange('payroll', 'run_processed')
    broadcastChange('dashboard', 'updated')

    return updated
  },
}
