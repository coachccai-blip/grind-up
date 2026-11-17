/**
 * Format de la réponse de /api/sante, partagé entre le serveur et l'interface.
 */
export interface HealthCheck {
  /** Identifiant stable de la vérification. */
  id: 'function' | 'database_write' | 'database_read' | 'conditional_write' | 'backup'
  /** Libellé affiché, en français. */
  label: string
  ok: boolean
  /** Résultat en clair, ou cause de l'échec. */
  detail: string
  durationMs: number
}

export interface HealthReport {
  ok: boolean
  message: string
  version: string
  /** Instant de la vérification, en UTC (ISO 8601). */
  checkedAt: string
  checks: HealthCheck[]
}
