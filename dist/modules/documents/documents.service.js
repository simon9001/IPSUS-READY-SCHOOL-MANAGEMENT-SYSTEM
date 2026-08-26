import { documentsRepository } from './documents.repository.js';
import { studentsRepository } from '../students/students.repository.js';
import { examsService } from '../exams/exams.service.js';
import { feesService } from '../fees/fees.service.js';
import { renderTemplate } from '../../common/template.js';
import { NotFoundError, ValidationError } from '../../common/errors.js';
function nextReferenceNumber() {
    return `DOC-${Date.now()}`;
}
async function studentFullName(studentId) {
    const student = await studentsRepository.findById(studentId);
    if (!student)
        throw new NotFoundError(`Student ${studentId} not found`);
    return { name: `${student.firstName} ${student.lastName}`, admissionNo: student.admissionNo };
}
export const documentsService = {
    listTemplates: () => documentsRepository.findAllTemplates(),
    createTemplate: (input) => documentsRepository.createTemplate(input),
    listAll: () => documentsRepository.findAllDocuments(),
    listByStudent: (studentId) => documentsRepository.findByStudent(studentId),
    async getById(id) {
        const doc = await documentsRepository.findById(id);
        if (!doc)
            throw new NotFoundError(`Document ${id} not found`);
        return doc;
    },
    async renderLetter(input) {
        const template = await documentsRepository.findTemplateByCode(input.templateCode);
        if (!template)
            throw new NotFoundError(`Document template "${input.templateCode}" not found`);
        if (!template.isActive)
            throw new ValidationError(`Document template "${input.templateCode}" is inactive`);
        let templateData = input.templateData;
        if (input.studentId) {
            const { name, admissionNo } = await studentFullName(input.studentId);
            templateData = { studentName: name, admissionNo, ...input.templateData };
        }
        const content = renderTemplate(template.bodyTemplate, templateData);
        return documentsRepository.create({
            referenceNumber: nextReferenceNumber(),
            documentType: template.documentType,
            studentId: input.studentId,
            templateId: template.id,
            content,
            issuedBy: input.issuedBy,
        });
    },
    async generateTranscript(input) {
        const { name, admissionNo } = await studentFullName(input.studentId);
        const rows = await examsService.getAllResultsForStudent(input.studentId);
        if (rows.length === 0)
            throw new ValidationError(`Student ${input.studentId} has no exam results to compile a transcript from`);
        const transcript = {
            studentId: input.studentId,
            studentName: name,
            admissionNo,
            entries: rows.map((r) => ({
                examName: r.examName,
                subjectCode: r.subjectCode,
                subjectName: r.subjectName,
                marks: Number(r.result.marks),
                grade: r.result.grade,
            })),
        };
        return documentsRepository.create({
            referenceNumber: nextReferenceNumber(),
            documentType: 'transcript',
            studentId: input.studentId,
            content: JSON.stringify(transcript),
            issuedBy: input.issuedBy,
        });
    },
    async generateFeeClearanceLetter(input) {
        const { name, admissionNo } = await studentFullName(input.studentId);
        const invoices = await feesService.listInvoicesByStudent(input.studentId);
        const payments = await feesService.listPaymentsByStudent(input.studentId);
        const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const balance = totalInvoiced - totalPaid;
        const content = balance <= 0
            ? `This is to confirm that ${name} (Admission No. ${admissionNo}) has NO outstanding fee balance as of ${new Date().toISOString().slice(0, 10)}.`
            : `This is to confirm that ${name} (Admission No. ${admissionNo}) has an OUTSTANDING fee balance of KES ${balance.toFixed(2)} as of ${new Date().toISOString().slice(0, 10)}.`;
        return documentsRepository.create({
            referenceNumber: nextReferenceNumber(),
            documentType: 'fee_clearance_letter',
            studentId: input.studentId,
            content,
            issuedBy: input.issuedBy,
        });
    },
    async revoke(id) {
        await this.getById(id);
        return documentsRepository.revoke(id);
    },
};
