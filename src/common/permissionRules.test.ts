import { describe, it, expect } from 'vitest'
import { mergePermissions, administratorIds, wouldRemoveLastAdministrator } from './permissionRules.js'

describe('mergePermissions', () => {
  it('keeps a role permission when there is no override', () => {
    expect(mergePermissions(['fees.view'], [])).toEqual(['fees.view'])
  })

  it('returns the role set unchanged for an empty override list', () => {
    const roles = ['fees.view', 'students.view']
    expect(mergePermissions(roles, []).sort()).toEqual(['fees.view', 'students.view'])
  })

  it('adds a permission no role grants', () => {
    const result = mergePermissions(['fees.view'], [{ code: 'reports.export', granted: true }])
    expect(result.sort()).toEqual(['fees.view', 'reports.export'])
  })

  it('removes a permission a role grants', () => {
    const result = mergePermissions(['fees.view', 'payroll.process'], [{ code: 'payroll.process', granted: false }])
    expect(result).toEqual(['fees.view'])
  })

  it('de-duplicates permissions granted by two roles', () => {
    expect(mergePermissions(['fees.view', 'fees.view'], [])).toEqual(['fees.view'])
  })
})

describe('administratorIds', () => {
  it('counts a holder whose permission comes from a role', () => {
    expect(administratorIds([
      { userId: 1, status: 'active', hasViaRole: true, override: null },
    ])).toEqual([1])
  })

  it('counts a holder whose permission comes from a granted override', () => {
    expect(administratorIds([
      { userId: 2, status: 'active', hasViaRole: false, override: true },
    ])).toEqual([2])
  })

  it('does not count a user whose permission is revoked by an override', () => {
    expect(administratorIds([
      { userId: 3, status: 'active', hasViaRole: true, override: false },
    ])).toEqual([])
  })

  it('does not count an inactive user', () => {
    expect(administratorIds([
      { userId: 4, status: 'suspended', hasViaRole: true, override: null },
    ])).toEqual([])
  })
})

describe('wouldRemoveLastAdministrator', () => {
  it('rejects taking the permission from the only holder', () => {
    expect(wouldRemoveLastAdministrator([7], 7)).toBe(true)
  })

  it('allows taking it from one of two holders', () => {
    expect(wouldRemoveLastAdministrator([7, 8], 7)).toBe(false)
  })

  it('reports true when nobody holds it at all', () => {
    expect(wouldRemoveLastAdministrator([], 7)).toBe(true)
  })
})
