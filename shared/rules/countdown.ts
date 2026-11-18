/**
 * Compte à rebours jusqu'à la deadline d'une quête (section 3 du brief) : il
 * passe en orange à moins de 24 h et en rouge à moins de 3 h. La couleur n'est
 * jamais le seul signal : la formule change avec l'urgence.
 */
export type CountdownTone = 'calm' | 'soon' | 'urgent' | 'over'

export interface Countdown {
  tone: CountdownTone
  /** Texte affiché : « Encore 3 j 4 h », « Plus que 5 h 12 min », « Urgent : plus que 42 min ». */
  text: string
  /** Délai avant que le texte ne change, en millisecondes : pour rafraîchir l'affichage. */
  refreshInMs: number
}

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
export const SOON_THRESHOLD_MS = 24 * HOUR_MS
export const URGENT_THRESHOLD_MS = 3 * HOUR_MS

const NBSP = '\u00A0'

/** Durée restante en deux unités au plus : « 3 j 4 h », « 5 h 12 min », « 42 min ». */
export function formatRemaining(milliseconds: number): string {
  if (milliseconds < MINUTE_MS) return 'moins d’une minute'
  const days = Math.floor(milliseconds / DAY_MS)
  const hours = Math.floor((milliseconds % DAY_MS) / HOUR_MS)
  const minutes = Math.floor((milliseconds % HOUR_MS) / MINUTE_MS)
  const parts =
    days > 0
      ? [`${days}${NBSP}j`, hours > 0 ? `${hours}${NBSP}h` : '']
      : hours > 0
        ? [`${hours}${NBSP}h`, minutes > 0 ? `${minutes}${NBSP}min` : '']
        : [`${minutes}${NBSP}min`]
  return parts.filter(Boolean).join(' ')
}

export function countdown(deadlineAt: string, now: Date): Countdown {
  const remaining = new Date(deadlineAt).getTime() - now.getTime()
  if (remaining <= 0) return { tone: 'over', text: 'Deadline dépassée', refreshInMs: DAY_MS }

  const duration = formatRemaining(remaining)
  // Le texte change à chaque minute entamée ; au-delà d'un jour, à chaque heure.
  const step = remaining >= DAY_MS ? HOUR_MS : MINUTE_MS
  const refreshInMs = (remaining % step) + 1

  if (remaining < URGENT_THRESHOLD_MS) {
    return { tone: 'urgent', text: `Urgent${NBSP}: plus que ${duration}`, refreshInMs }
  }
  if (remaining < SOON_THRESHOLD_MS) {
    return { tone: 'soon', text: `Plus que ${duration}`, refreshInMs }
  }
  return { tone: 'calm', text: `Encore ${duration}`, refreshInMs }
}
