import type { Migration } from '../migrate.js'

/**
 * Étape 1 (test de déploiement) : une table qui garde la trace des dernières
 * vérifications de /api/sante, pour prouver que la fonction lit et écrit en base.
 */
export const migration0001: Migration = {
  id: '0001_create_health_pings',
  sql: `
    CREATE TABLE health_pings (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      pinged_at TEXT NOT NULL
    ) STRICT;
  `,
}
