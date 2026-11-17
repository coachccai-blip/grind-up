import type { Database, SqlJsStatic } from 'sql.js'
import initSqlJs from 'sql.js/dist/sql-wasm-inline.js'

let engine: Promise<SqlJsStatic> | undefined

/** Charge le moteur SQLite une seule fois par instance de fonction. */
export function loadSqlite(): Promise<SqlJsStatic> {
  engine ??= initSqlJs().catch((error: unknown) => {
    // Ne pas garder un échec en mémoire : la prochaine requête réessaiera.
    engine = undefined
    throw error
  })
  return engine
}

export type SqlValue = string | number | null | Uint8Array
export type SqlRow = Record<string, SqlValue>

/** Accès en lecture à la base. */
export class SqlReader {
  constructor(protected readonly db: Database) {}

  /** Toutes les lignes d'une requête, sous forme d'objets. */
  all<Row extends SqlRow = SqlRow>(sql: string, params: readonly SqlValue[] = []): Row[] {
    const statement = this.db.prepare(sql)
    try {
      statement.bind([...params])
      const rows: Row[] = []
      while (statement.step()) rows.push(statement.getAsObject() as Row)
      return rows
    } finally {
      statement.free()
    }
  }

  /** Première ligne d'une requête, ou undefined. */
  get<Row extends SqlRow = SqlRow>(sql: string, params: readonly SqlValue[] = []): Row | undefined {
    return this.all<Row>(sql, params)[0]
  }
}

/** Accès en lecture et en écriture, à l'intérieur d'une transaction. */
export class SqlWriter extends SqlReader {
  /** Une instruction, avec ses paramètres. */
  run(sql: string, params: readonly SqlValue[] = []): void {
    this.db.run(sql, [...params])
  }

  /** Plusieurs instructions sans paramètres (migrations). */
  exec(sql: string): void {
    this.db.exec(sql)
  }
}
