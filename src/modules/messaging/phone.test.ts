import { describe, it, expect } from 'vitest'
import { normalisePhone, phoneProblem } from './phone.js'

describe('normalisePhone', () => {
  it('turns local 07 and 01 numbers into +254 form', () => {
    expect(normalisePhone('0712345678')).toBe('+254712345678')
    expect(normalisePhone('0112345678')).toBe('+254112345678')
  })

  it('strips spaces and dashes first', () => {
    expect(normalisePhone(' 0712 345-678 ')).toBe('+254712345678')
  })

  it('adds a plus to 254 numbers and keeps valid +254 numbers', () => {
    expect(normalisePhone('254712345678')).toBe('+254712345678')
    expect(normalisePhone('+254712345678')).toBe('+254712345678')
  })

  it('rejects anything else', () => {
    expect(normalisePhone('0812345678')).toBeNull() // not an 07/01 prefix
    expect(normalisePhone('071234567')).toBeNull() // too short
    expect(normalisePhone('07123456789')).toBeNull() // too long
    expect(normalisePhone('+25471234567')).toBeNull()
    expect(normalisePhone('+44 7700 900123')).toBeNull()
    expect(normalisePhone('call me')).toBeNull()
  })

  it('treats missing values as no phone', () => {
    expect(normalisePhone(null)).toBeNull()
    expect(normalisePhone(undefined)).toBeNull()
    expect(normalisePhone('   ')).toBeNull()
  })
})

describe('phoneProblem', () => {
  it('says "No phone number" when nothing is stored', () => {
    expect(phoneProblem(null)).toBe('No phone number')
    expect(phoneProblem('  ')).toBe('No phone number')
  })

  it('says "Invalid phone number" when something unusable is stored', () => {
    expect(phoneProblem('12345')).toBe('Invalid phone number')
  })
})
