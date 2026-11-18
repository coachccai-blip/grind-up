import type { SqlReader, SqlWriter } from '../db/sqlite.js'

/**
 * Limitation des tentatives : des compteurs par fenêtre de temps, rangés en base.
 * Le sujet est l'empreinte de l'adresse IP, jamais l'adresse elle-même.
 */
export interface RateLimitRule {
  /** Nom du compteur : inscription, code admin, connexion… */
  bucket: string
  /** Nombre d'occurrences admises par fenêtre. */
  limit: number
  windowMs: number
}

export interface RateLimitState {
  limited: boolean
  /** Délai avant la fin de la fenêtre en cours, en secondes. */
  retryAfterSeconds: number
}

function windowStart(rule: RateLimitRule, now: Date): number {
  return Math.floor(now.getTime() / rule.windowMs) * rule.windowMs
}

/** Indique si le sujet a atteint la limite dans la fenêtre en cours. */
export function checkRateLimit(
  tx: SqlReader,
  rule: RateLimitRule,
  subject: string,
  now: Date,
): RateLimitState {
  const start = windowStart(rule, now)
  const row = tx.get<{ hits: number }>(
    'SELECT hits FROM rate_limits WHERE bucket = ? AND subject = ? AND window_start = ?',
    [rule.bucket, subject, new Date(start).toISOString()],
  )
  return {
    limited: (row?.hits ?? 0) >= rule.limit,
    retryAfterSeconds: Math.max(1, Math.ceil((start + rule.windowMs - now.getTime()) / 1000)),
  }
}

/** Compte une occurrence pour le sujet, et efface les compteurs des fenêtres passées. */
export function recordRateLimitHit(
  tx: SqlWriter,
  rule: RateLimitRule,
  subject: string,
  now: Date,
): void {
  const start = new Date(windowStart(rule, now)).toISOString()
  tx.run('DELETE FROM rate_limits WHERE bucket = ? AND window_start < ?', [rule.bucket, start])
  tx.run(
    `INSERT INTO rate_limits (bucket, subject, window_start, hits) VALUES (?, ?, ?, 1)
     ON CONFLICT (bucket, subject, window_start) DO UPDATE SET hits = hits + 1`,
    [rule.bucket, subject, start],
  )
}
