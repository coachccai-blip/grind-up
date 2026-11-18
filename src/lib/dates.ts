import { APP_TIME_ZONE } from '../../shared/time'

/** Dates : stockées en UTC, toujours affichées en Europe/Paris, en français. */
const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: APP_TIME_ZONE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: APP_TIME_ZONE,
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

const relativeFormat = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' })

/** Met la première lettre en majuscule, pour un texte affiché seul. */
export function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('fr-FR') + text.slice(1)
}

/** « 17 novembre 2026 » */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso))
}

/** « 17 novembre à 11:00 » */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}

/** « il y a 3 jours », « hier », « il y a 2 heures », « à l’instant ». */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000)
  const minutes = Math.round(seconds / 60)
  const hours = Math.round(minutes / 60)
  const days = Math.round(hours / 24)
  if (Math.abs(minutes) < 1) return 'à l’instant'
  if (Math.abs(minutes) < 60) return relativeFormat.format(minutes, 'minute')
  if (Math.abs(hours) < 24) return relativeFormat.format(hours, 'hour')
  if (Math.abs(days) < 30) return relativeFormat.format(days, 'day')
  return `le ${formatDate(iso)}`
}
