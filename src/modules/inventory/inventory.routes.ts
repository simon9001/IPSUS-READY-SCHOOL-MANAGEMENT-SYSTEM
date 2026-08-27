import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { inventoryController } from './inventory.controller.js'
import { createItemSchema, issueStockSchema, receiveStockSchema } from './inventory.schema.js'

export const inventoryRoutes = new Hono()

inventoryRoutes.get('/items', requirePermission('inventory.view'), inventoryController.listItems)
inventoryRoutes.get('/items/:id', requirePermission('inventory.view'), inventoryController.getItemById)
inventoryRoutes.post('/items', requirePermission('inventory.manage'), zValidator('json', createItemSchema), inventoryController.createItem)

inventoryRoutes.get('/items/:itemId/movements', requirePermission('inventory.view'), inventoryController.listMovements)
inventoryRoutes.post('/movements/receive', requirePermission('inventory.manage'), zValidator('json', receiveStockSchema), inventoryController.receiveStock)
inventoryRoutes.post('/movements/issue', requirePermission('inventory.manage'), zValidator('json', issueStockSchema), inventoryController.issueStock)
