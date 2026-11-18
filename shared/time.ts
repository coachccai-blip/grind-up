/**
 * Dates : tout est stocké en UTC et raisonné en Europe/Paris (section 11 du brief).
 */
export const APP_TIME_ZONE = 'Europe/Paris'

const parisDayFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Jour calendaire (AAAA-MM-JJ) d'un instant, vu depuis le fuseau Europe/Paris. */
export function parisDay(instant: Date): string {
  const parts = parisDayFormat.formatToParts(instant)
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((candidate) => candidate.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

const parisClockFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

/** Date et heure affichées par une horloge parisienne à cet instant. */
function parisClock(instant: Date): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
} {
  const parts = parisClockFormat.formatToParts(instant)
  const part = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((candidate) => candidate.type === type)?.value ?? 0)
  return {
    year: part('year'),
    month: part('month'),
    day: part('day'),
    hour: part('hour'),
    minute: part('minute'),
    second: part('second'),
  }
}

/** Avance de l'heure de Paris sur l'heure UTC à cet instant, en millisecondes. */
function parisOffsetMs(instant: Date): number {
  const clock = parisClock(instant)
  const asUtc = Date.UTC(
    clock.year,
    clock.month - 1,
    clock.day,
    clock.hour,
    clock.minute,
    clock.second,
  )
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000
}

const two = (value: number) => String(value).padStart(2, '0')
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Instant correspondant à une date et une heure saisies en heure de Paris, au
 * format des champs « date et heure » : « 2026-11-20T18:00 ». Renvoie null si la
 * saisie n'est pas une date valide.
 *
 * Au passage à l'heure d'été, l'heure sautée (2 h → 3 h) est décalée d'une heure ;
 * au retour à l'heure d'hiver, l'heure qui se répète est prise à son premier passage.
 */
export function parisLocalToInstant(local: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local)
  if (!match) return null
  const [year, month, day, hour, minute] = match.slice(1).map(Number) as [
    number,
    number,
    number,
    number,
    number,
  ]
  const wall = Date.UTC(year, month - 1, day, hour, minute)
  const check = new Date(wall)
  const isRealDate =
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day &&
    hour < 24 &&
    minute < 60
  if (!isRealDate) return null

  // Autour d'un changement d'heure, deux décalages sont possibles : on essaie les deux,
  // du plus ancien instant au plus récent, et on garde le premier qui redonne l'heure saisie.
  const offsets = new Set([
    parisOffsetMs(new Date(wall - DAY_MS)),
    parisOffsetMs(new Date(wall + DAY_MS)),
  ])
  const candidates = [...offsets].map((offset) => wall - offset).sort((a, b) => a - b)
  const exact = candidates.find((instant) => instantToParisLocal(new Date(instant)) === local)
  // Heure sautée au printemps : aucun instant ne l'affiche, on prend l'heure qui la suit.
  return new Date(exact ?? candidates.at(-1)!)
}

/** « 2026-11-20T18:00 » : l'instant en heure de Paris, au format des champs « date et heure ». */
export function instantToParisLocal(instant: Date): string {
  const clock = parisClock(instant)
  return `${clock.year}-${two(clock.month)}-${two(clock.day)}T${two(clock.hour)}:${two(clock.minute)}`
}
