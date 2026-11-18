import { z } from 'zod'
import type { QuestCategory } from '../rules/quests.js'
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
  xp: number
  level: number
  /** Missions accomplies : les quêtes validées. */
  missions: number
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

// --- Vue d'ensemble --------------------------------------------------------------------------

/** Une quête « expire bientôt » quand sa deadline tombe dans ce délai, en heures. */
export const EXPIRING_WINDOW_HOURS = 48
/** Un élève est « inactif » après ce nombre de jours sans visite. */
export const INACTIVITY_DAYS = 7

/** Ce qui demande l'attention de l'admin (section 7 du brief). */
export interface AdminOverview {
  /** Comptes élèves, désactivés compris : zéro tant que personne ne s'est inscrit. */
  totalStudents: number
  /** Comptes élèves actifs. */
  activeStudents: number
  /** Quêtes publiées qu'un élève au moins doit encore finir, ou dont il attend la validation. */
  questsInProgress: number
  /** Réalisations en attente de validation. */
  pendingValidations: number
  /** Quêtes dont la deadline tombe dans les 48 h et qu'un élève au moins n'a pas terminées. */
  expiringSoon: {
    id: string
    title: string
    category: QuestCategory
    deadlineAt: string
    /** Élèves qui ne l'ont pas encore terminée. */
    remaining: number
  }[]
  /** Élèves actifs sans visite depuis 7 jours, du plus anciennement vu au plus récent. */
  inactiveStudents: {
    id: string
    pseudo: string
    avatar: string
    lastActiveAt: string | null
  }[]
}

export interface AdminOverviewResponse {
  overview: AdminOverview
}
