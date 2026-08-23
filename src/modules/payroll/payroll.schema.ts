import { z } from 'zod'

export const createEmployeeSchema = z.object({
  staffNo: z.string().min(1).max(30),
  fullName: z.string().min(1).max(150),
  idNumber: z.string().max(20).optional(),
  kraPin: z.string().max(20).optional(),
  nssfNo: z.string().max(30).optional(),
  shifNo: z.string().max(30).optional(),
  jobTitle: z.string().max(100).optional(),
  employmentType: z.enum(['permanent', 'contract', 'casual']).default('permanent'),
  bankName: z.string().max(100).optional(),
  bankAccountNo: z.string().max(40).optional(),
  employmentDate: z.string().date(),
})

export const addSalaryComponentSchema = z.object({
  componentType: z.enum(['basic', 'allowance', 'deduction']),
  name: z.string().min(1).max(100),
  amount: z.union([z.string(), z.number()]),
  isPercentageOfBasic: z.boolean().default(false),
})

export const createPayrollRunSchema = z.object({
  periodId: z.number().int().positive(),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/),
})

export const processPayrollRunSchema = z.object({
  fundId: z.number().int().positive(),
  salariesExpenseAccountId: z.number().int().positive(),
  payeAccountId: z.number().int().positive(),
  nssfAccountId: z.number().int().positive(),
  shifAccountId: z.number().int().positive(),
  otherDeductionsAccountId: z.number().int().positive().optional(),
  netPayAccountId: z.number().int().positive(),
  entryDate: z.string().date(),
  processedBy: z.number().int().positive(),
})

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type AddSalaryComponentInput = z.infer<typeof addSalaryComponentSchema>
export type CreatePayrollRunInput = z.infer<typeof createPayrollRunSchema>
export type ProcessPayrollRunInput = z.infer<typeof processPayrollRunSchema>
