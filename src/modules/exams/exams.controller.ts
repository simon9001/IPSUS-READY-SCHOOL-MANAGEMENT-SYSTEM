import type { Context } from 'hono'
import { examsService } from './exams.service.js'
import { ok, created } from '../../common/response.js'
import { getValidated } from '../../common/validate.js'
import type {
  AddExamTimetableEntryInput,
  BulkRecordExamResultsInput,
  CreateExamInput,
  CreateGradingScaleInput,
  RecordExamResultInput,
} from './exams.schema.js'

export const examsController = {
  listScales: async (c: Context) => ok(c, await examsService.listScales()),
  getScaleById: async (c: Context) => ok(c, await examsService.getScaleById(Number(c.req.param('id')))),
  createScale: async (c: Context) =>
    created(c, await examsService.createScale(getValidated<CreateGradingScaleInput>(c, 'json'))),

  listExams: async (c: Context) => ok(c, await examsService.listExams()),
  getExamById: async (c: Context) => ok(c, await examsService.getExamById(Number(c.req.param('id')))),
  createExam: async (c: Context) =>
    created(c, await examsService.createExam(getValidated<CreateExamInput>(c, 'json'))),

  recordResult: async (c: Context) =>
    created(c, await examsService.recordResult(getValidated<RecordExamResultInput>(c, 'json'))),
  bulkRecordResults: async (c: Context) => {
    const { results } = getValidated<BulkRecordExamResultsInput>(c, 'json')
    return created(c, await examsService.bulkRecordResults(results))
  },

  reportCard: async (c: Context) =>
    ok(c, await examsService.reportCard(Number(c.req.param('examId')), Number(c.req.param('studentId')))),

  getTimetable: async (c: Context) => ok(c, await examsService.getTimetable(Number(c.req.param('examId')))),
  addTimetableEntry: async (c: Context) =>
    created(c, await examsService.addTimetableEntry(getValidated<AddExamTimetableEntryInput>(c, 'json'))),
}
