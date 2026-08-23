import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { inventoryController } from './inventory.controller.js'
import { createItemSchema, issueStockSchema, receiveStockSchema } from './inventory.schema.js'

export const inventoryRoutes = new Hono()

inventoryRoutes.get('/items', inventoryController.listItems)
inventoryRoutes.get('/items/:id', inventoryController.getItemById)
inventoryRoutes.post('/items', zValidator('json', createItemSchema), inventoryController.createItem)

inventoryRoutes.get('/items/:itemId/movements', inventoryController.listMovements)
inventoryRoutes.post('/movements/receive', zValidator('json', receiveStockSchema), inventoryController.receiveStock)
inventoryRoutes.post('/movements/issue', zValidator('json', issueStockSchema), inventoryController.issueStock)
