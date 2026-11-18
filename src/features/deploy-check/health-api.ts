import type { HealthReport } from '../../../shared/health'

/** L'API n'a pas répondu comme attendu. Le message est affichable tel quel. */
export class HealthUnavailableError extends Error {
  override name = 'HealthUnavailableError'
}

function isHealthReport(value: unknown): value is HealthReport {
  const candidate = value as Partial<HealthReport> | null
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    typeof candidate.ok === 'boolean' &&
    typeof candidate.message === 'string' &&
    Array.isArray(candidate.checks)
  )
}

/** Appelle /api/sante. Un test en échec renvoie quand même un rapport (code 503). */
export async function fetchHealth(signal?: AbortSignal): Promise<HealthReport> {
  let response: Response
  try {
    response = await fetch('/api/sante', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new HealthUnavailableError(
      'Le serveur ne répond pas. Vérifiez la connexion, puis relancez.',
    )
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    // Sans fonction publiée, Netlify renvoie la page du site à la place de l'API.
    throw new HealthUnavailableError(
      `La fonction serveur n’est pas publiée\u00A0: /api/sante a renvoyé une page au lieu d’une réponse de l’API (code ${response.status}).`,
    )
  }

  const body: unknown = await response.json()
  if (!isHealthReport(body)) {
    throw new HealthUnavailableError(`Réponse inattendue du serveur (code ${response.status}).`)
  }
  return body
}
