/**
 * Groups items that share any key, transitively (A shares a phone with B, B
 * shares an email with C → one group). Groups come out ordered by their first
 * member; members keep input order, so "first" always means "seen first".
 * Null, undefined and empty keys never link anything.
 */
export function groupByKeys<T>(items: T[], keysOf: (item: T) => Array<string | null | undefined>): T[][] {
  const parent = items.map((_, i) => i)
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]]
      i = parent[i]
    }
    return i
  }
  const union = (a: number, b: number) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb)
  }

  const owner = new Map<string, number>()
  items.forEach((item, i) => {
    for (const key of keysOf(item)) {
      if (!key) continue
      const first = owner.get(key)
      if (first === undefined) owner.set(key, i)
      else union(first, i)
    }
  })

  const groups = new Map<number, T[]>()
  items.forEach((item, i) => {
    const root = find(i)
    const group = groups.get(root)
    if (group) group.push(item)
    else groups.set(root, [item])
  })
  return [...groups.entries()].sort(([a], [b]) => a - b).map(([, group]) => group)
}
