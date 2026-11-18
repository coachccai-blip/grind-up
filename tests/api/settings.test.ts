import { describe, expect, it } from 'vitest'
import { DEFAULT_GAME_SETTINGS } from '../../shared/rules/settings.js'
import type { ApiErrorBody } from '../../shared/schemas/errors.js'
import type { AdminBotResponse, LeaderboardResponse } from '../../shared/schemas/leaderboard.js'
import type {
  AdminQuestResponse,
  AssignmentResponse,
  StudentQuestResponse,
} from '../../shared/schemas/quests.js'
import type { AdminSettingsResponse } from '../../shared/schemas/settings.js'
import { createTestApp, DAY, HOUR, type TestApp, type TestClient } from '../helpers/test-app.js'

/** L'horloge des tests démarre le mardi 17 novembre 2026 à 10 h UTC. */
const IN_TWO_DAYS = '2026-11-19T10:00:00.000Z'
const IN_THREE_HOURS = '2026-11-17T13:00:00.000Z'

interface Scene extends TestApp {
  admin: TestClient
  lea: TestClient
  leaId: string
}

async function setup(): Promise<Scene> {
  const testApp = createTestApp()
  const admin = testApp.client()
  await admin.signUpAdmin('Coach')
  const lea = testApp.client()
  const leaId = (await lea.signUpStudent('Léa')).id
  return { ...testApp, admin, lea, leaId }
}

const readSettings = async (admin: TestClient) =>
  (await admin.get<AdminSettingsResponse>('/api/admin/settings')).body.settings

const change = (admin: TestClient, changes: unknown) =>
  admin.patch<AdminSettingsResponse & ApiErrorBody>('/api/admin/settings', changes)

/** Une quête de maths à deux questions, donnée à tous les élèves. */
async function createMathsQuest(admin: TestClient, overrides: Record<string, unknown> = {}) {
  const response = await admin.post<AdminQuestResponse>('/api/admin/quests', {
    title: 'Tables de multiplication',
    instructions: 'Réponds sans calculatrice.',
    category: 'maths',
    format: 'exact',
    difficulty: 'medium',
    rewardXp: 100,
    deadlineAt: null,
    items: [
      { prompt: '6 × 7 ?', answers: ['42'] },
      { prompt: '9 × 9 ?', answers: ['81'] },
    ],
    assignees: 'all',
    publish: true,
    ...overrides,
  })
  if (response.status !== 201) throw new Error(JSON.stringify(response.body))
  return response.body.quest
}

/** L'élève répond juste aux deux questions. */
async function answerRight(student: TestClient, questId: string) {
  const quest = (await student.get<StudentQuestResponse>(`/api/quests/${questId}`)).body.quest
  return student.post<StudentQuestResponse>(`/api/quests/${questId}/attempts`, {
    answers: { [quest.items[0]!.id]: '42', [quest.items[1]!.id]: '81' },
  })
}

describe('paramètres', () => {
  it('partent des valeurs du brief', async () => {
    const { admin } = await setup()

    const settings = await readSettings(admin)

    expect(settings).toEqual(DEFAULT_GAME_SETTINGS)
    expect(settings).toEqual({
      rewards: { easy: 50, medium: 100, hard: 200, epic: 400 },
      earlyBonusPercent: 10,
      flawlessBonusPercent: 10,
      latePercent: 50,
      defaultPassThreshold: 80,
      defaultMaxAttempts: 3,
      showBotLabel: false,
    })
  })

  it('ne se lisent et ne se modifient que par un admin', async () => {
    const scene = await setup()
    const visitor = scene.client()

    expect((await visitor.get('/api/admin/settings')).status).toBe(401)
    expect((await scene.lea.get('/api/admin/settings')).status).toBe(403)
    expect((await change(scene.lea, { latePercent: 100 })).status).toBe(403)
    expect((await readSettings(scene.admin)).latePercent).toBe(50)
  })

  it('s’enregistrent champ par champ : ce qui n’est pas envoyé ne change pas', async () => {
    const { admin } = await setup()

    const first = await change(admin, { rewards: { easy: 30, medium: 60, hard: 120, epic: 240 } })
    const second = await change(admin, { earlyBonusPercent: 25, showBotLabel: true })

    expect(first.status).toBe(200)
    expect(first.body.settings.rewards).toEqual({ easy: 30, medium: 60, hard: 120, epic: 240 })
    expect(second.body.settings).toEqual({
      ...DEFAULT_GAME_SETTINGS,
      rewards: { easy: 30, medium: 60, hard: 120, epic: 240 },
      earlyBonusPercent: 25,
      showBotLabel: true,
    })
    expect(await readSettings(admin)).toEqual(second.body.settings)
  })

  it('refusent les valeurs hors limites, en disant lesquelles', async () => {
    const { admin } = await setup()

    const refused = await change(admin, {
      rewards: { easy: -1, medium: 100, hard: 200.5, epic: 20_000 },
      earlyBonusPercent: 101,
      latePercent: -5,
      defaultPassThreshold: 0,
      defaultMaxAttempts: 11,
    })
    const incomplete = await change(admin, { rewards: { easy: 10 } })
    const empty = await change(admin, {})

    expect(refused.status).toBe(400)
    expect(Object.keys(refused.body.error.fields ?? {}).sort()).toEqual([
      'defaultMaxAttempts',
      'defaultPassThreshold',
      'earlyBonusPercent',
      'latePercent',
      'rewards.easy',
      'rewards.epic',
      'rewards.hard',
    ])
    expect(incomplete.status).toBe(400)
    expect(empty.status).toBe(400)
    // Rien n'a été enregistré.
    expect(await readSettings(admin)).toEqual(DEFAULT_GAME_SETTINGS)
  })
})

