import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { documentTemplates, generatedDocuments } from '../../db/schema/index.js'
import type { NewDocumentTemplate, NewGeneratedDocument } from './documents.types.js'

export const documentsRepository = {
  findAllTemplates: () => db.select().from(documentTemplates),
  findTemplateByCode: (code: string) =>
    db.select().from(documentTemplates).where(eq(documentTemplates.code, code)).then((rows) => rows[0]),
  createTemplate: (data: NewDocumentTemplate) => db.insert(documentTemplates).values(data).returning().then((rows) => rows[0]),

  findAllDocuments: () => db.select().from(generatedDocuments),
  findById: (id: number) =>
    db.select().from(generatedDocuments).where(eq(generatedDocuments.id, id)).then((rows) => rows[0]),
  findByStudent: (studentId: number) => db.select().from(generatedDocuments).where(eq(generatedDocuments.studentId, studentId)),
  create: (data: NewGeneratedDocument) => db.insert(generatedDocuments).values(data).returning().then((rows) => rows[0]),
  revoke: (id: number) =>
    db.update(generatedDocuments).set({ status: 'revoked' }).where(eq(generatedDocuments.id, id)).returning().then((rows) => rows[0]),
}
