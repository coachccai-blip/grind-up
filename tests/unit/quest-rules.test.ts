import { describe, expect, it } from 'vitest'
import {
  effectiveStatus,
  isLate,
  isPastDeadline,
  tabOfStatus,
} from '../../shared/rules/assignment-status.js'
import { countdown, formatRemaining } from '../../shared/rules/countdown.js'
import { PALETTE } from '../../shared/rules/palette.js'
import {
  ASSIGNMENT_STATUSES,
  QUEST_CATEGORIES,
  QUEST_DIFFICULTIES,
  QUEST_FORMATS,
  SUGGESTED_FORMAT,
} from '../../shared/rules/quests.js'
import { computeReward } from '../../shared/rules/rewards.js'
import { instantToParisLocal, parisLocalToInstant } from '../../shared/time.js'

const at = (iso: string) => new Date(iso)
const HOUR = 60 * 60 * 1000

describe('vocabulaire des quêtes', () => {
  it('reprend les catégories, difficultés et statuts du brief, avec leurs emojis', () => {
    expect(QUEST_CATEGORIES.map((c) => `${c.emoji} ${c.label}`)).toEqual([
      '🧮 Maths',
      '🧠 Mémorisation',
      '🏃 Sport',
      '🧩 Autre',
    ])
    expect(QUEST_DIFFICULTIES.map((d) => `${d.emoji} ${d.label} ${d.defaultReward}`)).toEqual([
      '🌱 Facile 50',
      '⚡ Moyen 100',
      '🌋 Difficile 200',
      '🐉 Épique 400',
    ])
    expect(ASSIGNMENT_STATUSES.map((s) => `${s.emoji} ${s.label}`)).toEqual([
      '📝 À faire',
      '✍️ En cours',
      '📨 Soumise',
      '✅ Validée',
      '🔁 Refusée',
      '💤 Expirée',
    ])
    expect(QUEST_FORMATS.map((f) => f.label)).toEqual([
      'Questions à réponse exacte',
      'QCM',
      'Cartes de mémorisation',
      'Déclaratif',
      'Réponse libre',
    ])
  })

  it('donne à chaque catégorie une couleur de la palette et un format proposé', () => {
    for (const category of QUEST_CATEGORIES) {
      expect(PALETTE[category.color]).toMatch(/^#[0-9A-F]{6}$/)
      expect(QUEST_FORMATS.map((f) => f.id)).toContain(SUGGESTED_FORMAT[category.id])
    }
  })
})

describe('statut d’une quête assignée', () => {
  const deadline = '2026-11-20T17:00:00.000Z'
  const before = at('2026-11-20T16:59:59Z')
  const after = at('2026-11-20T17:00:01Z')

  it('passe en Expirée dès que la deadline est dépassée, sans rien enregistrer', () => {
    for (const status of ['todo', 'in_progress', 'rejected'] as const) {
      const facts = { status, deadlineAt: deadline, reopenedAt: null }
      expect(effectiveStatus(facts, before)).toBe(status)
      expect(effectiveStatus(facts, after)).toBe('expired')
    }
  })

  it('n’expire pas à l’instant exact de la deadline', () => {
    const facts = { status: 'todo' as const, deadlineAt: deadline, reopenedAt: null }
    expect(effectiveStatus(facts, at(deadline))).toBe('todo')
  })

  it('n’expire jamais une quête soumise ou validée', () => {
    for (const status of ['submitted', 'validated'] as const) {
      expect(effectiveStatus({ status, deadlineAt: deadline, reopenedAt: null }, after)).toBe(
        status,
      )
    }
  })

  it('n’expire jamais une quête sans deadline', () => {
    const facts = { status: 'in_progress' as const, deadlineAt: null, reopenedAt: null }
    expect(effectiveStatus(facts, at('2099-01-01T00:00:00Z'))).toBe('in_progress')
  })

  it('redevient réalisable quand l’admin la rouvre après la deadline', () => {
    const facts = {
      status: 'in_progress' as const,
      deadlineAt: deadline,
      reopenedAt: '2026-11-21T08:00:00.000Z',
    }
    expect(isPastDeadline(facts, at('2026-11-22T08:00:00Z'))).toBe(false)
    expect(effectiveStatus(facts, at('2026-11-22T08:00:00Z'))).toBe('in_progress')
  })

  it('expire à nouveau si une nouvelle deadline, posée après la réouverture, est dépassée', () => {
    const facts = {
      status: 'in_progress' as const,
      deadlineAt: '2026-11-25T17:00:00.000Z',
      reopenedAt: '2026-11-21T08:00:00.000Z',
    }
    expect(effectiveStatus(facts, at('2026-11-24T08:00:00Z'))).toBe('in_progress')
    expect(effectiveStatus(facts, at('2026-11-26T08:00:00Z'))).toBe('expired')
  })

  it('redevient À faire si la deadline est repoussée dans le futur', () => {
    const expired = { status: 'todo' as const, deadlineAt: deadline, reopenedAt: null }
    expect(effectiveStatus(expired, after)).toBe('expired')
    const moved = { ...expired, deadlineAt: '2026-12-01T17:00:00.000Z' }
    expect(effectiveStatus(moved, after)).toBe('todo')
  })

  it('range chaque statut dans un onglet de « Mes quêtes »', () => {
    expect(
      (['todo', 'in_progress', 'rejected', 'submitted', 'validated', 'expired'] as const).map(
        tabOfStatus,
      ),
    ).toEqual(['todo', 'todo', 'todo', 'pending', 'done', 'expired'])
  })

  it('reconnaît une réalisation en retard', () => {
    expect(isLate(deadline, before)).toBe(false)
    expect(isLate(deadline, after)).toBe(true)
    expect(isLate(null, after)).toBe(false)
  })
})

describe('calcul de l’XP d’une quête validée', () => {
  const deadline = '2026-11-20T17:00:00.000Z'
  const reward = (
    overrides: Partial<Parameters<typeof computeReward>[0]> = {},
  ): ReturnType<typeof computeReward> =>
    computeReward({
      reward: 100,
      deadlineAt: deadline,
      completedAt: at('2026-11-20T10:00:00Z'),
      flawlessFirstAttempt: false,
      ...overrides,
    })

  it('crédite la récompense seule, sans bonus, à moins de 24 h de la deadline', () => {
    expect(reward()).toEqual({ base: 100, late: false, bonuses: [], total: 100 })
  })

  it('ajoute 10 % quand la quête est réalisée plus de 24 h avant la deadline', () => {
    const early = reward({ completedAt: at('2026-11-19T16:59:59Z') })
    expect(early).toEqual({
      base: 100,
      late: false,
      bonuses: [{ kind: 'early', amount: 10 }],
      total: 110,
    })
  })

  it('n’accorde pas le bonus d’avance à 24 h pile', () => {
    expect(reward({ completedAt: at('2026-11-19T17:00:00Z') }).bonuses).toEqual([])
  })

  it('ajoute 10 % pour un sans-faute dès la première tentative', () => {
    expect(reward({ flawlessFirstAttempt: true })).toEqual({
      base: 100,
      late: false,
      bonuses: [{ kind: 'flawless', amount: 10 }],
      total: 110,
    })
  })

  it('cumule les deux bonus en les additionnant : +20 %, pas +21 %', () => {
    const both = reward({ completedAt: at('2026-11-18T10:00:00Z'), flawlessFirstAttempt: true })
    expect(both.total).toBe(120)
    expect(both.bonuses).toEqual([
      { kind: 'early', amount: 10 },
      { kind: 'flawless', amount: 10 },
    ])
  })

  it('arrondit le total à l’entier le plus proche, et les lignes s’additionnent au total', () => {
    // 55 × 1,2 = 66 ; chaque bonus vaudrait 5,5.
    const both = reward({
      reward: 55,
      completedAt: at('2026-11-18T10:00:00Z'),
      flawlessFirstAttempt: true,
    })
    expect(both.total).toBe(66)
    expect(both.base + both.bonuses.reduce((sum, bonus) => sum + bonus.amount, 0)).toBe(66)

    // 105 × 1,1 = 115,5 → 116.
    expect(reward({ reward: 105, flawlessFirstAttempt: true }).total).toBe(116)
    // 33 × 1,1 = 36,3 → 36.
    expect(reward({ reward: 33, flawlessFirstAttempt: true }).total).toBe(36)
  })

  it('ne donne aucun bonus d’avance à une quête sans deadline', () => {
    const noDeadline = reward({ deadlineAt: null, completedAt: at('2020-01-01T00:00:00Z') })
    expect(noDeadline).toEqual({ base: 100, late: false, bonuses: [], total: 100 })
  })

  it('ne garde que 50 % pour une quête rouverte et réalisée après la deadline', () => {
    const late = reward({ completedAt: at('2026-11-21T10:00:00Z') })
    expect(late).toEqual({ base: 50, late: true, bonuses: [], total: 50 })
  })

  it('applique le bonus sans faute à la récompense réduite d’une quête en retard', () => {
    const late = reward({ completedAt: at('2026-11-21T10:00:00Z'), flawlessFirstAttempt: true })
    expect(late).toEqual({
      base: 50,
      late: true,
      bonuses: [{ kind: 'flawless', amount: 5 }],
      total: 55,
    })
  })

  it('reste à zéro pour une récompense nulle', () => {
    expect(reward({ reward: 0, flawlessFirstAttempt: true }).total).toBe(0)
  })

  it('suit des règles modifiées par l’admin', () => {
    const custom = computeReward(
      {
        reward: 200,
        deadlineAt: deadline,
        completedAt: at('2026-11-18T10:00:00Z'),
        flawlessFirstAttempt: true,
      },
      { earlyBonusPercent: 25, flawlessBonusPercent: 5, latePercent: 50, earlyBonusHours: 48 },
    )
    expect(custom.total).toBe(260)
  })
})

describe('compte à rebours', () => {
  const deadline = '2026-11-20T17:00:00.000Z'
  const before = (ms: number) => new Date(new Date(deadline).getTime() - ms)

  it('reste calme à plus de 24 h', () => {
    const result = countdown(deadline, before(3 * 24 * HOUR + 4 * HOUR + 10 * 60 * 1000))
    expect(result.tone).toBe('calm')
    expect(result.text).toBe('Encore 3\u00A0j 4\u00A0h')
  })

  it('passe en orange à moins de 24 h, avec une autre formule', () => {
    const result = countdown(deadline, before(5 * HOUR + 12 * 60 * 1000))
    expect(result.tone).toBe('soon')
    expect(result.text).toBe('Plus que 5\u00A0h 12\u00A0min')
    expect(countdown(deadline, before(24 * HOUR)).tone).toBe('calm')
    expect(countdown(deadline, before(24 * HOUR - 1)).tone).toBe('soon')
  })

  it('passe en rouge à moins de 3 h, et le dit', () => {
    const result = countdown(deadline, before(42 * 60 * 1000))
    expect(result.tone).toBe('urgent')
    expect(result.text).toBe('Urgent\u00A0: plus que 42\u00A0min')
    expect(countdown(deadline, before(3 * HOUR)).tone).toBe('soon')
    expect(countdown(deadline, before(3 * HOUR - 1)).tone).toBe('urgent')
  })

  it('annonce la deadline dépassée', () => {
    expect(countdown(deadline, new Date(deadline))).toMatchObject({
      tone: 'over',
      text: 'Deadline dépassée',
    })
  })

  it('écrit les durées en deux unités au plus', () => {
    expect(formatRemaining(2 * 24 * HOUR)).toBe('2\u00A0j')
    expect(formatRemaining(HOUR)).toBe('1\u00A0h')
    expect(formatRemaining(59 * 1000)).toBe('moins d’une minute')
    expect(formatRemaining(60 * 1000)).toBe('1\u00A0min')
  })

  it('indique quand rafraîchir l’affichage', () => {
    const result = countdown(deadline, before(5 * HOUR + 12 * 60 * 1000 + 30 * 1000))
    expect(result.refreshInMs).toBe(30 * 1000 + 1)
  })
})

describe('heure de Paris', () => {
  it('convertit une saisie d’hiver (UTC+1) et d’été (UTC+2)', () => {
    expect(parisLocalToInstant('2026-11-20T18:00')?.toISOString()).toBe('2026-11-20T17:00:00.000Z')
    expect(parisLocalToInstant('2026-07-14T09:30')?.toISOString()).toBe('2026-07-14T07:30:00.000Z')
  })

  it('fait l’aller-retour entre un instant et l’heure de Paris', () => {
    for (const local of ['2026-01-01T00:00', '2026-06-30T23:59', '2026-11-20T18:00']) {
      expect(instantToParisLocal(parisLocalToInstant(local)!)).toBe(local)
    }
    expect(instantToParisLocal(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01T00:30')
  })

  it('traverse les changements d’heure', () => {
    // 29 mars 2026 : à 2 h il est 3 h. La veille du changement, puis juste après.
    expect(parisLocalToInstant('2026-03-29T01:59')?.toISOString()).toBe('2026-03-29T00:59:00.000Z')
    expect(parisLocalToInstant('2026-03-29T03:00')?.toISOString()).toBe('2026-03-29T01:00:00.000Z')
    // L'heure sautée est décalée à l'heure qui la suit.
    expect(instantToParisLocal(parisLocalToInstant('2026-03-29T02:30')!)).toBe('2026-03-29T03:30')
    // 25 octobre 2026 : 2 h 30 existe deux fois, on garde le premier passage (heure d'été).
    expect(parisLocalToInstant('2026-10-25T02:30')?.toISOString()).toBe('2026-10-25T00:30:00.000Z')
    expect(parisLocalToInstant('2026-10-25T03:00')?.toISOString()).toBe('2026-10-25T02:00:00.000Z')
  })

  it('refuse une saisie qui n’est pas une date', () => {
    for (const local of ['', '2026-02-30T10:00', '2026-13-01T10:00', '2026-11-20', 'demain']) {
      expect(parisLocalToInstant(local)).toBeNull()
    }
  })
})
