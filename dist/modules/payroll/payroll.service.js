import { payrollRepository } from './payroll.repository.js';
import { journalService } from '../journal/journal.service.js';
import { ConflictError, NotFoundError } from '../../common/errors.js';
/**
 * Illustrative statutory deduction rates only — Kenya's PAYE bands, NSFF
 * tier limits, and SHIF rate change periodically. Verify against current
 * KRA/NSSF/SHIF guidance before relying on this for real payroll.
 */
function calculateStatutoryDeductions(grossPay) {
    const paye = grossPay <= 24000 ? grossPay * 0.1 : 2400 + (grossPay - 24000) * 0.25;
    const nssf = Math.min(grossPay, 18000) * 0.06;
    const shif = grossPay * 0.0275;
    return { paye: Math.round(paye), nssf: Math.round(nssf), shif: Math.round(shif) };
}
async function computeGrossAndDeductions(employeeId) {
    const components = await payrollRepository.findComponentsByEmployee(employeeId);
    const basic = components.find((cp) => cp.componentType === 'basic');
    const basicAmount = Number(basic?.amount ?? 0);
    let grossPay = 0;
    let otherDeductions = 0;
    for (const cp of components) {
        const amount = cp.isPercentageOfBasic ? (basicAmount * Number(cp.amount)) / 100 : Number(cp.amount);
        if (cp.componentType === 'basic' || cp.componentType === 'allowance')
            grossPay += amount;
        else
            otherDeductions += amount;
    }
    return { grossPay, otherDeductions };
}
export const payrollService = {
    listEmployees: () => payrollRepository.findAllEmployees(),
    async getEmployeeById(id) {
        const employee = await payrollRepository.findEmployeeById(id);
        if (!employee)
            throw new NotFoundError(`Employee ${id} not found`);
        return employee;
    },
    createEmployee: (input) => payrollRepository.createEmployee(input),
    listSalaryComponents: (employeeId) => payrollRepository.findComponentsByEmployee(employeeId),
    addSalaryComponent: (employeeId, input) => payrollRepository.addComponent({ ...input, employeeId, amount: String(input.amount) }),
    listRuns: () => payrollRepository.findAllRuns(),
    async getRunById(id) {
        const run = await payrollRepository.findRunById(id);
        if (!run)
            throw new NotFoundError(`Payroll run ${id} not found`);
        const slips = await payrollRepository.findPayslipsByRun(id);
        return { ...run, payslips: slips };
    },
    createRun: (input) => payrollRepository.createRun({ ...input, status: 'draft' }),
    /** Computes a payslip per active employee, then posts one summary journal entry. */
    async processRun(runId, input) {
        const run = await payrollRepository.findRunById(runId);
        if (!run)
            throw new NotFoundError(`Payroll run ${runId} not found`);
        if (run.status !== 'draft')
            throw new ConflictError(`Payroll run ${runId} is already ${run.status}`);
        const employees = await payrollRepository.findActiveEmployees();
        let totalGross = 0;
        let totalPaye = 0;
        let totalNssf = 0;
        let totalShif = 0;
        let totalOtherDeductions = 0;
        let totalNet = 0;
        for (const employee of employees) {
            const { grossPay, otherDeductions } = await computeGrossAndDeductions(employee.id);
            if (grossPay === 0)
                continue;
            const { paye, nssf, shif } = calculateStatutoryDeductions(grossPay);
            const netPay = grossPay - paye - nssf - shif - otherDeductions;
            await payrollRepository.createPayslip({
                payrollRunId: runId,
                employeeId: employee.id,
                grossPay: grossPay.toFixed(2),
                paye: paye.toFixed(2),
                nssf: nssf.toFixed(2),
                shif: shif.toFixed(2),
                otherDeductions: otherDeductions.toFixed(2),
                netPay: netPay.toFixed(2),
            });
            totalGross += grossPay;
            totalPaye += paye;
            totalNssf += nssf;
            totalShif += shif;
            totalOtherDeductions += otherDeductions;
            totalNet += netPay;
        }
        if (totalOtherDeductions > 0 && !input.otherDeductionsAccountId) {
            throw new ConflictError('This run has non-statutory deductions; otherDeductionsAccountId is required');
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
                    ? [{ accountId: input.otherDeductionsAccountId, fundId: input.fundId, credit: totalOtherDeductions }]
                    : []),
                { accountId: input.netPayAccountId, fundId: input.fundId, credit: totalNet },
            ],
        });
        return payrollRepository.updateRunStatus(runId, 'posted', {
            processedBy: input.processedBy,
            processedAt: new Date(),
            journalEntryId: entry.id,
        });
    },
};
