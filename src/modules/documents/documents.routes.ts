import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { requirePermission } from '../../common/auth.js'
import { documentsController } from './documents.controller.js'
import {
  createTemplateSchema,
  generateFeeClearanceSchema,
  generateTranscriptSchema,
  renderLetterSchema,
} from './documents.schema.js'

export const documentsRoutes = new Hono()

documentsRoutes.get('/templates', requirePermission('documents.view'), documentsController.listTemplates)
documentsRoutes.post('/templates', requirePermission('documents.manage'), zValidator('json', createTemplateSchema), documentsController.createTemplate)

documentsRoutes.get('/', requirePermission('documents.view'), documentsController.listAll)
documentsRoutes.get('/students/:studentId', requirePermission('documents.view'), documentsController.listByStudent)
documentsRoutes.get('/:id', requirePermission('documents.view'), documentsController.getById)
documentsRoutes.post('/:id/revoke', requirePermission('documents.manage'), documentsController.revoke)

documentsRoutes.post('/letters', requirePermission('documents.manage'), zValidator('json', renderLetterSchema), documentsController.renderLetter)
documentsRoutes.post('/transcripts', requirePermission('documents.manage'), zValidator('json', generateTranscriptSchema), documentsController.generateTranscript)
documentsRoutes.post('/fee-clearance', requirePermission('documents.manage'), zValidator('json', generateFeeClearanceSchema), documentsController.generateFeeClearanceLetter)
