import {
  DEFAULT_GAME_SETTINGS,
  rewardRulesOf,
  type GameSettings,
} from '../../shared/rules/settings.js'
import type { RewardRules } from '../../shared/rules/rewards.js'
import type { UpdateSettingsRequest } from '../../shared/schemas/settings.js'
import type { SqlReader, SqlRow, SqlWriter } from '../db/sqlite.js'

/**
 * Paramètres globaux : une table à une seule ligne (section 9 du brief). Le
 * barème, les bonus et les valeurs proposées pour une nouvelle quête y sont
 * lus à chaque usage : un changement s'applique aussitôt, sans rien recalculer
 * de ce qui est déjà crédité.
 */
interface SettingsRow extends SqlRow {
  show_bot_label: number
  reward_easy: number
  reward_medium: number
  reward_hard: number
  reward_epic: number
  early_bonus_percent: number
  flawless_bonus_percent: number
  late_percent: number
  default_pass_threshold: number
  default_max_attempts: number
}

export function readGameSettings(tx: SqlReader): GameSettings {
  const row = tx.get<SettingsRow>(
    `SELECT show_bot_label, reward_easy, reward_medium, reward_hard, reward_epic,
            early_bonus_percent, flawless_bonus_percent, late_percent,
            default_pass_threshold, default_max_attempts
     FROM settings WHERE id = 1`,
  )
  if (!row) return DEFAULT_GAME_SETTINGS
  return {
    rewards: {
      easy: row.reward_easy,
      medium: row.reward_medium,
      hard: row.reward_hard,
      epic: row.reward_epic,
    },
    earlyBonusPercent: row.early_bonus_percent,
    flawlessBonusPercent: row.flawless_bonus_percent,
    latePercent: row.late_percent,
    defaultPassThreshold: row.default_pass_threshold,
    defaultMaxAttempts: row.default_max_attempts,
    showBotLabel: row.show_bot_label === 1,
  }
}

/** Les règles de calcul de l'XP en vigueur. */
export function readRewardRules(tx: SqlReader): RewardRules {
  return rewardRulesOf(readGameSettings(tx))
}

/** Valeurs proposées pour une nouvelle quête corrigée automatiquement. */
export function readQuestDefaults(tx: SqlReader): { passThreshold: number; maxAttempts: number } {
  const settings = readGameSettings(tx)
  return {
    passThreshold: settings.defaultPassThreshold,
    maxAttempts: settings.defaultMaxAttempts,
  }
}

/** Enregistre les paramètres envoyés ; les autres gardent leur valeur. */
export function updateGameSettings(tx: SqlWriter, changes: UpdateSettingsRequest): GameSettings {
  const settings = { ...readGameSettings(tx), ...changes }
  tx.run(
    `INSERT INTO settings (
       id, show_bot_label, reward_easy, reward_medium, reward_hard, reward_epic,
       early_bonus_percent, flawless_bonus_percent, late_percent,
       default_pass_threshold, default_max_attempts
     ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       show_bot_label = excluded.show_bot_label,
       reward_easy = excluded.reward_easy,
       reward_medium = excluded.reward_medium,
       reward_hard = excluded.reward_hard,
       reward_epic = excluded.reward_epic,
       early_bonus_percent = excluded.early_bonus_percent,
       flawless_bonus_percent = excluded.flawless_bonus_percent,
       late_percent = excluded.late_percent,
       default_pass_threshold = excluded.default_pass_threshold,
       default_max_attempts = excluded.default_max_attempts`,
    [
      settings.showBotLabel ? 1 : 0,
      settings.rewards.easy,
      settings.rewards.medium,
      settings.rewards.hard,
      settings.rewards.epic,
      settings.earlyBonusPercent,
      settings.flawlessBonusPercent,
      settings.latePercent,
      settings.defaultPassThreshold,
      settings.defaultMaxAttempts,
    ],
  )
  return readGameSettings(tx)
}
