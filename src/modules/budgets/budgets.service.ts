import { budgetsRepository } from './budgets.repository.js'
import { ConflictError, NotFoundError } from '../../common/errors.js'
import type { AddBudgetLineInput, CreateBudgetInput } from './budgets.schema.js'
import type { BudgetVsActualRow } from './budgets.types.js'

export const budgetsService = {
  list: () => budgetsRepository.findAll(),

  async getById(id: number) {
    const budget = await budgetsRepository.findById(id)
    if (!budget) throw new NotFoundError(`Budget ${id} not found`)
    const lines = await budgetsRepository.findLines(id)
    return { ...budget, lines }
  },

  create: (input: CreateBudgetInput) => {
    const { lines, ...budget } = input
    return budgetsRepository.create(
      { ...budget, status: 'draft' },
      lines.map((line) => ({ ...line, amount: String(line.amount) })),
    )
  },

  async addLine(budgetId: number, input: AddBudgetLineInput) {
    const budget = await budgetsRepository.findById(budgetId)
    if (!budget) throw new NotFoundError(`Budget ${budgetId} not found`)
    if (budget.status === 'approved') throw new ConflictError(`Budget ${budgetId} is already approved`)
    return budgetsRepository.addLine(budgetId, { ...input, amount: String(input.amount) })
  },

  async approve(id: number, approvedBy: number) {
    const budget = await budgetsRepository.findById(id)
    if (!budget) throw new NotFoundError(`Budget ${id} not found`)
    if (budget.status === 'approved') throw new ConflictError(`Budget ${id} is already approved`)
    return budgetsRepository.approve(id, approvedBy)
  },

  async budgetVsActual(id: number): Promise<BudgetVsActualRow[]> {
    const budget = await budgetsRepository.findById(id)
    if (!budget) throw new NotFoundError(`Budget ${id} not found`)

    const lines = await budgetsRepository.findLines(id)
    const yearStart = `${budget.fiscalYear}-01-01`
    const yearEnd = `${budget.fiscalYear}-12-31`

    return Promise.all(
      lines.map(async (row) => {
        const startDate = row.periodStart ?? yearStart
        const endDate = row.periodEnd ?? yearEnd
        const actualAmounts = await budgetsRepository.actualForScope(row.line.accountId, row.line.fundId, startDate, endDate)
        const actual = row.accountNormalBalance === 'debit' ? actualAmounts.debit - actualAmounts.credit : actualAmounts.credit - actualAmounts.debit
        const budgeted = Number(row.line.amount)
        return {
          accountId: row.line.accountId,
          accountCode: row.accountCode,
          accountName: row.accountName,
          fundId: row.line.fundId,
          fundCode: row.fundCode,
          budgeted,
          actual,
          variance: budgeted - actual,
        }
      }),
    )
  },
}
