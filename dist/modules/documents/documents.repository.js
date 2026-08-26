import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { documentTemplates, generatedDocuments } from '../../db/schema/index.js';
export const documentsRepository = {
    findAllTemplates: () => db.select().from(documentTemplates),
    findTemplateByCode: (code) => db.select().from(documentTemplates).where(eq(documentTemplates.code, code)).then((rows) => rows[0]),
    createTemplate: (data) => db.insert(documentTemplates).values(data).returning().then((rows) => rows[0]),
    findAllDocuments: () => db.select().from(generatedDocuments),
    findById: (id) => db.select().from(generatedDocuments).where(eq(generatedDocuments.id, id)).then((rows) => rows[0]),
    findByStudent: (studentId) => db.select().from(generatedDocuments).where(eq(generatedDocuments.studentId, studentId)),
    create: (data) => db.insert(generatedDocuments).values(data).returning().then((rows) => rows[0]),
    revoke: (id) => db.update(generatedDocuments).set({ status: 'revoked' }).where(eq(generatedDocuments.id, id)).returning().then((rows) => rows[0]),
};
