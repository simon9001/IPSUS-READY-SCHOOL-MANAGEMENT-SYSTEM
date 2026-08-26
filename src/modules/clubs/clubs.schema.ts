import { z } from 'zod'

export const createClubSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['club', 'sport', 'society']).default('club'),
  patronStaffId: z.number().int().positive().optional(),
  description: z.string().optional(),
})

export const joinClubSchema = z.object({
  clubId: z.number().int().positive(),
  studentId: z.number().int().positive(),
  joinedDate: z.string().date(),
  role: z.string().max(60).optional(),
})

export const createCompetitionSchema = z.object({
  name: z.string().min(1).max(150),
  clubId: z.number().int().positive().optional(),
  level: z.enum(['school', 'zonal', 'county', 'regional', 'national']).default('school'),
  competitionDate: z.string().date(),
  venue: z.string().max(150).optional(),
})

export const addParticipantSchema = z.object({
  competitionId: z.number().int().positive(),
  studentId: z.number().int().positive(),
  result: z.string().max(100).optional(),
  achievement: z.string().optional(),
})

export type CreateClubInput = z.infer<typeof createClubSchema>
export type JoinClubInput = z.infer<typeof joinClubSchema>
export type CreateCompetitionInput = z.infer<typeof createCompetitionSchema>
export type AddParticipantInput = z.infer<typeof addParticipantSchema>
