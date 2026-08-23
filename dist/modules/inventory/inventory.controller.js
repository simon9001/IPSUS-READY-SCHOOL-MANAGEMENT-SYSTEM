import { inventoryService } from './inventory.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const inventoryController = {
    listItems: async (c) => ok(c, await inventoryService.listItems()),
    getItemById: async (c) => ok(c, await inventoryService.getItemById(Number(c.req.param('id')))),
    createItem: async (c) => created(c, await inventoryService.createItem(getValidated(c, 'json'))),
    listMovements: async (c) => ok(c, await inventoryService.listMovements(Number(c.req.param('itemId')))),
    receiveStock: async (c) => created(c, await inventoryService.receiveStock(getValidated(c, 'json'))),
    issueStock: async (c) => created(c, await inventoryService.issueStock(getValidated(c, 'json'))),
};
