import type { Context } from 'hono'
import { journalService } from './journal.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { ApproveJournalEntryInput, CreateJournalEntryInput, RejectJournalEntryInput } from './journal.schema.js'

export const journalController = {
  list: async (c: Context) => ok(c, await journalService.list()),

  getById: async (c: Context) => ok(c, await journalService.getById(Number(c.req.param('id')))),

  createManual: async (c: Context) =>
    created(c, await journalService.createManualEntry(getValidated<CreateJournalEntryInput>(c, 'json'))),

  postSystem: async (c: Context) =>
    created(c, await journalService.postSystemEntry(getValidated<CreateJournalEntryInput>(c, 'json'))),

  approve: async (c: Context) => {
    const { approverId } = getValidated<ApproveJournalEntryInput>(c, 'json')
    return ok(c, await journalService.approve(Number(c.req.param('id')), approverId))
  },

  reject: async (c: Context) => {
    const { approverId, reason } = getValidated<RejectJournalEntryInput>(c, 'json')
    return ok(c, await journalService.reject(Number(c.req.param('id')), approverId, reason))
  },

  trialBalance: async (c: Context) => {
    const asOfDate = c.req.query('asOfDate') ?? new Date().toISOString().slice(0, 10)
    const fundIdParam = c.req.query('fundId')
    const fundId = fundIdParam ? Number(fundIdParam) : undefined
    return ok(c, await journalService.trialBalance(asOfDate, fundId))
  },
}
