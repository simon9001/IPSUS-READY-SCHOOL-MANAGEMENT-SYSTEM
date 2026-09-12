import { describe, it, expect } from 'vitest'
import { resolvePort, DEFAULT_PORT } from './port.js'

describe('resolvePort', () => {
  it('uses the default when PORT is not set at all', () => {
    expect(resolvePort(undefined)).toBe(DEFAULT_PORT)
  })

  it('parses a normal numeric port', () => {
    expect(resolvePort('4100')).toBe(4100)
  })

  it('tolerates surrounding whitespace', () => {
    expect(resolvePort(' 10000 ')).toBe(10000)
  })

  // The production bug: Render had PORT set to an empty value, `??` let it
  // through, Number('') became 0, and the server bound a random ephemeral
  // port on every boot.
  it('falls back to the default when PORT is set but empty', () => {
    expect(resolvePort('')).toBe(DEFAULT_PORT)
  })

  it('falls back to the default when PORT is only whitespace', () => {
    expect(resolvePort('   ')).toBe(DEFAULT_PORT)
  })

  it('never resolves to 0, which would ask the OS for a random port', () => {
    expect(resolvePort('')).not.toBe(0)
    expect(() => resolvePort('0')).toThrow(/random/i)
  })

  it('rejects a non-numeric port loudly instead of guessing', () => {
    expect(() => resolvePort('http://3000')).toThrow(/PORT/)
  })

  it('rejects an out-of-range port', () => {
    expect(() => resolvePort('70000')).toThrow(/PORT/)
    expect(() => resolvePort('-1')).toThrow(/PORT/)
  })

  it('rejects a fractional port', () => {
    expect(() => resolvePort('3000.5')).toThrow(/PORT/)
  })

  it('honours an explicit fallback', () => {
    expect(resolvePort(undefined, 8080)).toBe(8080)
  })
})
