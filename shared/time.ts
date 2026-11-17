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
