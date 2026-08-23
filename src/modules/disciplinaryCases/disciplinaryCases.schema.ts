import { z } from 'zod'

export const openCaseSchema = z.object({
  studentId: z.number().int().positive(),
  disciplineRecordId: z.number().int().positive().optional(),
  caseType: z.enum(['suspension', 'expulsion']),
  openedBy: z.number().int().positive(),
})

export const summonParentSchema = z.object({
  summonsDate: z.string().date(),
})

export const recordParentAttendanceSchema = z.object({
  attended: z.boolean(),
})

export const recordHearingSchema = z.object({
  hearingDate: z.string().date(),
  hearingPanel: z.string().optional(),
  hearingNotes: z.string().optional(),
})

export const bomReviewSchema = z.object({
  bomReviewDate: z.string().date(),
  bomDecisionNotes: z.string().optional(),
})

export const decideCaseSchema = z
  .object({
    decision: z.enum(['suspended', 'expelled', 'dismissed']),
    decidedBy: z.number().int().positive(),
    suspensionStartDate: z.string().date().optional(),
    suspensionEndDate: z.string().date().optional(),
  })
  .refine((v) => v.decision !== 'suspended' || (v.suspensionStartDate && v.suspensionEndDate), {
    message: 'suspensionStartDate and suspensionEndDate are required when decision is "suspended"',
  })

export const reinstateCaseSchema = z.object({
  reinstatedBy: z.number().int().positive(),
})

export type OpenCaseInput = z.infer<typeof openCaseSchema>
export type SummonParentInput = z.infer<typeof summonParentSchema>
export type RecordParentAttendanceInput = z.infer<typeof recordParentAttendanceSchema>
export type RecordHearingInput = z.infer<typeof recordHearingSchema>
export type BomReviewInput = z.infer<typeof bomReviewSchema>
export type DecideCaseInput = z.infer<typeof decideCaseSchema>
export type ReinstateCaseInput = z.infer<typeof reinstateCaseSchema>
