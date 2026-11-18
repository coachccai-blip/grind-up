import { z } from 'zod'
import { pseudoSchema } from './auth.js'

/** Un élève dans la liste de l'espace admin. */
export interface AdminStudent {
  id: string
  pseudo: string
  publicId: string
  avatar: string
  isActive: boolean
  /** Dates en UTC (ISO 8601). */
  createdAt: string
  lastActiveAt: string | null
}

export interface AdminStudentsResponse {
  students: AdminStudent[]
}

export interface AdminStudentResponse {
  student: AdminStudent
}

export const updateStudentRequestSchema = z
  .object({
    pseudo: pseudoSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((changes) => changes.pseudo !== undefined || changes.isActive !== undefined, {
    message: 'Aucune modification demandée.',
  })
export type UpdateStudentRequest = z.infer<typeof updateStudentRequestSchema>

export interface TemporaryPasswordResponse {
  temporaryPassword: string
}
