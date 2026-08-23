import type { Context } from 'hono'
import { inventoryService } from './inventory.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type { CreateItemInput, IssueStockInput, ReceiveStockInput } from './inventory.schema.js'

export const inventoryController = {
  listItems: async (c: Context) => ok(c, await inventoryService.listItems()),
  getItemById: async (c: Context) => ok(c, await inventoryService.getItemById(Number(c.req.param('id')))),
  createItem: async (c: Context) =>
    created(c, await inventoryService.createItem(getValidated<CreateItemInput>(c, 'json'))),

  listMovements: async (c: Context) => ok(c, await inventoryService.listMovements(Number(c.req.param('itemId')))),
  receiveStock: async (c: Context) =>
    created(c, await inventoryService.receiveStock(getValidated<ReceiveStockInput>(c, 'json'))),
  issueStock: async (c: Context) =>
    created(c, await inventoryService.issueStock(getValidated<IssueStockInput>(c, 'json'))),
}
