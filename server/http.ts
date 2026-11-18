import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { z } from 'zod'
import type { ApiErrorBody } from '../shared/schemas/errors.js'

/**
 * Erreur destinée à l'utilisateur : son message est affiché tel quel par
 * l'interface. Toute autre erreur devient une réponse 500 sans détail.
 */
export class ApiError extends Error {
  override name = 'ApiError'

  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: string,
    message: string,
    readonly details: { fields?: Record<string, string>; retryAfterSeconds?: number } = {},
  ) {
    super(message)
  }

  toBody(): ApiErrorBody {
    return { error: { code: this.code, message: this.message, ...this.details } }
  }
}

export const unauthenticated = () => new ApiError(401, 'unauthenticated', 'Connexion requise.')

export const forbidden = () => new ApiError(403, 'forbidden', 'Accès refusé.')

export const notFound = (message = 'Cette adresse n’existe pas.') =>
  new ApiError(404, 'not_found', message)

export const tooManyAttempts = (retryAfterSeconds: number) => {
  const minutes = Math.ceil(retryAfterSeconds / 60)
  return new ApiError(
    429,
    'too_many_attempts',
    `Trop de tentatives. Nouvel essai possible dans ${minutes} minute${minutes > 1 ? 's' : ''}.`,
    { retryAfterSeconds },
  )
}

/** Lit le corps JSON d'une requête et le valide. Toute saisie passe par ici. */
export async function parseBody<Schema extends z.ZodType>(
  c: Context,
  schema: Schema,
): Promise<z.infer<Schema>> {
  if (!c.req.header('content-type')?.toLowerCase().includes('application/json')) {
    throw new ApiError(415, 'unsupported_media_type', 'Le corps de la requête doit être en JSON.')
  }
  let raw: unknown
  try {
    raw = await c.req.json()
  } catch {
    throw new ApiError(400, 'invalid_json', 'La requête est illisible.')
  }

  const result = schema.safeParse(raw)
  if (result.success) return result.data

  const fields: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = issue.path.join('.') || '_'
    fields[field] ??= issue.message
  }
  throw new ApiError(400, 'invalid_input', 'Certaines informations sont incorrectes.', { fields })
}
