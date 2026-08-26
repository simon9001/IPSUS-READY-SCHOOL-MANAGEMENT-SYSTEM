import { Hono } from 'hono'
import { zValidator } from '../../common/validate.js'
import { documentsController } from './documents.controller.js'
import {
  createTemplateSchema,
  generateFeeClearanceSchema,
  generateTranscriptSchema,
  renderLetterSchema,
} from './documents.schema.js'

export const documentsRoutes = new Hono()

documentsRoutes.get('/templates', documentsController.listTemplates)
documentsRoutes.post('/templates', zValidator('json', createTemplateSchema), documentsController.createTemplate)

documentsRoutes.get('/', documentsController.listAll)
documentsRoutes.get('/students/:studentId', documentsController.listByStudent)
documentsRoutes.get('/:id', documentsController.getById)
documentsRoutes.post('/:id/revoke', documentsController.revoke)

documentsRoutes.post('/letters', zValidator('json', renderLetterSchema), documentsController.renderLetter)
documentsRoutes.post('/transcripts', zValidator('json', generateTranscriptSchema), documentsController.generateTranscript)
documentsRoutes.post('/fee-clearance', zValidator('json', generateFeeClearanceSchema), documentsController.generateFeeClearanceLetter)
