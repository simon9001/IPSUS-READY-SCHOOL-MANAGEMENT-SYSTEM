import { beforeAll, describe, expect, it, vi } from 'vitest'
import { count, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { feeInvoices, feePayments } from '../../db/schema/index.js'
import { api, closedPeriod, ledgerRefs, seedDatabase, userWithPermissions, type Actor } from '../harness.js'

vi.mock('../../db/client.js', () => import('../db.js'))

let refs: Awaited<ReturnType<typeof ledgerRefs>>
let bursar: Actor
let classId: number
let structureId: number
let closedPeriodId: number
let nextAdmissionNo = 1000

beforeAll(async () => {
  await seedDatabase()
  refs = await ledgerRefs()
  bursar = await userWithPermissions(
    'students.manage',
    'students.view',
    'fees.structure.manage',
    'fees.invoice.manage',
    'fees.receipt.create',
    'fees.view',
    'ledger.journal.view',
  )
  const created = await api('POST', '/api/students/classes', { as: bursar, body: { name: 'Form 1', level: 1 } })
  classId = created.body.data.id
  const structure = await api('POST', '/api/fees/structures', {
    as: bursar,
    body: {
      fiscalYear: 2026,
      periodId: refs.period(1),
      classId,
      boardingStatus: 'day',
      items: [
        { accountId: refs.account('4000'), fundId: refs.fund('FUND-TUI'), description: 'Tuition', amount: 6000 },
        { accountId: refs.account('4010'), fundId: refs.fund('FUND-BRD'), description: 'Lunch', amount: 4000 },
      ],
    },
  })
  structureId = structure.body.data.id

  closedPeriodId = await closedPeriod()
})

async function newStudent() {
  const res = await api('POST', '/api/students', {
    as: bursar,
    body: { admissionNo: `A${nextAdmissionNo++}`, firstName: 'Amina', lastName: 'Otieno', classId, admissionDate: '2026-01-06' },
  })
  expect(res.status).toBe(201)
  return res.body.data
}

const invoiceBody = (studentId: number, overrides = {}) => ({
  studentId,
  periodId: refs.period(1),
  feeStructureId: structureId,
  invoiceDate: '2026-01-10',
  debtorsAccountId: refs.account('1100'),
  createdBy: bursar.id,
  ...overrides,
})

const paymentBody = (studentId: number, invoiceId: number, amount: number | string, overrides = {}) => ({
  studentId,
  invoiceId,
  paymentDate: '2026-01-15',
  amount,
  paymentMethod: 'mpesa',
  cashAccountId: refs.account('1010'),
  debtorsAccountId: refs.account('1100'),
  periodId: refs.period(1),
  receivedBy: bursar.id,
  ...overrides,
})

async function invoicedStudent() {
  const student = await newStudent()
  const invoice = await api('POST', '/api/fees/invoices', { as: bursar, body: invoiceBody(student.id) })
  expect(invoice.status).toBe(201)
  return { student, invoice: invoice.body.data }
}

const invoiceStatus = async (id: number) => (await api('GET', `/api/fees/invoices/${id}`, { as: bursar })).body.data.status
const trialBalance = async () => (await api('GET', '/api/reports/trial-balance?asOfDate=2026-12-31', { as: bursar })).body.data
const countInvoices = async () => (await db.select({ n: count() }).from(feeInvoices))[0].n
const countPayments = async () => (await db.select({ n: count() }).from(feePayments))[0].n

function balanceOf(tb: { rows: { accountCode?: string; code?: string; balance: number }[] }, code: string) {
  return tb.rows.find((r) => (r.accountCode ?? r.code) === code)?.balance ?? 0
}

describe('invoicing', () => {
  it('totals the structure and posts debtors against each income account', async () => {
    const before = await trialBalance()
    const { invoice } = await invoicedStudent()
    const after = await trialBalance()

    expect(invoice.totalAmount).toBe('10000.00')
    expect(invoice.status).toBe('open')
    expect(balanceOf(after, '1100') - balanceOf(before, '1100')).toBe(10000)
    expect(balanceOf(after, '4000') - balanceOf(before, '4000')).toBe(6000)
    expect(balanceOf(after, '4010') - balanceOf(before, '4010')).toBe(4000)
    expect(after.isBalanced).toBe(true)
  })

  it('leaves no invoice behind when the ledger refuses the posting', async () => {
    const student = await newStudent()
    const before = await countInvoices()

    const res = await api('POST', '/api/fees/invoices', { as: bursar, body: invoiceBody(student.id, { periodId: closedPeriodId }) })

    expect(res.status).toBe(409)
    expect(await countInvoices()).toBe(before)
  })
})

describe('recording payments', () => {
  it('moves a part payment from debtors to cash and marks the invoice partially paid', async () => {
    const { student, invoice } = await invoicedStudent()
    const before = await trialBalance()

    const res = await api('POST', '/api/fees/payments', { as: bursar, body: paymentBody(student.id, invoice.id, 2500) })
    const after = await trialBalance()

    expect(res.status).toBe(201)
    expect(balanceOf(after, '1010') - balanceOf(before, '1010')).toBe(2500)
    expect(balanceOf(after, '1100') - balanceOf(before, '1100')).toBe(-2500)
    expect(await invoiceStatus(invoice.id)).toBe('partially_paid')
  })

  it('marks the invoice paid once instalments cover it, then refuses more', async () => {
    const { student, invoice } = await invoicedStudent()

    await api('POST', '/api/fees/payments', { as: bursar, body: paymentBody(student.id, invoice.id, 7000) })
    await api('POST', '/api/fees/payments', { as: bursar, body: paymentBody(student.id, invoice.id, '3000.00') })
    expect(await invoiceStatus(invoice.id)).toBe('paid')

    const again = await api('POST', '/api/fees/payments', { as: bursar, body: paymentBody(student.id, invoice.id, 1) })
    expect(again.status).toBe(409)
  })

  it('handles amounts that do not add up exactly in floating point', async () => {
    const { student, invoice } = await invoicedStudent()
    for (const amount of ['3333.33', '3333.33', '3333.34']) {
      expect((await api('POST', '/api/fees/payments', { as: bursar, body: paymentBody(student.id, invoice.id, amount) })).status).toBe(201)
    }
    expect(await invoiceStatus(invoice.id)).toBe('paid')
  })

  it('refuses an overpayment rather than receipting money the ledger never sees', async () => {
    const { student, invoice } = await invoicedStudent()
    const before = await countPayments()

    const res = await api('POST', '/api/fees/payments', { as: bursar, body: paymentBody(student.id, invoice.id, 10000.01) })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/outstanding/i)
    expect(await countPayments()).toBe(before)
  })

  it("refuses a receipt against another student's invoice", async () => {
    const { invoice } = await invoicedStudent()
    const other = await newStudent()
    const before = await countPayments()

    const res = await api('POST', '/api/fees/payments', { as: bursar, body: paymentBody(other.id, invoice.id, 100) })

    expect(res.status).toBe(400)
    expect(await countPayments()).toBe(before)
    expect((await db.select().from(feeInvoices).where(eq(feeInvoices.id, invoice.id)))[0].status).toBe('open')
  })

  it.each([
    ['text', 'abc'],
    ['a negative amount', -100],
    ['zero', 0],
  ])('rejects %s as an amount', async (_label, amount) => {
    const { student, invoice } = await invoicedStudent()
    const res = await api('POST', '/api/fees/payments', { as: bursar, body: paymentBody(student.id, invoice.id, amount) })
    expect(res.status).toBe(400)
  })

  it('leaves no receipt behind when the ledger refuses the posting', async () => {
    const { student, invoice } = await invoicedStudent()
    const before = await countPayments()

    const res = await api('POST', '/api/fees/payments', {
      as: bursar,
      body: paymentBody(student.id, invoice.id, 100, { periodId: closedPeriodId }),
    })

    expect(res.status).toBe(409)
    expect(await countPayments()).toBe(before)
    expect(await invoiceStatus(invoice.id)).toBe('open')
  })
})
