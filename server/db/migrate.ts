import { createHash } from 'node:crypto'
import type { SqlReader, SqlWriter } from './sqlite.js'

/**
 * Migrations : chaque changement de structure de la base est une étape numérotée,
 * appliquée une seule fois et dans l'ordre. Une migration déjà appliquée ne se
 * modifie jamais : une correction est une nouvelle migration.
 */
export interface Migration {
  /** « NNNN_description » : le numéro fixe l'ordre d'application. */
  id: string
  sql: string
}

export class MigrationError extends Error {
  override name = 'MigrationError'
}

const MIGRATION_ID = /^\d{4}_[a-z0-9_]+$/

const CREATE_TRACKING_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id         TEXT PRIMARY KEY,
    checksum   TEXT NOT NULL,
    applied_at TEXT NOT NULL
  ) STRICT;
`

/** Empreinte du SQL, insensible à la mise en page. */
function checksum(sql: string): string {
  return createHash('sha256').update(sql.replace(/\s+/g, ' ').trim()).digest('hex')
}

/** Vérifie que la liste des migrations du code est bien formée : identifiants valides, uniques et croissants. */
export function assertValidMigrationList(migrations: readonly Migration[]): void {
  migrations.forEach((migration, index) => {
    if (!MIGRATION_ID.test(migration.id)) {
      throw new MigrationError(
        `Identifiant de migration invalide : « ${migration.id} » (attendu : NNNN_description).`,
      )
    }
    const previous = migrations[index - 1]
    if (previous && previous.id >= migration.id) {
      throw new MigrationError(
        `Les migrations doivent être en ordre croissant : « ${migration.id} » suit « ${previous.id} ».`,
      )
    }
  })
}

/**
 * Migrations du code qui ne sont pas encore appliquées à cette base.
 * Lève MigrationError si la base et le code ne racontent pas la même histoire.
 */
export function pendingMigrations(
  reader: SqlReader,
  migrations: readonly Migration[],
): Migration[] {
  const hasTrackingTable = reader.get(
    `SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'`,
  )
  const applied = hasTrackingTable
    ? reader.all<{ id: string; checksum: string }>(
        'SELECT id, checksum FROM schema_migrations ORDER BY id',
      )
    : []

  applied.forEach((row, index) => {
    const expected = migrations[index]
    if (!expected || expected.id !== row.id) {
      throw new MigrationError(
        `La base contient la migration « ${row.id} », que cette version du code ne connaît pas à cette place. ` +
          'La base est sans doute plus récente que le code publié.',
      )
    }
    if (checksum(expected.sql) !== row.checksum) {
      throw new MigrationError(
        `La migration « ${row.id} » a été modifiée après avoir été appliquée. ` +
          'Rétablir son contenu d’origine et écrire une nouvelle migration.',
      )
    }
  })

  return migrations.slice(applied.length)
}

/** Applique les migrations en attente et renvoie leurs identifiants. À appeler dans une transaction. */
export function applyPendingMigrations(
  writer: SqlWriter,
  migrations: readonly Migration[],
  now: Date,
): string[] {
  const pending = pendingMigrations(writer, migrations)
  if (pending.length === 0) return []

  writer.exec(CREATE_TRACKING_TABLE)
  for (const migration of pending) {
    writer.exec(migration.sql)
    writer.run('INSERT INTO schema_migrations (id, checksum, applied_at) VALUES (?, ?, ?)', [
      migration.id,
      checksum(migration.sql),
      now.toISOString(),
    ])
  }
  return pending.map((migration) => migration.id)
}
