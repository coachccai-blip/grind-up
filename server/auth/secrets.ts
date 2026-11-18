import { createHmac, randomBytes } from 'node:crypto'
import type { SqliteBlobDatabase } from '../db/database.js'
import type { SqlReader } from '../db/sqlite.js'

/**
 * Clé qui signe les sessions : générée au premier lancement et conservée en
 * base (section 12 du brief), puis gardée en mémoire par l'instance de fonction.
 */
const SESSION_KEY_NAME = 'session_key'

const cachedKeys = new WeakMap<SqliteBlobDatabase, Buffer>()

export async function getSessionKey(database: SqliteBlobDatabase): Promise<Buffer> {
  const cached = cachedKeys.get(database)
  if (cached) return cached

  const readKey = (tx: SqlReader) =>
    tx.get<{ value: string }>('SELECT value FROM app_secrets WHERE name = ?', [SESSION_KEY_NAME])
      ?.value

  let value = await database.read(readKey)
  if (!value) {
    value = await database.write((tx) => {
      // INSERT OR IGNORE : si une autre instance vient de créer la clé, on garde la sienne.
      tx.run('INSERT OR IGNORE INTO app_secrets (name, value, created_at) VALUES (?, ?, ?)', [
        SESSION_KEY_NAME,
        randomBytes(32).toString('base64url'),
        new Date().toISOString(),
      ])
      return readKey(tx)
    })
  }
  if (!value) throw new Error('La clé de session est introuvable.')

  const key = Buffer.from(value, 'base64url')
  cachedKeys.set(database, key)
  return key
}

/**
 * Empreinte d'une adresse IP, pour compter les tentatives sans conserver
 * l'adresse elle-même. Sans la clé du serveur, l'empreinte ne permet pas de
 * retrouver l'adresse.
 */
export function hashIpAddress(ip: string | undefined, key: Buffer): string {
  return createHmac('sha256', key)
    .update(`ip:${ip ?? 'inconnue'}`)
    .digest('hex')
    .slice(0, 32)
}
