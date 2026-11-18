import { describe, expect, it } from 'vitest'
import { BADGES, earnedBadges, type BadgeStats } from '../../shared/rules/badges.js'
import { levelFromXp, levelProgress, xpForLevel } from '../../shared/rules/levels.js'
import { computeStreak, shiftDay } from '../../shared/rules/streak.js'

describe('niveaux', () => {
  it('suit le tableau du brief', () => {
    expect([1, 2, 3, 4, 5, 10].map(xpForLevel)).toEqual([0, 100, 300, 600, 1000, 4500])
  })

  it('calcule le niveau à partir de l’XP totale, frontières comprises', () => {
    expect([0, 99, 100, 299, 300, 599, 600, 999, 1000, 4499, 4500].map(levelFromXp)).toEqual([
      1, 1, 2, 2, 3, 3, 4, 4, 5, 9, 10,
    ])
  })

  it('reste exact pour tous les niveaux, à un XP près de chaque frontière', () => {
    for (let level = 1; level <= 500; level += 1) {
      const threshold = xpForLevel(level)
      expect(levelFromXp(threshold)).toBe(level)
      if (level > 1) expect(levelFromXp(threshold - 1)).toBe(level - 1)
      expect(levelFromXp(threshold + 1)).toBe(level)
    }
  })

  it('laisse au niveau 1 une XP nulle ou négative', () => {
    expect(levelFromXp(0)).toBe(1)
    expect(levelFromXp(-250)).toBe(1)
    expect(levelProgress(-250)).toMatchObject({ level: 1, xpInLevel: 0, xpRemaining: 100 })
  })

  it('donne à la barre de progression l’XP du niveau en cours et ce qu’il reste', () => {
    // 340 XP : niveau 3 (300 XP), 40 XP acquis sur les 300 du niveau.
    expect(levelProgress(340)).toEqual({
      level: 3,
      xpInLevel: 40,
      xpToNextLevel: 300,
      xpRemaining: 260,
      percent: 13,
    })
    expect(levelProgress(0)).toMatchObject({ level: 1, xpInLevel: 0, xpRemaining: 100, percent: 0 })
    expect(levelProgress(99).percent).toBe(99)
    expect(levelProgress(100)).toMatchObject({ level: 2, xpInLevel: 0, percent: 0 })
  })
})

describe('série', () => {
  const always = [{ from: '2026-11-01', to: '2026-12-31' }]

  it('compte les jours consécutifs avec au moins une quête validée', () => {
    const streak = computeStreak({
      validationDays: ['2026-11-15', '2026-11-16', '2026-11-17'],
      openPeriods: always,
      today: '2026-11-17',
    })
    expect(streak).toEqual({ current: 3, best: 3 })
  })

  it('ne casse pas la série tant que la journée en cours n’est pas finie', () => {
    const streak = computeStreak({
      validationDays: ['2026-11-15', '2026-11-16'],
      openPeriods: always,
      today: '2026-11-17',
    })
    expect(streak).toEqual({ current: 2, best: 2 })
  })

  it('repart de zéro après un jour sans validation alors qu’une quête était à faire', () => {
    const streak = computeStreak({
      validationDays: ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-14'],
      openPeriods: always,
      today: '2026-11-17',
    })
    // Le 13 casse la première série ; les 15 et 16, sans validation, cassent la seconde.
    expect(streak).toEqual({ current: 0, best: 3 })
  })

  it('ne casse pas la série un jour où l’élève n’avait aucune quête à faire', () => {
    const streak = computeStreak({
      validationDays: ['2026-11-10', '2026-11-11', '2026-11-14'],
      // Rien à faire les 12 et 13 : ces jours ne comptent ni pour, ni contre.
      openPeriods: [
        { from: '2026-11-09', to: '2026-11-11' },
        { from: '2026-11-14', to: '2026-11-14' },
      ],
      today: '2026-11-17',
    })
    expect(streak).toEqual({ current: 3, best: 3 })
  })

  it('garde le record quand la série en cours est plus courte', () => {
    const streak = computeStreak({
      validationDays: [
        '2026-11-02',
        '2026-11-03',
        '2026-11-04',
        '2026-11-05',
        '2026-11-16',
        '2026-11-17',
      ],
      openPeriods: always,
      today: '2026-11-17',
    })
    expect(streak).toEqual({ current: 2, best: 4 })
  })

  it('vaut zéro sans aucune validation', () => {
    expect(computeStreak({ validationDays: [], openPeriods: always, today: '2026-11-17' })).toEqual(
      {
        current: 0,
        best: 0,
      },
    )
  })

  it('ne compte qu’une fois un jour où plusieurs quêtes sont validées', () => {
    const streak = computeStreak({
      validationDays: ['2026-11-17', '2026-11-17', '2026-11-17'],
      openPeriods: always,
      today: '2026-11-17',
    })
    expect(streak).toEqual({ current: 1, best: 1 })
  })

  it('traverse les fins de mois et d’année', () => {
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01')
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28')
    const streak = computeStreak({
      validationDays: ['2026-12-30', '2026-12-31', '2027-01-01'],
      openPeriods: [{ from: '2026-12-01', to: '2027-01-31' }],
      today: '2027-01-01',
    })
    expect(streak.current).toBe(3)
  })
})

describe('badges', () => {
  const none: BadgeStats = {
    validated: 0,
    validatedByCategory: {},
    bestStreak: 0,
    earlyBonuses: 0,
    flawlessBonuses: 0,
    podiumWeeks: 0,
  }

  it('reprend le jeu de départ du brief, avec ses emojis', () => {
    expect(BADGES.map((badge) => `${badge.emoji} ${badge.label}`)).toEqual([
      '👣 Premier pas',
      '📅 Régulier',
      '🚀 Inarrêtable',
      '📐 Matheux',
      '🐘 Mémoire d’éléphant',
      '🏅 Athlète',
      '⏰ En avance',
      '💯 Sans faute',
      '👑 Podium',
    ])
  })

  it('n’en donne aucun à un élève qui débute', () => {
    expect(earnedBadges(none)).toEqual([])
  })

  it('donne chaque badge au seuil exact de sa condition', () => {
    const cases: [string, Partial<BadgeStats>, Partial<BadgeStats>][] = [
      ['first_step', { validated: 0 }, { validated: 1 }],
      ['regular', { bestStreak: 6 }, { bestStreak: 7 }],
      ['unstoppable', { bestStreak: 29 }, { bestStreak: 30 }],
      ['maths', { validatedByCategory: { maths: 9 } }, { validatedByCategory: { maths: 10 } }],
      [
        'memory',
        { validatedByCategory: { memorization: 9 } },
        { validatedByCategory: { memorization: 10 } },
      ],
      ['athlete', { validatedByCategory: { sport: 9 } }, { validatedByCategory: { sport: 10 } }],
      ['early', { earlyBonuses: 4 }, { earlyBonuses: 5 }],
      ['flawless', { flawlessBonuses: 4 }, { flawlessBonuses: 5 }],
      ['podium', { podiumWeeks: 0 }, { podiumWeeks: 1 }],
    ]
    for (const [code, before, after] of cases) {
      expect(earnedBadges({ ...none, ...before }), code).not.toContain(code)
      expect(earnedBadges({ ...none, ...after }), code).toContain(code)
    }
  })

  it('dit où en est l’élève pour chaque badge', () => {
    const maths = BADGES.find((badge) => badge.code === 'maths')!
    expect(maths.progress({ ...none, validatedByCategory: { maths: 4 } })).toEqual({
      done: 4,
      goal: 10,
    })
  })
})
