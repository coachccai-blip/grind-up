import { describe, expect, it } from 'vitest'
import {
  adaptiveTarget,
  BOT_PSEUDOS,
  DEFAULT_DIFFICULTY_MIX,
  drawMissionXp,
  drawWeekSchedule,
} from '../../shared/rules/bots.js'
import {
  movements,
  periodStart,
  rankStandings,
  type Standing,
} from '../../shared/rules/leaderboard.js'
import { checkPseudo } from '../../shared/rules/pseudo.js'
import { firstOfMonth, instantToParisLocal, mondayOf } from '../../shared/time.js'

const standing = (
  id: string,
  missions: number,
  xp: number,
  lastMissionAt: string | null = null,
): Standing => ({ id, pseudoKey: id, missions, xp, lastMissionAt })

const order = (standings: Standing[], sort?: 'missions' | 'xp') =>
  rankStandings(standings, sort).map((entry) => `${entry.rank ?? '-'} ${entry.id}`)

describe('classement', () => {
  it('trie par missions, puis par XP, puis par date de la dernière mission', () => {
    const ranked = order([
      standing('tom', 3, 300, '2026-11-17T10:00:00.000Z'),
      standing('lea', 5, 200, '2026-11-17T09:00:00.000Z'),
      standing('ines', 3, 450, '2026-11-17T11:00:00.000Z'),
      standing('noa', 3, 300, '2026-11-16T10:00:00.000Z'),
    ])

    // Léa a le plus de missions ; Inès a plus d'XP que Tom et Noa ; Noa a fini avant Tom.
    expect(ranked).toEqual(['1 lea', '2 ines', '3 noa', '4 tom'])
  })

  it('peut trier par XP : les missions départagent alors les égalités', () => {
    const ranked = order(
      [
        standing('tom', 3, 300, '2026-11-17T10:00:00.000Z'),
        standing('lea', 5, 200, '2026-11-17T09:00:00.000Z'),
        standing('ines', 2, 300, '2026-11-17T08:00:00.000Z'),
      ],
      'xp',
    )

    expect(ranked).toEqual(['1 tom', '2 ines', '3 lea'])
  })

  it('donne le même rang à deux participants strictement à égalité, puis saute un rang', () => {
    const at = '2026-11-17T10:00:00.000Z'
    const ranked = order([
      standing('tom', 2, 200, at),
      standing('lea', 2, 200, at),
      standing('ines', 1, 100, at),
    ])

    expect(ranked).toEqual(['1 lea', '1 tom', '3 ines'])
  })

  it('ne classe pas les participants sans mission ni XP sur la période', () => {
    const ranked = order([
      standing('zoe', 0, 0),
      standing('tom', 1, 100, '2026-11-17T10:00:00.000Z'),
      standing('adam', 0, 0),
    ])

    expect(ranked).toEqual(['1 tom', '- adam', '- zoe'])
  })

  it('classe un participant qui n’a que de l’XP, derrière ceux qui ont une mission', () => {
    const ranked = order([
      standing('lea', 0, 500),
      standing('tom', 1, 50, '2026-11-17T10:00:00.000Z'),
    ])

    expect(ranked).toEqual(['1 tom', '2 lea'])
  })

  it('reste stable : le pseudo départage ce que rien d’autre ne départage', () => {
    const first = order([standing('b', 0, 0), standing('a', 0, 0), standing('c', 0, 0)])
    const second = order([standing('c', 0, 0), standing('a', 0, 0), standing('b', 0, 0)])

    expect(first).toEqual(second)
  })

  it('dit combien de places un participant a gagnées ou perdues depuis la veille', () => {
    const yesterday = rankStandings([
      standing('lea', 3, 300, '2026-11-16T10:00:00.000Z'),
      standing('tom', 2, 200, '2026-11-16T10:00:00.000Z'),
      standing('ines', 1, 100, '2026-11-16T10:00:00.000Z'),
      standing('noa', 0, 0),
    ])
    const today = rankStandings([
      standing('lea', 3, 300, '2026-11-16T10:00:00.000Z'),
      standing('tom', 2, 200, '2026-11-16T10:00:00.000Z'),
      standing('ines', 4, 400, '2026-11-17T10:00:00.000Z'),
      standing('noa', 1, 100, '2026-11-17T11:00:00.000Z'),
    ])

    const moves = movements(yesterday, today)

    expect(Object.fromEntries(moves)).toEqual({ ines: 2, lea: -1, tom: -1 })
    // Noa n'avait pas de rang hier : pas de flèche pour son entrée au classement.
    expect(moves.has('noa')).toBe(false)
  })
})

