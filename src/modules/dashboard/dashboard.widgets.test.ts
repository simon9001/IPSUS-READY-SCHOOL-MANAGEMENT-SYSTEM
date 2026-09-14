import { describe, it, expect } from 'vitest'
import { WIDGETS } from './dashboard.widgets.js'
import { PERMISSIONS } from '../identity/rbac.js'

const validPermissions = new Set(PERMISSIONS.map((p) => p.code))

describe('dashboard widget registry', () => {
  it('gates every widget on a permission that exists in the RBAC catalogue', () => {
    const unknown = WIDGETS.flatMap((widget) => {
      const gates = Array.isArray(widget.requiredPermission) ? widget.requiredPermission : [widget.requiredPermission]
      return gates.filter((gate) => !validPermissions.has(gate)).map((gate) => `${widget.id} → ${gate}`)
    })
    // A typo'd permission string hides a widget from every role, silently.
    expect(unknown).toEqual([])
  })

  it('has a unique id per widget', () => {
    const ids = WIDGETS.map((w) => w.id)
    expect(ids).toHaveLength(new Set(ids).size)
  })
})
