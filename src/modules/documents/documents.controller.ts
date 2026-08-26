import type { Context } from 'hono'
import { documentsService } from './documents.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type {
  CreateTemplateInput,
  GenerateFeeClearanceInput,
  GenerateTranscriptInput,
  RenderLetterInput,
} from './documents.schema.js'

export const documentsController = {
  listTemplates: async (c: Context) => ok(c, await documentsService.listTemplates()),
  createTemplate: async (c: Context) =>
    created(c, await documentsService.createTemplate(getValidated<CreateTemplateInput>(c, 'json'))),

  listAll: async (c: Context) => ok(c, await documentsService.listAll()),
  listByStudent: async (c: Context) => ok(c, await documentsService.listByStudent(Number(c.req.param('studentId')))),
  getById: async (c: Context) => ok(c, await documentsService.getById(Number(c.req.param('id')))),

  renderLetter: async (c: Context) => created(c, await documentsService.renderLetter(getValidated<RenderLetterInput>(c, 'json'))),
  generateTranscript: async (c: Context) =>
    created(c, await documentsService.generateTranscript(getValidated<GenerateTranscriptInput>(c, 'json'))),
  generateFeeClearanceLetter: async (c: Context) =>
    created(c, await documentsService.generateFeeClearanceLetter(getValidated<GenerateFeeClearanceInput>(c, 'json'))),

  revoke: async (c: Context) => ok(c, await documentsService.revoke(Number(c.req.param('id')))),
}
