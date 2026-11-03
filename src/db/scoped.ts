import { AsyncLocalStorage } from 'node:async_hooks'

interface Transactional {
  transaction<T>(work: (tx: never) => Promise<T>): Promise<T>
}

/**
 * Wraps a Drizzle database so services can make several repository calls
 * atomic without passing a transaction through every function: inside
 * withTransaction(), every use of the returned `db` — in any module — runs on
 * that transaction. Outside one, it is the plain database.
 *
 * Postings need this: a fee receipt and its journal entry must land together,
 * or a rejected posting (say, a closed period) leaves a receipt with no ledger
 * entry behind it.
 */
export function createScopedDb<Db extends object>(root: Db) {
  const current = new AsyncLocalStorage<Db>()

  const db = new Proxy(root, {
    get(_target, property) {
      const target = current.getStore() ?? root
      const value = Reflect.get(target, property, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })

  /** Joins the surrounding transaction when already inside one (as a savepoint). */
  function withTransaction<T>(work: () => Promise<T>): Promise<T> {
    const target = (current.getStore() ?? root) as unknown as Transactional
    return target.transaction((tx) => current.run(tx as Db, work))
  }

  return { db, withTransaction }
}
