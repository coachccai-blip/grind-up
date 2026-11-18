import type { Migration } from '../migrate.js'

/**
 * Étape 5 (leaderboard et bots).
 *
 * - bot_settings : les réglages d'un bot, un par bot. `difficulty_mix` (JSON) donne
 *   un poids à chaque difficulté ; `schedule` (JSON) garde le planning de la semaine
 *   `schedule_week` pour un bot régulier ; `progressed_at` est l'instant jusqu'auquel
 *   sa progression a été calculée.
 * - settings : les paramètres globaux, sur une seule ligne. `podium_awarded_week` est
 *   le lundi de la dernière semaine dont le badge Podium a été attribué.
 */
export const migration0005: Migration = {
  id: '0005_create_bots',
  sql: `
    CREATE TABLE bot_settings (
      user_id           TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
      mode              TEXT NOT NULL CHECK (mode IN ('regular', 'adaptive')),
      missions_per_week INTEGER NOT NULL CHECK (missions_per_week BETWEEN 1 AND 20),
      target            TEXT NOT NULL CHECK (target IN ('ahead_of_first', 'middle', 'behind_last')),
      difficulty_mix    TEXT NOT NULL,
      capped            INTEGER NOT NULL CHECK (capped IN (0, 1)),
      state             TEXT NOT NULL CHECK (state IN ('active', 'paused')),
      schedule_week     TEXT,
      schedule          TEXT NOT NULL DEFAULT '[]',
      progressed_at     TEXT NOT NULL
    ) STRICT;

    CREATE TABLE settings (
      id                  INTEGER PRIMARY KEY CHECK (id = 1),
      show_bot_label      INTEGER NOT NULL DEFAULT 0 CHECK (show_bot_label IN (0, 1)),
      podium_awarded_week TEXT
    ) STRICT;

    INSERT INTO settings (id) VALUES (1);
  `,
}
