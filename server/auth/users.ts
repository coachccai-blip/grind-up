import { randomInt, randomUUID } from 'node:crypto'
import { AVATARS } from '../../shared/rules/avatars.js'
import { levelFromXp } from '../../shared/rules/levels.js'
import { pseudoKey } from '../../shared/rules/pseudo.js'
import {
  formatPublicId,
  normalizePublicId,
  PUBLIC_ID_ALPHABET,
} from '../../shared/rules/public-id.js'
import type { AdminStudent } from '../../shared/schemas/admin.js'
import type { SessionUser } from '../../shared/schemas/auth.js'
import type { SqlReader, SqlRow, SqlWriter } from '../db/sqlite.js'

/** Accès aux comptes en base. */
export interface UserRow extends SqlRow {
  id: string
  role: 'student' | 'admin' | 'bot'
  pseudo: string
  pseudo_key: string
  public_id: string | null
  password_hash: string | null
  must_change_password: number
  session_version: number
  avatar: string
  is_active: number
  created_at: string
  last_active_at: string | null
}

export function findUserById(tx: SqlReader, id: string): UserRow | undefined {
  return tx.get<UserRow>('SELECT * FROM users WHERE id = ?', [id])
}

/** Cherche un compte par ce que l'utilisateur a saisi : son identifiant XXXX-XXXX ou son pseudo. */
export function findUserByLogin(tx: SqlReader, login: string): UserRow | undefined {
  const publicId = normalizePublicId(login)
  if (publicId) return tx.get<UserRow>('SELECT * FROM users WHERE public_id = ?', [publicId])
  return tx.get<UserRow>('SELECT * FROM users WHERE pseudo_key = ?', [pseudoKey(login)])
}

export function isPseudoTaken(tx: SqlReader, pseudo: string, exceptUserId?: string): boolean {
  const owner = tx.get<{ id: string }>('SELECT id FROM users WHERE pseudo_key = ?', [
    pseudoKey(pseudo),
  ])
  return owner !== undefined && owner.id !== exceptUserId
}

/** Tire un identifiant public au hasard. */
export function drawPublicId(): string {
  const characters = Array.from(
    { length: 8 },
    () => PUBLIC_ID_ALPHABET[randomInt(PUBLIC_ID_ALPHABET.length)],
  ).join('')
  return formatPublicId(characters)
}

/** Tire un identifiant public qui n'existe pas encore ; l'unicité est aussi garantie par la base. */
export function drawUnusedPublicId(tx: SqlReader, draw: () => string = drawPublicId): string {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = draw()
    if (!tx.get('SELECT 1 AS taken FROM users WHERE public_id = ?', [candidate])) return candidate
  }
  throw new Error('Impossible de générer un identifiant unique.')
}

export interface NewUser {
  role: 'student' | 'admin'
  pseudo: string
  passwordHash: string
  now: Date
}

/** Crée un compte. Un élève reçoit un identifiant public ; un admin n'en a pas. */
export function insertUser(tx: SqlWriter, user: NewUser): UserRow {
  const id = randomUUID()
  const avatar = AVATARS[randomInt(AVATARS.length)]!.id
  const publicId = user.role === 'student' ? drawUnusedPublicId(tx) : null
  const createdAt = user.now.toISOString()
  tx.run(
    `INSERT INTO users (id, role, pseudo, pseudo_key, public_id, password_hash, avatar, created_at, last_active_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      user.role,
      user.pseudo,
      pseudoKey(user.pseudo),
      publicId,
      user.passwordHash,
      avatar,
      createdAt,
      createdAt,
    ],
  )
  return findUserById(tx, id)!
}

export function toSessionUser(row: UserRow): SessionUser {
  if (row.role === 'bot') throw new Error('Un bot ne peut pas ouvrir de session.')
  return {
    id: row.id,
    role: row.role,
    pseudo: row.pseudo,
    publicId: row.public_id,
    avatar: row.avatar,
    mustChangePassword: row.must_change_password === 1,
  }
}

export function toAdminStudent(
  row: UserRow,
  totals: { xp: number; missions: number } = { xp: 0, missions: 0 },
): AdminStudent {
  return {
    id: row.id,
    pseudo: row.pseudo,
    publicId: row.public_id ?? '',
    avatar: row.avatar,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at,
    xp: totals.xp,
    level: levelFromXp(totals.xp),
    missions: totals.missions,
  }
}

export function listStudents(tx: SqlReader): UserRow[] {
  return tx.all<UserRow>(`SELECT * FROM users WHERE role = 'student' ORDER BY pseudo_key`)
}

export function findStudentById(tx: SqlReader, id: string): UserRow | undefined {
  return tx.get<UserRow>(`SELECT * FROM users WHERE id = ? AND role = 'student'`, [id])
}
