import type { Database as SqliteFile } from 'sql.js'
import { parisDay } from '../../shared/time.js'
import type { BlobStore } from './blob-store.js'
import {
  applyPendingMigrations,
  assertValidMigrationList,
  pendingMigrations,
  type Migration,
} from './migrate.js'
import { loadSqlite, SqlReader, SqlWriter } from './sqlite.js'

/**
 * Base de données de Grind up : un fichier SQLite rangé dans un stockage de fichiers.
 *
 * Lecture : la fonction charge le fichier (ou réutilise sa copie en mémoire si
 * le fichier n'a pas changé) et l'interroge.
 *
 * Écriture : la fonction charge le fichier, applique les changements en mémoire
 * dans une transaction, puis réenregistre le fichier entier à condition que
 * personne ne l'ait modifié entre-temps. Sinon elle recommence sur la nouvelle
 * version. Une écriture est donc appliquée entièrement ou pas du tout, et deux
 * écritures simultanées ne peuvent pas se marcher dessus.
 */

/** Trop d'écritures simultanées : l'opération n'a pas pu passer malgré plusieurs essais. */
export class WriteConflictError extends Error {
  override name = 'WriteConflictError'

  constructor(attempts: number) {
    super(`Écriture abandonnée après ${attempts} essais : trop de modifications simultanées.`)
  }
}

export interface BackupOptions {
  /** Préfixe des copies dans le stockage. */
  prefix: string
  /** Nombre de copies quotidiennes conservées. */
  keep: number
}

export interface DatabaseOptions {
  store: BlobStore
  /** Emplacement du fichier de base dans le stockage. */
  key: string
  migrations: readonly Migration[]
  /** Copie quotidienne de la base ; null pour la désactiver. */
  backups: BackupOptions | null
  maxWriteAttempts?: number
  now?: () => Date
  sleep?: (milliseconds: number) => Promise<void>
}

interface LoadedFile {
  file: SqliteFile
  /** Étiquette de la version chargée ; null si le fichier n'existe pas encore dans le stockage. */
  etag: string | null
  /** Vrai une fois vérifié que toutes les migrations du code sont appliquées. */
  schemaIsCurrent: boolean
}

const CREATE_STORAGE_META = `
  CREATE TABLE IF NOT EXISTS storage_meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  ) STRICT;
`

function configure(file: SqliteFile): void {
  file.run('PRAGMA foreign_keys = ON')
}

function isThenable(value: unknown): boolean {
  return typeof (value as { then?: unknown } | null)?.then === 'function'
}

export class SqliteBlobDatabase {
  private readonly store: BlobStore
  private readonly key: string
  private readonly migrations: readonly Migration[]
  private readonly backups: BackupOptions | null
  private readonly maxWriteAttempts: number
  private readonly now: () => Date
  private readonly sleep: (milliseconds: number) => Promise<void>

  /** Copie en mémoire de la dernière version connue du fichier. */
  private loaded: LoadedFile | null = null
  /** File d'attente : une seule opération à la fois dans cette instance. */
  private tail: Promise<unknown> = Promise.resolve()

