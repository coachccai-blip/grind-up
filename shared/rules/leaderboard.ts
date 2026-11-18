import { firstOfMonth, mondayOf, parisDay, parisMidnight } from '../time.js'

/**
 * Leaderboard (section 5 du brief). Il classe les élèves et les bots par nombre
 * de missions accomplies, avec l'XP en second critère, puis la date de la
 * dernière mission : le plus ancien devant. Un bouton permet de trier par XP.
 */
export const LEADERBOARD_PERIODS = [
  { id: 'week', label: 'Cette semaine', shortLabel: 'Semaine' },
  { id: 'month', label: 'Ce mois', shortLabel: 'Mois' },
  { id: 'all', label: 'Depuis toujours', shortLabel: 'Toujours' },
] as const
export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number]['id']
export const LEADERBOARD_PERIOD_IDS = LEADERBOARD_PERIODS.map((period) => period.id) as [
  LeaderboardPeriod,
  ...LeaderboardPeriod[],
]

export type LeaderboardSort = 'missions' | 'xp'

/** Début d'une période, en heure de Paris : lundi 0 h, le 1er du mois 0 h, ou null pour « toujours ». */
export function periodStart(period: LeaderboardPeriod, now: Date): Date | null {
  const today = parisDay(now)
  if (period === 'week') return parisMidnight(mondayOf(today))
  if (period === 'month') return parisMidnight(firstOfMonth(today))
  return null
}

/** Ce qu'un participant a fait sur une période. */
export interface Standing {
  id: string
  /** Pseudo sans majuscules ni accents : dernier critère, pour un ordre stable. */
  pseudoKey: string
  missions: number
  xp: number
  /** Date de sa dernière mission sur la période (UTC, ISO 8601), ou null. */
  lastMissionAt: string | null
}

export interface RankedStanding extends Standing {
  /** Rang, à partir de 1 ; null pour un participant sans mission ni XP sur la période. */
  rank: number | null
}

const compareBy =
  (sort: LeaderboardSort) =>
  (first: Standing, second: Standing): number => {
    const byMissions = second.missions - first.missions
    const byXp = second.xp - first.xp
    const [primary, secondary] = sort === 'missions' ? [byMissions, byXp] : [byXp, byMissions]
    if (primary !== 0) return primary
    if (secondary !== 0) return secondary
    // À égalité, celui qui a fini le plus tôt est devant.
    return (first.lastMissionAt ?? '\uFFFF').localeCompare(second.lastMissionAt ?? '\uFFFF')
  }

/**
 * Classe les participants. Seuls ceux qui ont une mission ou de l'XP sur la
 * période reçoivent un rang ; les autres suivent, par ordre alphabétique, sans
 * rang. Deux participants strictement à égalité partagent le même rang.
 */
export function rankStandings(
  standings: readonly Standing[],
  sort: LeaderboardSort = 'missions',
): RankedStanding[] {
  const compare = compareBy(sort)
  const byPseudo = (first: Standing, second: Standing) =>
    first.pseudoKey.localeCompare(second.pseudoKey)
  const isRanked = (standing: Standing) => standing.missions > 0 || standing.xp > 0

  const ranked = standings
    .filter(isRanked)
    .sort((first, second) => compare(first, second) || byPseudo(first, second))
  const unranked = standings.filter((standing) => !isRanked(standing)).sort(byPseudo)

  const result: RankedStanding[] = []
  ranked.forEach((standing, index) => {
    const previous = result[index - 1]
    const tied = previous !== undefined && compare(previous, standing) === 0
    result.push({ ...standing, rank: tied ? previous.rank : index + 1 })
  })
  return [...result, ...unranked.map((standing) => ({ ...standing, rank: null }))]
}

/**
 * Places gagnées (nombre positif) ou perdues (négatif) entre deux classements.
 * Rien pour un participant qui n'avait pas de rang, ou qui n'en a plus.
 */
export function movements(
  before: readonly RankedStanding[],
  after: readonly RankedStanding[],
): Map<string, number> {
  const previous = new Map(before.map((standing) => [standing.id, standing.rank]))
  const moves = new Map<string, number>()
  for (const standing of after) {
    const was = previous.get(standing.id)
    if (was != null && standing.rank !== null) moves.set(standing.id, was - standing.rank)
  }
  return moves
}
