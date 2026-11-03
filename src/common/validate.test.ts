import { describe, expect, it } from 'vitest'
import type { Context } from 'hono'
import { getValidated, zAmount, zSignedAmount } from './validate.js'

function ctx(payload: unknown, user?: { id: number }) {
  return { req: { valid: () => payload }, get: () => user } as unknown as Context
}

describe('getValidated', () => {
  it('replaces every actor field with the signed-in user, nested ones included', () => {
    const payload = { approverId: 1, createdBy: 2, note: 'x', lines: [{ recordedBy: 3, amount: 5 }] }
    expect(getValidated(ctx(payload, { id: 42 }), 'json')).toEqual({
      approverId: 42,
      createdBy: 42,
      note: 'x',
      lines: [{ recordedBy: 42, amount: 5 }],
    })
  })

  it('leaves fields naming someone other than the actor alone', () => {
    const payload = { requestedBy: 1, attendedBy: 2, administeredBy: 3 }
    expect(getValidated(ctx(payload, { id: 42 }), 'json')).toEqual(payload)
  })

  it('does not touch query parameters', () => {
    expect(getValidated(ctx({ createdBy: 1 }, { id: 42 }), 'query')).toEqual({ createdBy: 1 })
  })

  it('passes the payload through when nobody is signed in', () => {
    expect(getValidated(ctx({ createdBy: 1 }), 'json')).toEqual({ createdBy: 1 })
  })

  it('keeps dates and nulls intact', () => {
    expect(getValidated(ctx({ note: null, count: 0 }, { id: 42 }), 'json')).toEqual({ note: null, count: 0 })
  })
})

describe('zAmount', () => {
  it.each([0, 100, 99.5, '0', '100', '2000.50'])('accepts %s', (value) => {
    expect(zAmount.safeParse(value).success).toBe(true)
  })

  it.each(['abc', '', ' ', '1e5', '-5', -5, '12.5.1', Infinity, NaN, 1e13, '99999999999999'])('rejects %s', (value) => {
    expect(zAmount.safeParse(value).success).toBe(false)
  })
})

describe('zSignedAmount', () => {
  it.each([-250.75, '-250.75', 0, '1000'])('accepts %s', (value) => {
    expect(zSignedAmount.safeParse(value).success).toBe(true)
  })

  it.each(['abc', '--5', NaN])('rejects %s', (value) => {
    expect(zSignedAmount.safeParse(value).success).toBe(false)
  })
})
