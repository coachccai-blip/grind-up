import { z } from 'zod'
import { isAvatarId } from '../rules/avatars.js'
import type { LevelProgress } from '../rules/levels.js'
import type { AssignmentStatus, QuestCategory, QuestFormat, QuestState } from '../rules/quests.js'
import type { Streak } from '../rules/streak.js'

/** Formats des échanges autour de la progression : XP, niveau, série, badges. */

/** Une ligne du journal d'XP, prête à être affichée. */
export interface XpEntry {
  id: string
  /** Montant, positif ou négatif. */
  amount: number
  reason: 'quest' | 'bonus' | 'manual' | 'bot'
  /** Ce qui explique la ligne : la quête, le bonus, le motif de l'ajustement. */
  label: string
  /** Quête liée, s'il y en a une. */
  questTitle: string | null
  createdAt: string
}

/** Un badge du jeu de départ, obtenu ou non, avec l'avancement vers sa condition. */
export interface BadgeProgress {
  code: string
  earnedAt: string | null
  done: number
  goal: number
}

/**
 * Ce que l'élève n'a pas encore vu : ses quêtes validées depuis sa dernière
 * visite, un passage de niveau, son entrée sur le podium, de nouveaux badges.
 * L'interface le fête, puis le signale comme vu.
 */
export interface Celebration {
  validations: { questId: string; title: string; xp: number }[]
  xpGained: number
  levelUp: { from: number; to: number } | null
  /**
   * Entrée sur le podium de la semaine : la place de l'élève, de 1 à 3. Annoncée
   * avec la quête qui l'y a mené, une fois par semaine.
   */
  podium: { rank: number } | null
  badges: string[]
}

export interface StudentProgress {
  xp: number
  level: LevelProgress
  /** Missions accomplies : les quêtes validées. */
  missions: number
  streak: Streak
  badges: BadgeProgress[]
  /** Dernières lignes du journal d'XP. */
  recentRewards: XpEntry[]
  celebration: Celebration | null
}

export interface ProgressResponse {
  progress: StudentProgress
}

export interface JournalResponse {
  entries: XpEntry[]
}

export const avatarRequestSchema = z.object({
  avatar: z.string().refine(isAvatarId, 'Cet avatar ne fait pas partie de la galerie.'),
})

// --- Côté admin ------------------------------------------------------------------------------

export const XP_ADJUSTMENT_MAX = 10_000
export const XP_REASON_MAX = 200

/** Ajustement manuel d'XP : un montant positif ou négatif, et un motif obligatoire. */
export const xpAdjustmentRequestSchema = z.object({
  amount: z
    .number('Indiquez un montant en XP.')
    .int('Le montant est un nombre entier.')
    .min(-XP_ADJUSTMENT_MAX, `De -${XP_ADJUSTMENT_MAX} à ${XP_ADJUSTMENT_MAX}\u00A0XP.`)
    .max(XP_ADJUSTMENT_MAX, `De -${XP_ADJUSTMENT_MAX} à ${XP_ADJUSTMENT_MAX}\u00A0XP.`)
    .refine((amount) => amount !== 0, 'Le montant ne peut pas être nul.'),
  reason: z
    .string()
    .trim()
    .min(1, 'Indiquez le motif de cet ajustement.')
    .max(XP_REASON_MAX, `${XP_REASON_MAX} caractères au maximum.`),
})
export type XpAdjustmentRequest = z.infer<typeof xpAdjustmentRequestSchema>

export const cancelValidationRequestSchema = z.object({
  comment: z.string().trim().max(500, '500 caractères au maximum.').default(''),
})

/** Une quête d'un élève, vue depuis sa fiche dans l'espace admin. */
export interface StudentAssignment {
  assignmentId: string
  quest: {
    id: string
    title: string
    category: QuestCategory
    format: QuestFormat
    rewardXp: number
    deadlineAt: string | null
    state: QuestState
  }
  status: AssignmentStatus
  blocked: boolean
  attemptsUsed: number
  attemptsAllowed: number
  xpAwarded: number | null
  validatedAt: string | null
}

/** La progression d'un élève, pour sa fiche dans l'espace admin. */
export interface AdminStudentProgress {
  xp: number
  level: LevelProgress
  missions: number
  streak: Streak
  badges: BadgeProgress[]
  assignments: StudentAssignment[]
  journal: XpEntry[]
}

export interface AdminStudentProgressResponse {
  progress: AdminStudentProgress
}