describe('périodes du classement', () => {
  it('fait commencer la semaine le lundi à minuit, heure de Paris', () => {
    // Mercredi 18 novembre 2026, 10 h UTC.
    const now = new Date('2026-11-18T10:00:00Z')

    expect(instantToParisLocal(periodStart('week', now)!)).toBe('2026-11-16T00:00')
    expect(periodStart('week', now)?.toISOString()).toBe('2026-11-15T23:00:00.000Z')
    expect(instantToParisLocal(periodStart('month', now)!)).toBe('2026-11-01T00:00')
    expect(periodStart('all', now)).toBeNull()
  })

  it('range le dimanche soir dans la semaine qui finit, et le lundi 0 h 30 dans la suivante', () => {
    // Dimanche 22 novembre, 23 h 30 à Paris ; puis lundi 23 novembre, 0 h 30 à Paris.
    expect(instantToParisLocal(periodStart('week', new Date('2026-11-22T22:30:00Z'))!)).toBe(
      '2026-11-16T00:00',
    )
    expect(instantToParisLocal(periodStart('week', new Date('2026-11-22T23:30:00Z'))!)).toBe(
      '2026-11-23T00:00',
    )
  })

  it('connaît le lundi et le premier du mois de chaque jour', () => {
    expect(mondayOf('2026-11-16')).toBe('2026-11-16')
    expect(mondayOf('2026-11-22')).toBe('2026-11-16')
    expect(mondayOf('2027-01-01')).toBe('2026-12-28')
    expect(firstOfMonth('2026-11-18')).toBe('2026-11-01')
  })
})

describe('bots', () => {
  /** Générateur déterministe : la même suite de nombres à chaque test. */
  function seeded(seed = 42): () => number {
    let state = seed
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296
      return state / 4294967296
    }
  }

  it('tire les missions d’un bot régulier du lundi au dimanche, entre 8 h et 21 h à Paris', () => {
    const schedule = drawWeekSchedule('2026-11-16', 20, seeded())

    expect(schedule).toHaveLength(20)
    expect([...schedule].sort()).toEqual(schedule)
    for (const instant of schedule) {
      const local = instantToParisLocal(new Date(instant))
      const hour = Number(local.slice(11, 13))
      expect(local >= '2026-11-16T08:00' && local < '2026-11-22T21:00').toBe(true)
      expect(hour).toBeGreaterThanOrEqual(8)
      expect(hour).toBeLessThan(21)
    }
  })

  it('tire au sort des plannings différents d’une semaine à l’autre', () => {
    const random = seeded()
    expect(drawWeekSchedule('2026-11-16', 5, random)).not.toEqual(
      drawWeekSchedule('2026-11-16', 5, random),
    )
  })

  it('reste dans la semaine même aux bornes du tirage', () => {
    const first = drawWeekSchedule('2026-11-16', 1, () => 0)[0]!
    const last = drawWeekSchedule('2026-11-16', 1, () => 0.999999)[0]!

    expect(instantToParisLocal(new Date(first))).toBe('2026-11-16T08:00')
    expect(instantToParisLocal(new Date(last))).toBe('2026-11-22T20:59')
  })

  it('tire l’XP d’une mission dans le barème, selon la répartition des difficultés', () => {
    const random = seeded()
    const counts: Record<number, number> = {}
    for (let index = 0; index < 4000; index += 1) {
      const xp = drawMissionXp(DEFAULT_DIFFICULTY_MIX, random)
      counts[xp] = (counts[xp] ?? 0) + 1
    }

    // Seules les récompenses du barème sortent, dans les proportions 40 / 40 / 15 / 5.
    expect(
      Object.keys(counts)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual([50, 100, 200, 400])
    expect(counts[50]! / 4000).toBeCloseTo(0.4, 1)
    expect(counts[100]! / 4000).toBeCloseTo(0.4, 1)
    expect(counts[200]! / 4000).toBeCloseTo(0.15, 1)
    expect(counts[400]! / 4000).toBeCloseTo(0.05, 1)
  })

  it('respecte une répartition à une seule difficulté, et se rabat sur « Moyen » si elle est vide', () => {
    const onlyEpic = { easy: 0, medium: 0, hard: 0, epic: 1 }
    const empty = { easy: 0, medium: 0, hard: 0, epic: 0 }

    expect(drawMissionXp(onlyEpic, seeded())).toBe(400)
    expect(drawMissionXp(empty, seeded())).toBe(100)
  })

  it('fixe la cible d’un bot adaptatif par rapport aux élèves réels', () => {
    const missions = [1, 4, 6, 9]

    expect(adaptiveTarget('ahead_of_first', missions)).toBe(10)
    expect(adaptiveTarget('middle', missions)).toBe(5)
    expect(adaptiveTarget('behind_last', missions)).toBe(0)
    expect(adaptiveTarget('middle', [2, 3, 10])).toBe(3)
    expect(adaptiveTarget('behind_last', [0, 3])).toBe(0)
    expect(adaptiveTarget('ahead_of_first', [])).toBe(0)
  })

  it('propose des pseudos de bots tous valides et distincts', () => {
    expect(new Set(BOT_PSEUDOS).size).toBe(BOT_PSEUDOS.length)
    for (const pseudo of BOT_PSEUDOS) expect(checkPseudo(pseudo), pseudo).toBeNull()
  })
})
