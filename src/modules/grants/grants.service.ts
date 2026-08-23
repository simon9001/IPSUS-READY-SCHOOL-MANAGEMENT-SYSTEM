import { grantsRepository } from './grants.repository.js'
import { journalService } from '../journal/journal.service.js'
import { NotFoundError } from '../../common/errors.js'
import type { CreateGrantTypeInput, RecordDisbursementInput } from './grants.schema.js'

export const grantsService = {
  listTypes: () => grantsRepository.findAllTypes(),
  createType: (input: CreateGrantTypeInput) => grantsRepository.createType(input),

  listDisbursements: () => grantsRepository.findAllDisbursements(),

  async getDisbursementById(id: number) {
    const disbursement = await grantsRepository.findDisbursementById(id)
    if (!disbursement) throw new NotFoundError(`Grant disbursement ${id} not found`)
    return disbursement
  },

  /**
   * Non-exchange revenue (IPSAS 23/47): the cash receipt is always recorded,
   * but income is only recognized in the ledger once conditionsMet is true.
   * An unmet-conditions disbursement is booked with no journal entry yet —
   * a future "mark conditions met" action would post it retroactively.
   */
  async recordDisbursement(input: RecordDisbursementInput) {
    const grantType = await grantsRepository.findTypeById(input.grantTypeId)
    if (!grantType) throw new NotFoundError(`Grant type ${input.grantTypeId} not found`)

    const disbursement = await grantsRepository.createDisbursement({
      grantTypeId: input.grantTypeId,
      periodId: input.periodId,
      expectedAmount: input.expectedAmount !== undefined ? String(input.expectedAmount) : undefined,
      amountReceived: String(input.amountReceived),
      dateReceived: input.dateReceived,
      conditionsMet: input.conditionsMet,
      notes: input.notes,
      recordedBy: input.recordedBy,
    })

    if (!input.conditionsMet) return disbursement

    const entry = await journalService.postSystemEntry({
      periodId: input.periodId,
      entryDate: input.dateReceived,
      description: `${grantType.name} disbursement received`,
      sourceModule: 'grants',
      sourceReference: `grant-disbursement-${disbursement.id}`,
      createdBy: input.recordedBy,
      lines: [
        { accountId: input.cashAccountId, fundId: grantType.fundId, debit: input.amountReceived },
        { accountId: grantType.revenueAccountId, fundId: grantType.fundId, credit: input.amountReceived },
      ],
    })

    return grantsRepository.attachJournalEntry(disbursement.id, entry.id)
  },
}
