import type { Migration } from '../migrate.js'

/**
 * Étape 2 (fondations) : les comptes.
 *
 * - users : élèves, admins et bots. `pseudo_key` est le pseudo sans majuscules ni
 *   accents ; son unicité empêche deux pseudos de se ressembler. Un élève a un
 *   identifiant public XXXX-XXXX, un admin et un bot n'en ont pas ; un bot n'a
 *   pas de mot de passe.
 * - app_secrets : clé qui signe les sessions, générée au premier lancement.
 * - rate_limits : compteurs de tentatives par adresse IP (stockée hachée).
 */
export const migration0002: Migration = {
  id: '0002_create_users',
  sql: `
    CREATE TABLE users (
      id                   TEXT PRIMARY KEY,
      role                 TEXT NOT NULL CHECK (role IN ('student', 'admin', 'bot')),
      pseudo               TEXT NOT NULL,
      pseudo_key           TEXT NOT NULL UNIQUE,
      public_id            TEXT UNIQUE,
      password_hash        TEXT,
      must_change_password INTEGER NOT NULL DEFAULT 0 CHECK (must_change_password IN (0, 1)),
      session_version      INTEGER NOT NULL DEFAULT 1,
      avatar               TEXT NOT NULL,
      is_active            INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at           TEXT NOT NULL,
      last_active_at       TEXT,
      CHECK ((role = 'student') = (public_id IS NOT NULL)),
      CHECK (role = 'bot' OR password_hash IS NOT NULL)
    ) STRICT;

    CREATE TABLE app_secrets (
      name       TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE rate_limits (
      bucket       TEXT NOT NULL,
      subject      TEXT NOT NULL,
      window_start TEXT NOT NULL,
      hits         INTEGER NOT NULL,
      PRIMARY KEY (bucket, subject, window_start)
    ) STRICT;
  `,
}
