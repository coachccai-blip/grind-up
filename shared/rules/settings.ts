import {
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_PASS_THRESHOLD,
  QUEST_DIFFICULTIES,
  type QuestDifficulty,
} from './quests.js'
import { DEFAULT_REWARD_RULES, type RewardRules } from './rewards.js'

/**
 * Paramètres du jeu (sections 4 et 7 du brief). Le barème d'XP, les bonus et
 * les valeurs proposées pour une nouvelle quête sont des valeurs par défaut,
 * que l'admin peut modifier dans ses paramètres.
 */

/** Récompense proposée pour une quête, selon sa difficulté. */
export type RewardTable = Record<QuestDifficulty, number>

export interface GameSettings {
  rewards: RewardTable
  /** Bonus d'avance, en points de pourcentage : 10 pour +10 %. */
  earlyBonusPercent: number
  /** Bonus sans faute, en points de pourcentage. */
  flawlessBonusPercent: number
  /** Part de la récompense gardée par une quête rendue en retard, en points de pourcentage. */
  latePercent: number
  /** Seuil de réussite proposé pour une nouvelle quête corrigée automatiquement. */
  defaultPassThreshold: number
  /** Nombre de tentatives proposé pour une nouvelle quête corrigée automatiquement. */
  defaultMaxAttempts: number
  /** Montrer l'étiquette « Bot » aux élèves, dans le leaderboard. */
  showBotLabel: boolean
}

/** Le barème du brief : 50, 100, 200 et 400 XP. */
export const DEFAULT_REWARDS = Object.fromEntries(
  QUEST_DIFFICULTIES.map((difficulty) => [difficulty.id, difficulty.defaultReward]),
) as RewardTable

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  rewards: DEFAULT_REWARDS,
  earlyBonusPercent: DEFAULT_REWARD_RULES.earlyBonusPercent,
  flawlessBonusPercent: DEFAULT_REWARD_RULES.flawlessBonusPercent,
  latePercent: DEFAULT_REWARD_RULES.latePercent,
  defaultPassThreshold: DEFAULT_PASS_THRESHOLD,
  defaultMaxAttempts: DEFAULT_MAX_ATTEMPTS,
  showBotLabel: false,
}

/** Les règles de calcul de l'XP d'une quête validée, d'après les paramètres. */
export function rewardRulesOf(
  settings: Pick<GameSettings, 'earlyBonusPercent' | 'flawlessBonusPercent' | 'latePercent'>,
): RewardRules {
  return {
    earlyBonusPercent: settings.earlyBonusPercent,
    flawlessBonusPercent: settings.flawlessBonusPercent,
    latePercent: settings.latePercent,
    // L'avance qui donne droit au bonus reste celle du brief : plus de 24 h.
    earlyBonusHours: DEFAULT_REWARD_RULES.earlyBonusHours,
  }
}
