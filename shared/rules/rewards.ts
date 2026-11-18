import { isLate } from './assignment-status.js'

/**
 * Calcul de l'XP d'une quête validée (section 4 du brief).
 *
 * - Bonus d'avance : +10 % si la quête est validée ou soumise plus de 24 h avant la deadline.
 * - Bonus sans faute : +10 % si un format corrigé automatiquement est réussi à 100 % dès la
 *   première tentative.
 * - Quête rouverte et réalisée après la deadline : 50 % de la récompense.
 * - Les bonus se cumulent (ils s'additionnent) ; le total est arrondi à l'entier le plus proche.
 */
export interface RewardRules {
  /** Pourcentages, en points : 10 pour +10 %. */
  earlyBonusPercent: number
  flawlessBonusPercent: number
  /** Part de la récompense gardée pour une quête réalisée en retard, en points. */
  latePercent: number
  /** Avance nécessaire, en heures, pour le bonus d'avance. */
  earlyBonusHours: number
}

export const DEFAULT_REWARD_RULES: RewardRules = {
  earlyBonusPercent: 10,
  flawlessBonusPercent: 10,
  latePercent: 50,
  earlyBonusHours: 24,
}

export type BonusKind = 'early' | 'flawless'

export const BONUS_LABELS: Record<BonusKind, string> = {
  early: 'Bonus d’avance',
  flawless: 'Bonus sans faute',
}

export interface RewardInput {
  /** Récompense affichée sur la quête. */
  reward: number
  /** Deadline de la quête (UTC, ISO 8601), ou null. */
  deadlineAt: string | null
  /** Date qui fait foi : la soumission pour une validation manuelle, sinon la validation. */
  completedAt: Date
  /** Format corrigé automatiquement, réussi à 100 % dès la première tentative. */
  flawlessFirstAttempt: boolean
}

export interface RewardBreakdown {
  /** XP de la quête elle-même : la récompense, ou sa part gardée en cas de retard. */
  base: number
  /** Vrai si la quête a été réalisée après sa deadline. */
  late: boolean
  bonuses: { kind: BonusKind; amount: number }[]
  /** XP totale créditée : base + bonus. */
  total: number
}

const HOUR_MS = 60 * 60 * 1000

export function computeReward(
  input: RewardInput,
  rules: RewardRules = DEFAULT_REWARD_RULES,
): RewardBreakdown {
  const late = isLate(input.deadlineAt, input.completedAt)
  const basePercent = late ? rules.latePercent : 100

  const kinds: { kind: BonusKind; percent: number }[] = []
  const early =
    input.deadlineAt !== null &&
    new Date(input.deadlineAt).getTime() - input.completedAt.getTime() >
      rules.earlyBonusHours * HOUR_MS
  if (early) kinds.push({ kind: 'early', percent: rules.earlyBonusPercent })
  if (input.flawlessFirstAttempt) {
    kinds.push({ kind: 'flawless', percent: rules.flawlessBonusPercent })
  }

  // Calculs en entiers : aucun arrondi parasite dû aux nombres à virgule.
  const base = Math.round((input.reward * basePercent) / 100)
  const bonusPercent = kinds.reduce((sum, bonus) => sum + bonus.percent, 0)
  const total = Math.round((input.reward * basePercent * (100 + bonusPercent)) / 10_000)

  // Le total fait foi : le dernier bonus absorbe l'écart d'arrondi.
  let remaining = total - base
  const bonuses = kinds.map((bonus, index) => {
    const isLast = index === kinds.length - 1
    const share = Math.round((input.reward * basePercent * bonus.percent) / 10_000)
    const amount = isLast ? remaining : Math.min(share, remaining)
    remaining -= amount
    return { kind: bonus.kind, amount }
  })

  return { base, late, bonuses, total }
}