  constructor(options: DatabaseOptions) {
    assertValidMigrationList(options.migrations)
    this.store = options.store
    this.key = options.key
    this.migrations = options.migrations
    this.backups = options.backups
    this.maxWriteAttempts = options.maxWriteAttempts ?? 6
    this.now = options.now ?? (() => new Date())
    this.sleep =
      options.sleep ??
      ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)))
  }

  /** Lit la base. `query` ne peut rien modifier. */
  read<Result>(query: (tx: SqlReader) => Result): Promise<Result> {
    return this.enqueue(() => this.runRead(query))
  }

  /**
   * Modifie la base dans une transaction.
   *
   * `change` doit être synchrone et ne dépendre que de la base et de ses arguments :
   * en cas d'écriture simultanée, elle est rejouée sur la version la plus récente.
   */
  write<Result>(change: (tx: SqlWriter) => Result): Promise<Result> {
    return this.enqueue(() => this.runWrite(change))
  }

  /** Oublie la copie en mémoire : la prochaine opération relira le fichier depuis le stockage. */
  reload(): Promise<void> {
    return this.enqueue(async () => this.forget())
  }

  /** Description du stockage utilisé, pour le diagnostic. */
  describeStorage(): string {
    return `${this.store.describe()}, fichier « ${this.key} »`
  }

  /** Noms des copies quotidiennes conservées, de la plus ancienne à la plus récente. */
  async listBackups(): Promise<string[]> {
    if (!this.backups) return []
    return (await this.store.list(this.backups.prefix)).sort()
  }

  private enqueue<Result>(task: () => Promise<Result>): Promise<Result> {
    const run = this.tail.then(task, task)
    this.tail = run.catch(() => undefined)
    return run
  }

  private forget(): void {
    this.loaded?.file.close()
    this.loaded = null
  }

  /** Charge la version courante du fichier, en réutilisant la copie en mémoire si elle est à jour. */
  private async load(): Promise<LoadedFile> {
    const knownEtag = this.loaded?.etag ?? undefined
    let result = await this.store.read(this.key, knownEtag)
    if (result.status === 'unchanged') {
      if (this.loaded) return this.loaded
      result = await this.store.read(this.key)
    }

    this.forget()
    const sqlite = await loadSqlite()
    if (result.status === 'found') {
      const file = new sqlite.Database(result.blob.bytes)
      configure(file)
      this.loaded = { file, etag: result.blob.etag, schemaIsCurrent: false }
    } else {
      const file = new sqlite.Database()
      configure(file)
      this.loaded = { file, etag: null, schemaIsCurrent: false }
    }
    return this.loaded
  }

  private async runRead<Result>(query: (tx: SqlReader) => Result): Promise<Result> {
    let loaded = await this.load()
    if (!loaded.schemaIsCurrent) {
      const behind =
        loaded.etag === null ||
        pendingMigrations(new SqlReader(loaded.file), this.migrations).length > 0
      if (behind) {
        // Fichier absent ou en retard sur le code : on l'enregistre à jour avant de lire.
        await this.runWrite(() => undefined)
        loaded = this.loaded ?? (await this.load())
      }
      loaded.schemaIsCurrent = true
    }

    const { file } = loaded
    file.run('PRAGMA query_only = ON')
    try {
      return query(new SqlReader(file))
    } finally {
      file.run('PRAGMA query_only = OFF')
    }
  }

  private async runWrite<Result>(change: (tx: SqlWriter) => Result): Promise<Result> {
    for (let attempt = 1; ; attempt += 1) {
      const { file, etag } = await this.load()

      let result: Result
      let bytes: Uint8Array
      let backupDay: string | null
      try {
        const tx = new SqlWriter(file)
        tx.exec('BEGIN')
        applyPendingMigrations(tx, this.migrations, this.now())
        backupDay = this.claimDailyBackup(tx)
        result = change(tx)
        if (isThenable(result)) {
          throw new TypeError('La fonction passée à write() doit être synchrone.')
        }
        tx.exec('COMMIT')
        bytes = file.export()
        // export() rouvre le fichier en mémoire : on rétablit ses réglages.
        configure(file)
      } catch (error) {
        // La copie en mémoire ne correspond plus au fichier enregistré.
        this.forget()
        throw error
      }

      let outcome
      try {
        outcome = await this.store.write(
          this.key,
          bytes,
          etag === null ? { ifAbsent: true } : { ifMatch: etag },
        )
      } catch (error) {
        // On ignore si l'écriture est passée : la prochaine opération relira le fichier.
        this.forget()
        throw error
      }

      if (outcome.written) {
        this.loaded = { file, etag: outcome.etag, schemaIsCurrent: true }
        if (backupDay) await this.saveBackup(backupDay, bytes)
        return result
      }

      // Quelqu'un a écrit entre-temps : on repart de sa version.
      this.forget()
      if (attempt >= this.maxWriteAttempts) throw new WriteConflictError(attempt)
      await this.sleep(attempt * (20 + Math.random() * 60))
    }
  }

  /**
   * Si la copie du jour (fuseau Europe/Paris) n'a pas encore été faite, le note
   * dans la base et renvoie ce jour ; sinon renvoie null.
   */
  private claimDailyBackup(tx: SqlWriter): string | null {
    if (!this.backups) return null
    const today = parisDay(this.now())
    tx.exec(CREATE_STORAGE_META)
    const last = tx.get<{ value: string }>(
      `SELECT value FROM storage_meta WHERE key = 'last_backup_day'`,
    )
    if (last?.value === today) return null
    tx.run(
      `INSERT INTO storage_meta (key, value) VALUES ('last_backup_day', ?)
       ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
      [today],
    )
    return today
  }

  /** Enregistre la copie du jour et supprime les plus anciennes. Un échec ne bloque pas l'écriture. */
  private async saveBackup(day: string, bytes: Uint8Array): Promise<void> {
    if (!this.backups) return
    const { prefix, keep } = this.backups
    try {
      await this.store.write(`${prefix}${day}.sqlite`, bytes)
      const copies = (await this.store.list(prefix)).sort()
      const expired = copies.slice(0, Math.max(0, copies.length - keep))
      await Promise.all(expired.map((key) => this.store.delete(key)))
    } catch (error) {
      console.error('[grind-up] La copie quotidienne de la base a échoué.', error)
    }
  }
}
