import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { assetsController } from './assets.controller.js'
import { acquireAssetSchema, createAssetCategorySchema, disposeAssetSchema, runDepreciationSchema } from './assets.schema.js'

export const assetsRoutes = new Hono()

assetsRoutes.get('/categories', requirePermission('assets.view'), assetsController.listCategories)
assetsRoutes.post('/categories', requirePermission('assets.manage'), zValidator('json', createAssetCategorySchema), assetsController.createCategory)

assetsRoutes.get('/', requirePermission('assets.view'), assetsController.list)
assetsRoutes.get('/:id', requirePermission('assets.view'), assetsController.getById)
assetsRoutes.post('/', requirePermission('assets.manage'), zValidator('json', acquireAssetSchema), assetsController.acquire)
assetsRoutes.post('/depreciation-runs', requirePermission('assets.manage'), zValidator('json', runDepreciationSchema), assetsController.runDepreciation)
assetsRoutes.post('/:id/dispose', requirePermission('assets.manage'), zValidator('json', disposeAssetSchema), assetsController.dispose)
