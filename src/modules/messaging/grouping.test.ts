import { describe, it, expect } from 'vitest'
import { groupByKeys } from './grouping.js'

type Item = { id: string; keys: Array<string | null> }
const keysOf = (item: Item) => item.keys
const ids = (groups: Item[][]) => groups.map((g) => g.map((i) => i.id))

describe('groupByKeys', () => {
  it('keeps items with no shared key apart, in input order', () => {
    const items: Item[] = [
      { id: 'a', keys: ['p1'] },
      { id: 'b', keys: ['p2'] },
    ]
    expect(ids(groupByKeys(items, keysOf))).toEqual([['a'], ['b']])
  })

  it('groups items sharing any key, transitively', () => {
    const items: Item[] = [
      { id: 'a', keys: ['phone:1', null] },
      { id: 'b', keys: ['phone:2', 'email:x'] },
      { id: 'c', keys: ['phone:1', 'email:x'] }, // links a and b
      { id: 'd', keys: [null, null] },
    ]
    expect(ids(groupByKeys(items, keysOf))).toEqual([['a', 'b', 'c'], ['d']])
  })

  it('orders groups by their first member and members by input order', () => {
    const items: Item[] = [
      { id: 'a', keys: ['k2'] },
      { id: 'b', keys: ['k1'] },
      { id: 'c', keys: ['k1'] },
      { id: 'd', keys: ['k2'] },
    ]
    expect(ids(groupByKeys(items, keysOf))).toEqual([['a', 'd'], ['b', 'c']])
  })
})
