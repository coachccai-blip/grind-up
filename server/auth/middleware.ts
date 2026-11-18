import type { Context, MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { AppEnv } from '../context.js'
import { ApiError, forbidden, unauthenticated } from '../http.js'
import { getSessionKey } from './secrets.js'
import { SESSION_COOKIE, signSession, verifySession } from './session.js'
import { findUserById, type UserRow } from './users.js'

const DAY_SECONDS = 24 * 60 * 60
/** L'activité d'un utilisateur est enregistrée au plus une fois par heure. */
const ACTIVITY_PRECISION_MS = 60 * 60 * 1000

const isHttps = (c: Context) => new URL(c.req.url).protocol === 'https:'

/** Ouvre (ou prolonge) la session de cet utilisateur : pose le cookie signé. */
export async function startSession(c: Context<AppEnv>, user: UserRow): Promise<void> {
  const { database } = c.var.storage
  const lifetimeSeconds = c.var.config.sessionLifetimeDays * DAY_SECONDS
  const issuedAt = Math.floor(c.var.now().getTime() / 1000)
  const token = signSession(
    {
      userId: user.id,
      sessionVersion: user.session_version,
      issuedAt,
      expiresAt: issuedAt + lifetimeSeconds,
    },
    await getSessionKey(database),
  )
  setCookie(c, SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    // En local, le site est servi en http : le cookie ne peut pas y être « Secure ».
    secure: isHttps(c),
    sameSite: 'Lax',
    maxAge: lifetimeSeconds,
  })
}

export function endSession(c: Context<AppEnv>): void {
  deleteCookie(c, SESSION_COOKIE, { path: '/', secure: isHttps(c) })
}

/**
 * Identifie l'utilisateur à partir du cookie de session. Sans cookie, la base
 * n'est même pas consultée.
 */
export const authenticate: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.set('user', null)
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return next()

  const { database } = c.var.storage
  const now = c.var.now()
  const nowSeconds = Math.floor(now.getTime() / 1000)
  const claims = verifySession(token, await getSessionKey(database), nowSeconds)
  if (!claims) return next()

  const user = await database.read((tx) => findUserById(tx, claims.userId))
  const sessionIsValid =
    user !== undefined &&
    user.role !== 'bot' &&
    user.is_active === 1 &&
    user.session_version === claims.sessionVersion
  if (!sessionIsValid) return next()

  c.set('user', user)

  // Session glissante : le cookie est renouvelé au plus une fois par jour.
  if (nowSeconds - claims.issuedAt > DAY_SECONDS) await startSession(c, user)

  const lastActive = user.last_active_at ? Date.parse(user.last_active_at) : 0
  if (now.getTime() - lastActive > ACTIVITY_PRECISION_MS) {
    try {
      await database.write((tx) =>
        tx.run('UPDATE users SET last_active_at = ? WHERE id = ?', [now.toISOString(), user.id]),
      )
    } catch (error) {
      // La date de dernière activité est une information de confort : son échec ne bloque rien.
      console.error('[grind-up] Dernière activité non enregistrée.', error)
    }
  }

  return next()
}

interface RequireUserOptions {
  /** Routes encore accessibles tant qu'un nouveau mot de passe n'a pas été choisi. */
  allowPendingPasswordChange?: boolean
}

function currentUser(c: Context<AppEnv>, options: RequireUserOptions = {}): UserRow {
  const user = c.var.user
  if (!user) throw unauthenticated()
  if (user.must_change_password === 1 && !options.allowPendingPasswordChange) {
    throw new ApiError(
      403,
      'password_change_required',
      'Un nouveau mot de passe doit être choisi avant de continuer.',
    )
  }
  return user
}

/** Exige un utilisateur connecté. */
export const requireUser =
  (options: RequireUserOptions = {}): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    currentUser(c, options)
    return next()
  }

/** Exige un utilisateur connecté ayant ce rôle. */
export const requireRole =
  (role: 'student' | 'admin'): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    if (currentUser(c).role !== role) throw forbidden()
    return next()
  }

/** L'utilisateur connecté, dans une route protégée par requireUser ou requireRole. */
export function signedInUser(c: Context<AppEnv>): UserRow {
  const user = c.var.user
  if (!user) throw unauthenticated()
  return user
}

/** Hôte d'une adresse, ou null si elle est illisible. */
function hostOf(address: string): string | null {
  try {
    return new URL(address).host
  } catch {
    return null
  }
}

/**
 * Refuse les requêtes de modification venues d'un autre site. Le navigateur
 * indique l'origine de la page qui émet la requête : elle doit être ce site.
 */
export const sameOriginOnly: MiddlewareHandler<AppEnv> = async (c, next) => {
  const method = c.req.method.toUpperCase()
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const origin = c.req.header('origin')
    if (origin) {
      const ownHosts = [
        new URL(c.req.url).host,
        c.req.header('host'),
        c.req.header('x-forwarded-host'),
      ]
      const originHost = hostOf(origin)
      if (!originHost || !ownHosts.includes(originHost)) {
        throw new ApiError(403, 'cross_origin', 'Requête refusée.')
      }
    }
  }
  return next()
}
