import { createHash, timingSafeEqual } from 'node:crypto'
import type {
  ChangePasswordRequest,
  LoginRequest,
  SignupRequest,
} from '../../shared/schemas/auth.js'
import type { AppConfig } from '../config.js'
import type { SqliteBlobDatabase } from '../db/database.js'
import { ApiError, tooManyAttempts } from '../http.js'
import { hashPassword, verifyPassword } from './passwords.js'
import { checkRateLimit, recordRateLimitHit, type RateLimitRule } from './rate-limit.js'
import { getSessionKey, hashIpAddress } from './secrets.js'
import { findUserById, findUserByLogin, insertUser, isPseudoTaken, type UserRow } from './users.js'

/** Inscription, connexion et changement de mot de passe. */
export interface AuthDependencies {
  database: SqliteBlobDatabase
  config: AppConfig
  now: () => Date
}

const HOUR_MS = 60 * 60 * 1000

const signupRule = (config: AppConfig): RateLimitRule => ({
  bucket: 'signup',
  limit: config.limits.signupsPerHour,
  windowMs: HOUR_MS,
})

const adminCodeRule = (config: AppConfig): RateLimitRule => ({
  bucket: 'admin_code',
  limit: config.limits.adminCodeAttemptsPerHour,
  windowMs: HOUR_MS,
})

const loginFailureRule = (config: AppConfig): RateLimitRule => ({
  bucket: 'login_failure',
  limit: config.limits.loginFailures,
  windowMs: config.limits.loginWindowMinutes * 60 * 1000,
})

/** Compare deux chaînes sans que la durée de la comparaison ne renseigne sur leur contenu. */
function secretsMatch(given: string, expected: string): boolean {
  const digest = (value: string) => createHash('sha256').update(value).digest()
  return timingSafeEqual(digest(given), digest(expected))
}

export const pseudoTaken = () =>
  new ApiError(409, 'pseudo_taken', 'Ce pseudo est déjà pris.', {
    fields: { pseudo: 'Ce pseudo est déjà pris.' },
  })

type SignupOutcome =
  | { kind: 'created'; user: UserRow }
  | { kind: 'limited'; retryAfterSeconds: number }
  | { kind: 'rejected' }
  | { kind: 'pseudo_taken' }

/**
 * Crée un compte. Sans code spécial, c'est un compte élève ; avec le bon code,
 * un compte admin ; avec un mauvais code, aucun compte, et un message générique.
 */
export async function signUp(
  dependencies: AuthDependencies,
  input: SignupRequest,
  ip: string | undefined,
): Promise<UserRow> {
  const { database, config, now } = dependencies
  const specialCode = input.specialCode.trim()
  const passwordHash = await hashPassword(input.password, config.scrypt)
  const subject = hashIpAddress(ip, await getSessionKey(database))

  // Les refus sont renvoyés comme résultats, pas comme erreurs : la transaction
  // est alors enregistrée, et avec elle le décompte des tentatives.
  const outcome = await database.write<SignupOutcome>((tx) => {
    const at = now()
    const signups = checkRateLimit(tx, signupRule(config), subject, at)
    if (signups.limited) return { kind: 'limited', retryAfterSeconds: signups.retryAfterSeconds }

    if (specialCode !== '') {
      const attempts = checkRateLimit(tx, adminCodeRule(config), subject, at)
      if (attempts.limited)
        return { kind: 'limited', retryAfterSeconds: attempts.retryAfterSeconds }
      recordRateLimitHit(tx, adminCodeRule(config), subject, at)
      if (!secretsMatch(specialCode, config.adminSignupCode)) return { kind: 'rejected' }
    }

    if (isPseudoTaken(tx, input.pseudo)) return { kind: 'pseudo_taken' }

    recordRateLimitHit(tx, signupRule(config), subject, at)
    const user = insertUser(tx, {
      role: specialCode !== '' ? 'admin' : 'student',
      pseudo: input.pseudo,
      passwordHash,
      now: at,
    })
    return { kind: 'created', user }
  })

  switch (outcome.kind) {
    case 'created':
      return outcome.user
    case 'limited':
      throw tooManyAttempts(outcome.retryAfterSeconds)
    case 'pseudo_taken':
      throw pseudoTaken()
    case 'rejected':
      throw new ApiError(400, 'signup_rejected', 'Inscription impossible avec ces informations.')
  }
}

/** Empreinte factice : vérifier un mot de passe prend le même temps que le compte existe ou non. */
let decoyHash: Promise<string> | undefined

/** Vérifie l'identifiant (ou le pseudo) et le mot de passe, et renvoie le compte. */
export async function logIn(
  dependencies: AuthDependencies,
  input: LoginRequest,
  ip: string | undefined,
): Promise<UserRow> {
  const { database, config, now } = dependencies
  const rule = loginFailureRule(config)
  const subject = hashIpAddress(ip, await getSessionKey(database))

  const { user, limit } = await database.read((tx) => ({
    user: findUserByLogin(tx, input.login),
    limit: checkRateLimit(tx, rule, subject, now()),
  }))
  if (limit.limited) throw tooManyAttempts(limit.retryAfterSeconds)

  decoyHash ??= hashPassword('mot de passe factice', config.scrypt)
  const storedHash = user?.role !== 'bot' ? user?.password_hash : null
  const passwordIsRight = await verifyPassword(input.password, storedHash ?? (await decoyHash))

  if (!user || !storedHash || !passwordIsRight) {
    await database.write((tx) => recordRateLimitHit(tx, rule, subject, now()))
    throw new ApiError(401, 'invalid_credentials', 'Identifiant ou mot de passe incorrect.')
  }
  if (user.is_active !== 1) {
    throw new ApiError(
      403,
      'account_disabled',
      'Ce compte est désactivé. Contacte ton accompagnant.',
    )
  }
  return user
}

/**
 * Change le mot de passe du compte connecté et invalide ses autres sessions.
 * Le mot de passe actuel est exigé, sauf juste après une connexion avec un mot
 * de passe temporaire.
 */
export async function changePassword(
  dependencies: AuthDependencies,
  user: UserRow,
  input: ChangePasswordRequest,
): Promise<UserRow> {
  const { database, config } = dependencies

  if (user.must_change_password !== 1) {
    const currentIsRight =
      input.currentPassword !== undefined &&
      user.password_hash !== null &&
      (await verifyPassword(input.currentPassword, user.password_hash))
    if (!currentIsRight) {
      throw new ApiError(400, 'wrong_password', 'Le mot de passe actuel est incorrect.', {
        fields: { currentPassword: 'Le mot de passe actuel est incorrect.' },
      })
    }
  }

  const passwordHash = await hashPassword(input.newPassword, config.scrypt)
  const updated = await database.write((tx) => {
    tx.run(
      `UPDATE users
       SET password_hash = ?, must_change_password = 0, session_version = session_version + 1
       WHERE id = ?`,
      [passwordHash, user.id],
    )
    return findUserById(tx, user.id)
  })
  if (!updated) throw new ApiError(404, 'not_found', 'Ce compte est introuvable.')
  return updated
}
