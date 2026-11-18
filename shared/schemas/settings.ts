import { z } from 'zod'
import type { GameSettings } from '../rules/settings.js'
import { MAX_ATTEMPTS_LIMIT, MAX_REWARD } from './quests.js'

/** Formats des échanges autour des paramètres de l'admin. */

const reward = z
  .number('Indiquez une récompense en XP.')
  .int('La récompense est un nombre entier.')
  .min(0, 'La récompense ne peut pas être négative.')
  .max(MAX_REWARD, `${MAX_REWARD}\u00A0XP au maximum.`)

const percent = z
  .number('Indiquez un pourcentage.')
  .int('Le pourcentage est un nombre entier.')
  .min(0, 'De 0 à 100\u00A0%.')
  .max(100, 'De 0 à 100\u00A0%.')

/**
 * Modification des paramètres : seuls les champs envoyés changent. Un barème
 * envoyé l'est en entier, avec ses quatre difficultés.
 */
export const updateSettingsRequestSchema = z
  .object({
    rewards: z.object({ easy: reward, medium: reward, hard: reward, epic: reward }),
    earlyBonusPercent: percent,
    flawlessBonusPercent: percent,
    latePercent: percent,
    defaultPassThreshold: z
      .number('Indiquez un seuil de réussite.')
      .int('Le seuil est un nombre entier.')
      .min(1, 'Le seuil va de 1 à 100\u00A0%.')
      .max(100, 'Le seuil va de 1 à 100\u00A0%.'),
    defaultMaxAttempts: z
      .number('Indiquez un nombre de tentatives.')
      .int('Le nombre de tentatives est un nombre entier.')
      .min(1, 'Au moins une tentative.')
      .max(MAX_ATTEMPTS_LIMIT, `${MAX_ATTEMPTS_LIMIT} tentatives au maximum.`),
    showBotLabel: z.boolean(),
  })
  .partial()
  .refine((changes) => Object.keys(changes).length > 0, {
    message: 'Aucune modification demandée.',
  })
export type UpdateSettingsRequest = z.infer<typeof updateSettingsRequestSchema>

export interface AdminSettingsResponse {
  settings: GameSettings
}
