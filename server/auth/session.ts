import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Session : un jeton signé (HMAC-SHA-256) rangé dans un cookie que le JavaScript
 * de la page ne peut pas lire. Le jeton porte l'utilisateur, sa version de
 * session et sa date d'expiration ; changer de mot de passe ou désactiver un
 * compte augmente la version de session, ce qui invalide les jetons en circulation.
 */
export const SESSION_COOKIE = 'gu_session'

export interface SessionClaims {
  userId: string
  sessionVersion: number
  /** Secondes depuis 1970. */
  issuedAt: number
  expiresAt: number
}

const TOKEN_VERSION = 'v1'

function sign(payload: string, key: Buffer): Buffer {
  return createHmac('sha256', key).update(`${TOKEN_VERSION}.${payload}`).digest()
}

export function signSession(claims: SessionClaims, key: Buffer): string {
  const payload = Buffer.from(
    JSON.stringify({
      u: claims.userId,
      v: claims.sessionVersion,
      i: claims.issuedAt,
      e: claims.expiresAt,
    }),
  ).toString('base64url')
  return `${TOKEN_VERSION}.${payload}.${sign(payload, key).toString('base64url')}`
}

/** Renvoie le contenu du jeton s'il est authentique et encore valable, sinon null. */
export function verifySession(
  token: string,
  key: Buffer,
  nowSeconds: number,
): SessionClaims | null {
  const [version, payload, signature] = token.split('.')
  if (version !== TOKEN_VERSION || !payload || !signature) return null

  const expected = sign(payload, key)
  const actual = Buffer.from(signature, 'base64url')
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<
      string,
      unknown
    >
    const { u, v, i, e } = data
    if (
      typeof u !== 'string' ||
      typeof v !== 'number' ||
      typeof i !== 'number' ||
      typeof e !== 'number'
    ) {
      return null
    }
    if (e <= nowSeconds) return null
    return { userId: u, sessionVersion: v, issuedAt: i, expiresAt: e }
  } catch {
    return null
  }
}