describe('bonus réglés dans les paramètres', () => {
  it('s’appliquent aux validations suivantes, sans toucher à l’XP déjà gagnée', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const before = await createMathsQuest(admin, { deadlineAt: IN_TWO_DAYS })
    const first = await answerRight(lea, before.id)

    await change(admin, { earlyBonusPercent: 20, flawlessBonusPercent: 30 })
    const after = await createMathsQuest(admin, { title: 'Encore', deadlineAt: IN_TWO_DAYS })
    const second = await answerRight(lea, after.id)

    // Avant le changement : +10 % d'avance et +10 % sans faute.
    expect(first.body.quest.reward?.total).toBe(120)
    // Après : +20 % et +30 %.
    expect(second.body.quest.reward).toEqual({
      base: 100,
      late: false,
      bonuses: [
        { kind: 'early', amount: 20 },
        { kind: 'flawless', amount: 30 },
      ],
      total: 150,
    })
    const total = await scene
      .database()
      .read((tx) =>
        tx.get<{ xp: number }>('SELECT SUM(amount) AS xp FROM xp_entries WHERE user_id = ?', [
          leaId,
        ]),
      )
    expect(total?.xp).toBe(270)
  })

  it('un bonus à 0 % n’ajoute rien', async () => {
    const { admin, lea } = await setup()
    await change(admin, { earlyBonusPercent: 0, flawlessBonusPercent: 0 })
    const quest = await createMathsQuest(admin, { deadlineAt: IN_TWO_DAYS })

    const done = await answerRight(lea, quest.id)

    expect(done.body.quest.reward?.total).toBe(100)
    expect(done.body.quest.xpAwarded).toBe(100)
  })

  it('une quête rendue en retard garde la part fixée dans les paramètres', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    await change(admin, { latePercent: 25 })
    const quest = await createMathsQuest(admin, { deadlineAt: IN_THREE_HOURS })
    const assignmentId = quest.assignments.find((a) => a.student.id === leaId)!.id

    scene.advance(4 * HOUR)
    await admin.post<AssignmentResponse>(`/api/admin/assignments/${assignmentId}/reopen`)
    const offered = (await lea.get<StudentQuestResponse>(`/api/quests/${quest.id}`)).body.quest
    const done = await answerRight(lea, quest.id)

    // L'élève est prévenu de ce que la quête rouverte rapporte.
    expect(offered.lateRewardXp).toBe(25)

    // 25 % de 100 XP, plus le bonus sans faute calculé sur cette part : 27,5 arrondi à 28.
    expect(done.body.quest.reward).toEqual({
      base: 25,
      late: true,
      bonuses: [{ kind: 'flawless', amount: 3 }],
      total: 28,
    })
  })
})

describe('barème réglé dans les paramètres', () => {
  it('l’XP des missions des bots y est tirée', async () => {
    const scene = await setup()
    const { admin } = scene
    await change(admin, { rewards: { easy: 7, medium: 7, hard: 7, epic: 7 } })
    // Lundi 23 novembre, 7 h à Paris : le bot commence une semaine entière.
    scene.advance(5 * DAY + 19 * HOUR)
    const bot = await admin.post<AdminBotResponse>('/api/admin/bots', {
      pseudo: 'Astro',
      avatar: 'astronaut',
      mode: 'regular',
      missionsPerWeek: 6,
      capped: false,
    })

    scene.advance(8 * DAY)
    await admin.post('/api/auth/login', { login: 'Coach', password: 'motdepasse-admin' })
    await admin.get<LeaderboardResponse>('/api/leaderboard')

    const amounts = await scene
      .database()
      .read((tx) =>
        tx.all<{ amount: number }>('SELECT amount FROM xp_entries WHERE user_id = ?', [
          bot.body.bot.id,
        ]),
      )
    expect(amounts.length).toBeGreaterThanOrEqual(6)
    expect(new Set(amounts.map((entry) => entry.amount))).toEqual(new Set([7]))
  })

  it('ne change pas la récompense des quêtes déjà créées', async () => {
    const { admin, lea } = await setup()
    const quest = await createMathsQuest(admin)

    await change(admin, { rewards: { easy: 10, medium: 20, hard: 30, epic: 40 } })
    const done = await answerRight(lea, quest.id)

    // 100 XP, plus le bonus sans faute.
    expect(done.body.quest.reward?.total).toBe(110)
  })
})

describe('valeurs proposées pour une nouvelle quête', () => {
  it('le seuil et les tentatives non envoyés prennent les valeurs des paramètres', async () => {
    const { admin } = await setup()
    await change(admin, { defaultPassThreshold: 60, defaultMaxAttempts: 5 })

    const implicit = await createMathsQuest(admin)
    const explicit = await createMathsQuest(admin, {
      title: 'À ma façon',
      passThreshold: 100,
      maxAttempts: 1,
    })

    expect([implicit.passThreshold, implicit.maxAttempts]).toEqual([60, 5])
    expect([explicit.passThreshold, explicit.maxAttempts]).toEqual([100, 1])
  })

  it('une quête enregistrée garde ses valeurs quand les paramètres changent', async () => {
    const { admin } = await setup()
    const quest = await createMathsQuest(admin)

    await change(admin, { defaultPassThreshold: 50, defaultMaxAttempts: 9 })
    const read = await admin.get<AdminQuestResponse>(`/api/admin/quests/${quest.id}`)

    expect([read.body.quest.passThreshold, read.body.quest.maxAttempts]).toEqual([80, 3])
  })
})
