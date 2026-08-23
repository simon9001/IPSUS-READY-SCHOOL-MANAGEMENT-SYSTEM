import { examsService } from './exams.service.js';
import { ok, created } from '../../common/response.js';
import { getValidated } from '../../common/validate.js';
export const examsController = {
    listScales: async (c) => ok(c, await examsService.listScales()),
    getScaleById: async (c) => ok(c, await examsService.getScaleById(Number(c.req.param('id')))),
    createScale: async (c) => created(c, await examsService.createScale(getValidated(c, 'json'))),
    listExams: async (c) => ok(c, await examsService.listExams()),
    getExamById: async (c) => ok(c, await examsService.getExamById(Number(c.req.param('id')))),
    createExam: async (c) => created(c, await examsService.createExam(getValidated(c, 'json'))),
    recordResult: async (c) => created(c, await examsService.recordResult(getValidated(c, 'json'))),
    bulkRecordResults: async (c) => {
        const { results } = getValidated(c, 'json');
        return created(c, await examsService.bulkRecordResults(results));
    },
    reportCard: async (c) => ok(c, await examsService.reportCard(Number(c.req.param('examId')), Number(c.req.param('studentId')))),
};
