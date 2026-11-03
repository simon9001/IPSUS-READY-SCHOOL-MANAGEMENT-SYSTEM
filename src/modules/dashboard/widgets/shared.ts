import { inventoryService } from '../../inventory/inventory.service.js'
import type { DashboardSectionId, DashboardWidget } from '../dashboard.types.js'

export interface WidgetContext {
  asOfDate: string
  permissions: string[]
}

export interface WidgetDef {
  id: string
  section: DashboardSectionId
  requiredPermission: string | string[]
  build: (ctx: WidgetContext) => Promise<DashboardWidget>
}

export const hasGate = (permissions: string[], gate: string | string[]) =>
  Array.isArray(gate) ? gate.some((p) => permissions.includes(p)) : permissions.includes(gate)

export const money = (n: number) => `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const daysUntil = (asOfDate: string, date: string) =>
  Math.round((new Date(date).getTime() - new Date(asOfDate).getTime()) / 86_400_000)

// Shared by inventory-overview (inventory.view) and inventory-low-stock
// (inventory.manage) so the two widgets never disagree on the numbers.
export async function computeInventoryBalances() {
  const [items, movements] = await Promise.all([inventoryService.listItems(), inventoryService.listAllMovements()])
  const balanceByItem = new Map<number, number>()
  for (const m of movements) {
    const qty = Number(m.quantity) * (m.movementType === 'issue' ? -1 : 1)
    balanceByItem.set(m.itemId, (balanceByItem.get(m.itemId) ?? 0) + qty)
  }
  return { items, balanceByItem }
}
