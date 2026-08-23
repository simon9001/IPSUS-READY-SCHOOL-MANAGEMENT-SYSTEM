import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { assetsController } from './assets.controller.js'
import { acquireAssetSchema, createAssetCategorySchema, disposeAssetSchema, runDepreciationSchema } from './assets.schema.js'

export const assetsRoutes = new Hono()

assetsRoutes.get('/categories', assetsController.listCategories)
assetsRoutes.post('/categories', zValidator('json', createAssetCategorySchema), assetsController.createCategory)

assetsRoutes.get('/', assetsController.list)
assetsRoutes.get('/:id', assetsController.getById)
assetsRoutes.post('/', zValidator('json', acquireAssetSchema), assetsController.acquire)
assetsRoutes.post('/depreciation-runs', zValidator('json', runDepreciationSchema), assetsController.runDepreciation)
assetsRoutes.post('/:id/dispose', zValidator('json', disposeAssetSchema), assetsController.dispose)
