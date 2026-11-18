/**
 * Série (section 4 du brief) : nombre de jours consécutifs où l'élève a validé
 * au moins une quête, en jours calendaires du fuseau Europe/Paris. Un jour sans
 * aucune quête à faire ne casse pas la série : il ne compte ni pour, ni contre.
 *
 * Les jours sont des chaînes « AAAA-MM-JJ », comme les renvoie parisDay().
 */
export interface StreakFacts {
  /** Jours où l'élève a validé au moins une quête. */
  validationDays: Iterable<string>
  /** Périodes pendant lesquelles l'élève avait une quête à faire : premier et dernier jour inclus. */
  openPeriods: Iterable<{ from: string; to: string }>
  /** Aujourd'hui. Tant que la journée n'est pas finie, ne rien valider ne casse rien. */
  today: string
}

export interface Streak {
  /** Série en cours, en jours. */
  current: number
  /** Record personnel, en jours. */
  best: number
}

const DAY_MS = 24 * 60 * 60 * 1000
const toTime = (day: string) => Date.parse(`${day}T00:00:00Z`)
const toDay = (time: number) => new Date(time).toISOString().slice(0, 10)

/** Le jour suivant (ou précédent, avec un pas négatif) d'un jour calendaire. */
export function shiftDay(day: string, days: number): string {
  return toDay(toTime(day) + days * DAY_MS)
}

export function computeStreak(facts: StreakFacts): Streak {
  const validated = new Set(facts.validationDays)
  if (validated.size === 0) return { current: 0, best: 0 }

  // Jours où l'élève avait quelque chose à faire : un tel jour sans validation casse la série.
  const busy = new Set<string>()
  for (const period of facts.openPeriods) {
    const last = Math.min(toTime(period.to), toTime(facts.today))
    for (let time = toTime(period.from); time <= last; time += DAY_MS) busy.add(toDay(time))
  }

  const first = [...validated].sort()[0]!
  let best = 0
  let run = 0
  for (let day = first; day <= facts.today; day = shiftDay(day, 1)) {
    if (validated.has(day)) {
      run += 1
      best = Math.max(best, run)
    } else if (busy.has(day) && day !== facts.today) {
      run = 0
    }
  }
  // À la fin du parcours, « run » est la série qui court encore aujourd'hui.
  return { current: run, best }
}
