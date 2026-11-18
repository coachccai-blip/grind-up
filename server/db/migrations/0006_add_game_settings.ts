import type { Migration } from '../migrate.js'

/**
 * Étape 6 (finitions).
 *
 * - settings : le barème d'XP, les bonus et les valeurs proposées pour une
 *   nouvelle quête rejoignent la ligne unique des paramètres. Leurs valeurs par
 *   défaut sont celles du brief (section 4).
 * - users.podium_seen_week : le lundi de la dernière semaine dont l'entrée sur
 *   le podium a été annoncée à l'élève. L'annonce n'est faite qu'une fois par
 *   semaine.
 */
export const migration0006: Migration = {
  id: '0006_add_game_settings',
  sql: `
    ALTER TABLE settings ADD COLUMN reward_easy INTEGER NOT NULL DEFAULT 50
      CHECK (reward_easy BETWEEN 0 AND 10000);
    ALTER TABLE settings ADD COLUMN reward_medium INTEGER NOT NULL DEFAULT 100
      CHECK (reward_medium BETWEEN 0 AND 10000);
    ALTER TABLE settings ADD COLUMN reward_hard INTEGER NOT NULL DEFAULT 200
      CHECK (reward_hard BETWEEN 0 AND 10000);
    ALTER TABLE settings ADD COLUMN reward_epic INTEGER NOT NULL DEFAULT 400
      CHECK (reward_epic BETWEEN 0 AND 10000);

    ALTER TABLE settings ADD COLUMN early_bonus_percent INTEGER NOT NULL DEFAULT 10
      CHECK (early_bonus_percent BETWEEN 0 AND 100);
    ALTER TABLE settings ADD COLUMN flawless_bonus_percent INTEGER NOT NULL DEFAULT 10
      CHECK (flawless_bonus_percent BETWEEN 0 AND 100);
    ALTER TABLE settings ADD COLUMN late_percent INTEGER NOT NULL DEFAULT 50
      CHECK (late_percent BETWEEN 0 AND 100);

    ALTER TABLE settings ADD COLUMN default_pass_threshold INTEGER NOT NULL DEFAULT 80
      CHECK (default_pass_threshold BETWEEN 1 AND 100);
    ALTER TABLE settings ADD COLUMN default_max_attempts INTEGER NOT NULL DEFAULT 3
      CHECK (default_max_attempts BETWEEN 1 AND 10);

    ALTER TABLE users ADD COLUMN podium_seen_week TEXT;
  `,
}
