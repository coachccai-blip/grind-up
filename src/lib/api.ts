import type { ApiErrorBody } from '../../shared/schemas/errors'

/**
 * Appels à l'API. Toute erreur devient une ApiError dont le message est
 * affichable tel quel, en français et sans emoji.
 */
export class ApiError extends Error {
  override name = 'ApiError'

  constructor(
    /** Code HTTP ; 0 quand le serveur n'a pas pu être joint. */
    readonly status: number,
    readonly code: string,
    message: string,
    /** Messages par champ de formulaire. */
    readonly fields: Record<string, string> = {},
  ) {
    super(message)
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  const error = (value as Partial<ApiErrorBody> | null)?.error
  return typeof error?.code === 'string' && typeof error.message === 'string'
}

export async function api<Result>(path: string, options: ApiOptions = {}): Promise<Result> {
  const { method = 'GET', body, signal } = options

  let response: Response
  try {
    response = await fetch(path, {
      method,
      signal,
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError(
      0,
      'network',
      'Connexion au serveur impossible. Vérifier la connexion internet, puis réessayer.',
    )
  }

  if (response.status === 204) return undefined as Result

  const isJson = (response.headers.get('content-type') ?? '').includes('application/json')
  const payload: unknown = isJson ? await response.json().catch(() => null) : null

  if (response.ok && isJson) return payload as Result
  if (isErrorBody(payload)) {
    throw new ApiError(
      response.status,
      payload.error.code,
      payload.error.message,
      payload.error.fields,
    )
  }
  throw new ApiError(
    response.status,
    'unavailable',
    'Le serveur ne répond pas comme prévu. Merci de réessayer dans un instant.',
  )
}

/** Message à afficher pour une erreur quelconque. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Une erreur inattendue est survenue. Merci de réessayer.'
}

/** Messages par champ d'une erreur de saisie, s'il y en a. */
export function errorFields(error: unknown): Record<string, string> {
  return error instanceof ApiError ? error.fields : {}
}
