import type { Migration } from '../migrate.js'

/**
 * Étape 4 (progression).
 *
 * - badges : les badges obtenus. Un badge ne s'obtient qu'une fois ; `seen_at`
 *   reste vide tant que l'élève n'a pas vu l'annonce de son nouveau badge.
 * - assignments.celebrated_at : vide tant que l'élève n'a pas vu l'annonce de la
 *   validation de sa quête (gain d'XP, passage de niveau).
 */
export const migration0004: Migration = {
  id: '0004_create_badges',
  sql: `
    CREATE TABLE badges (
      id        TEXT PRIMARY KEY,
      user_id   TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      code      TEXT NOT NULL,
      earned_at TEXT NOT NULL,
      seen_at   TEXT,
      UNIQUE (user_id, code)
    ) STRICT;

    ALTER TABLE assignments ADD COLUMN celebrated_at TEXT;

    -- Les quêtes validées avant cette étape ne sont pas annoncées après coup.
    UPDATE assignments SET celebrated_at = validated_at WHERE status = 'validated';
  `,
}
