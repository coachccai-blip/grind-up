import { z } from 'zod'
import { isAvatarId } from '../rules/avatars.js'
import {
  BOT_MISSIONS_MAX,
  BOT_MISSIONS_MIN,
  DEFAULT_BOT_MISSIONS,
  DEFAULT_DIFFICULTY_MIX,
  type BotMode,
  type BotTarget,
  type DifficultyMix,
} from '../rules/bots.js'
import {
  LEADERBOARD_PERIOD_IDS,
  type LeaderboardPeriod,
  type LeaderboardSort,
} from '../rules/leaderboard.js'
import { pseudoSchema } from './auth.js'

/** Formats des échanges autour du leaderboard et des bots. */

export const leaderboardQuerySchema = z.object({
  period: z.enum(LEADERBOARD_PERIOD_IDS).default('week'),
  sort: z.enum(['missions', 'xp']).default('missions'),
})

/** Une ligne du classement. Les identifiants internes des participants n'y figurent pas. */
export interface LeaderboardEntry {
  /** Rang, à partir de 1 ; null pour un participant sans mission ni XP sur la période. */
  rank: number | null
  pseudo: string
  avatar: string
  /** Niveau, d'après l'XP totale du participant. */
  level: number
  /** Missions accomplies sur la période. */
  missions: number
  /** XP gagnée sur la période. */
  xp: number
  /** Places gagnées (positif) ou perdues (négatif) depuis la veille ; null si sans objet. */
  movement: number | null
  /** Vrai pour la ligne de l'utilisateur connecté. */
  isYou: boolean
  /** Vrai pour un bot, quand celui qui regarde a le droit de le savoir. */
  isBot: boolean
}

export interface LeaderboardResponse {
  period: LeaderboardPeriod
  sort: LeaderboardSort
  entries: LeaderboardEntry[]
}

// --- Bots, côté admin ------------------------------------------------------------------------

const weight = z.number().int().min(0, 'De 0 à 100.').max(100, 'De 0 à 100.')

export const difficultyMixSchema = z
  .object({ easy: weight, medium: weight, hard: weight, epic: weight })
  .refine((mix) => mix.easy + mix.medium + mix.hard + mix.epic > 0, {
    message: 'Donnez un poids à une difficulté au moins.',
  })

const botFields = {
  pseudo: pseudoSchema,
  avatar: z.string().refine(isAvatarId, 'Cet avatar ne fait pas partie de la galerie.'),
  mode: z.enum(['regular', 'adaptive']),
  missionsPerWeek: z
    .number('Indiquez un nombre de missions.')
    .int('Indiquez un nombre entier.')
    .min(BOT_MISSIONS_MIN, `De ${BOT_MISSIONS_MIN} à ${BOT_MISSIONS_MAX} missions par semaine.`)
    .max(BOT_MISSIONS_MAX, `De ${BOT_MISSIONS_MIN} à ${BOT_MISSIONS_MAX} missions par semaine.`),
  target: z.enum(['ahead_of_first', 'middle', 'behind_last']),
  difficultyMix: difficultyMixSchema,
  /** Plafond : le bot ne dépasse jamais le premier élève réel. */
  capped: z.boolean(),
}

export const createBotRequestSchema = z.object({
  ...botFields,
  missionsPerWeek: botFields.missionsPerWeek.default(DEFAULT_BOT_MISSIONS),
  target: botFields.target.default('middle'),
  difficultyMix: difficultyMixSchema.default(DEFAULT_DIFFICULTY_MIX),
  capped: botFields.capped.default(true),
})
export type CreateBotRequest = z.infer<typeof createBotRequestSchema>

export const updateBotRequestSchema = z
  .object({ ...botFields, paused: z.boolean() })
  .partial()
  .refine((changes) => Object.keys(changes).length > 0, {
    message: 'Aucune modification demandée.',
  })
export type UpdateBotRequest = z.infer<typeof updateBotRequestSchema>

export const BOT_ADJUST_MISSIONS_MAX = 20
export const BOT_ADJUST_XP_MAX = 10_000

/** Ajustement manuel d'un bot : des missions et de l'XP, en plus ou en moins. */
export const adjustBotRequestSchema = z
  .object({
    missions: z
      .number()
      .int()
      .min(-BOT_ADJUST_MISSIONS_MAX, `De -${BOT_ADJUST_MISSIONS_MAX} à ${BOT_ADJUST_MISSIONS_MAX}.`)
      .max(BOT_ADJUST_MISSIONS_MAX, `De -${BOT_ADJUST_MISSIONS_MAX} à ${BOT_ADJUST_MISSIONS_MAX}.`)
      .default(0),
    xp: z
      .number()
      .int()
      .min(-BOT_ADJUST_XP_MAX, `De -${BOT_ADJUST_XP_MAX} à ${BOT_ADJUST_XP_MAX}\u00A0XP.`)
      .max(BOT_ADJUST_XP_MAX, `De -${BOT_ADJUST_XP_MAX} à ${BOT_ADJUST_XP_MAX}\u00A0XP.`)
      .default(0),
  })
  .refine((change) => change.missions !== 0 || change.xp !== 0, {
    message: 'Indiquez des missions ou de l’XP à ajouter ou à retirer.',
  })
export type AdjustBotRequest = z.infer<typeof adjustBotRequestSchema>

/** Un bot et ses réglages, pour l'espace admin. */
export interface AdminBot {
  id: string
  pseudo: string
  avatar: string
  mode: BotMode
  missionsPerWeek: number
  target: BotTarget
  difficultyMix: DifficultyMix
  capped: boolean
  paused: boolean
  /** Totaux depuis la création du bot. */
  missions: number
  xp: number
  level: number
  /** Missions accomplies cette semaine. */
  missionsThisWeek: number
  createdAt: string
}

export interface AdminBotsResponse {
  bots: AdminBot[]
}

export interface AdminBotResponse {
  bot: AdminBot
}
