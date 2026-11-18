import { describe, expect, it } from 'vitest'
import { hashPassword } from '../../server/auth/passwords.js'
import { DemoError, seedDemo, type DemoSummary } from '../../server/demo/seed.js'
import { QUEST_FORMAT_IDS } from '../../shared/rules/quests.js'
import type { AdminOverviewResponse, AdminStudentsResponse } from '../../shared/schemas/admin.js'
import type { AdminBotsResponse, LeaderboardResponse } from '../../shared/schemas/leaderboard.js'
import type { ProgressResponse } from '../../shared/schemas/progress.js'
import type {
  AdminQuestsResponse,
  StudentQuestsResponse,
  ValidationsResponse,
} from '../../shared/schemas/quests.js'
import { createTestApp, type TestApp, type TestClient } from '../helpers/test-app.js'

const PASSWORD = 'demo-de-test'

/** Hasard reproductible : la même démonstration à chaque test. */
function seededRandom(seed = 2026) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

async function install(now?: string): Promise<{ scene: TestApp; summary: DemoSummary }> {
  const scene = createTestApp()
  if (now) scene.clock.now = new Date(now)
  const passwordHash = await hashPassword(PASSWORD, scene.config.scrypt)
  const summary = await scene
    .database()
    .write((tx) => seedDemo(tx, { now: scene.clock.now, random: seededRandom(), passwordHash }))
  return { scene, summary }
}

async function logIn(scene: TestApp, pseudo: string): Promise<TestClient> {
  const client = scene.client()
  const response = await client.post('/api/auth/login', { login: pseudo, password: PASSWORD })
  if (response.status !== 200) throw new Error(JSON.stringify(response.body))
  return client
}

describe('données de démonstration', () => {
  it('installe 1 admin, 6 élèves, 3 bots et 10 quêtes couvrant tous les formats', async () => {
    const { scene, summary } = await install()
    const admin = await logIn(scene, 'Coach')

    const students = (await admin.get<AdminStudentsResponse>('/api/admin/students')).body.students
    const bots = (await admin.get<AdminBotsResponse>('/api/admin/bots')).body.bots
    const quests = (await admin.get<AdminQuestsResponse>('/api/admin/quests')).body.quests
    const admins = await scene
      .database()
      .read((tx) => tx.all(`SELECT id FROM users WHERE role = 'admin'`))

    expect(summary).toEqual({
      admin: 'Coach',
      students: ['Luciole', 'Kiwi', 'Zébulon', 'Mistigri', 'Pistache', 'Flocon'],
      bots: ['Astro', 'Comète', 'Pixel'],
      quests: 10,
    })
    expect(admins).toHaveLength(1)
    expect(students.map((student) => student.pseudo).sort()).toEqual([...summary.students].sort())
    expect(bots.map((bot) => bot.pseudo)).toEqual(['Astro', 'Comète', 'Pixel'])
    expect(quests).toHaveLength(10)
    expect(new Set(quests.map((quest) => quest.format))).toEqual(new Set(QUEST_FORMAT_IDS))
    // Tous les états d'une quête y figurent.
    expect(new Set(quests.map((quest) => quest.state))).toEqual(
      new Set(['draft', 'published', 'archived']),
    )
  })

  it('raconte trois semaines d’activité, calculées par les règles du jeu', async () => {
    const { scene } = await install()
    const admin = await logIn(scene, 'Coach')

    const students = (await admin.get<AdminStudentsResponse>('/api/admin/students')).body.students
    const byPseudo = Object.fromEntries(students.map((student) => [student.pseudo, student]))
    const journal = await scene.database().read((tx) =>
      tx.all<{ pseudo: string; xp: number; missions: number }>(
        `SELECT users.pseudo, SUM(amount) AS xp, SUM(mission_delta) AS missions
           FROM xp_entries JOIN users ON users.id = xp_entries.user_id
           WHERE users.role = 'student' GROUP BY users.id`,
      ),
    )

    // L'XP et les missions de chacun sont les sommes de son journal.
    for (const line of journal) {
      expect(byPseudo[line.pseudo]).toMatchObject({ xp: line.xp, missions: line.missions })
    }
    // 60 + 120 + 55 + 120 + 220 + 50 + 110 + 240 + 240 + 110 : bonus compris.
    expect(byPseudo.Luciole).toMatchObject({ xp: 1325, level: 5, missions: 9 })
    expect(byPseudo.Kiwi).toMatchObject({ xp: 1070, level: 5, missions: 7 })
    expect(byPseudo.Mistigri).toMatchObject({ xp: 925, level: 4, missions: 7 })
    expect(byPseudo.Flocon).toMatchObject({ xp: 355, level: 3, missions: 4 })
    expect(byPseudo['Zébulon']).toMatchObject({ xp: 440, level: 3, missions: 4 })
    expect(byPseudo.Pistache).toMatchObject({ xp: 110, level: 2, missions: 2 })
  })

  it('montre chaque situation : annonce, série, badges, refus, tentatives épuisées', async () => {
    const { scene } = await install()

    const luciole = await logIn(scene, 'Luciole')
    const progress = (await luciole.get<ProgressResponse>('/api/progress')).body.progress
    const zebulon = await logIn(scene, 'Zébulon')
    const zebulonQuests = (await zebulon.get<StudentQuestsResponse>('/api/quests')).body.quests
    const mistigri = await logIn(scene, 'Mistigri')
    const mistigriQuests = (await mistigri.get<StudentQuestsResponse>('/api/quests')).body.quests
    const flocon = await logIn(scene, 'Flocon')
    const floconQuests = (await flocon.get<StudentQuestsResponse>('/api/quests')).body.quests
    const status = (quests: typeof zebulonQuests, title: string) =>
      quests.find((quest) => quest.title.startsWith(title))

    // Luciole : neuf jours de série, le badge Régulier, et une annonce qui l'attend.
    expect(progress.streak).toEqual({ current: 9, best: 9 })
    const earned = progress.badges.filter((badge) => badge.earnedAt).map((badge) => badge.code)
    expect(earned).toEqual(expect.arrayContaining(['first_step', 'regular', 'early']))
    expect(progress.celebration?.validations.map((validation) => validation.title)).toEqual([
      'Verbes irréguliers anglais',
    ])
    // Elle seule : les autres élèves ont déjà vu leurs quêtes validées et leurs badges.
    for (const other of [zebulon, mistigri, flocon]) {
      expect((await other.get<ProgressResponse>('/api/progress')).body.progress.celebration).toBe(
        null,
      )
    }
    // Zébulon : un résumé refusé, à reprendre ; une quête réussie au deuxième essai.
    expect(status(zebulonQuests, 'Résume')?.status).toBe('rejected')
    expect(status(zebulonQuests, 'Révolution')).toMatchObject({
      status: 'validated',
      xpAwarded: 220,
    })
    expect(status(zebulonQuests, 'Capitales')?.status).toBe('expired')
    // Mistigri : toutes ses tentatives utilisées sur les problèmes.
    expect(status(mistigriQuests, 'Problèmes')).toMatchObject({
      status: 'in_progress',
      blocked: true,
    })
    // Flocon : une quête expirée, et la course archivée reste dans ses quêtes terminées.
    expect(status(floconQuests, 'Résume')?.status).toBe('expired')
    expect(status(floconQuests, '20 minutes')?.status).toBe('validated')
  })

  it('alimente la vue d’ensemble, la file de validation et le classement', async () => {
    const { scene } = await install()
    const admin = await logIn(scene, 'Coach')

    const overview = (await admin.get<AdminOverviewResponse>('/api/admin/overview')).body.overview
    const queue = (await admin.get<ValidationsResponse>('/api/admin/validations')).body
    const board = (await admin.get<LeaderboardResponse>('/api/leaderboard?period=all')).body
    const bots = (await admin.get<AdminBotsResponse>('/api/admin/bots')).body.bots

    expect(overview).toMatchObject({
      totalStudents: 6,
      activeStudents: 6,
      questsInProgress: 5,
      pendingValidations: 3,
    })
    expect(overview.expiringSoon.map((quest) => [quest.title, quest.remaining])).toEqual([
      ['Révolution française\u00A0: les dates clés', 2],
    ])
    expect(overview.inactiveStudents.map((student) => student.pseudo)).toEqual(['Flocon'])
    expect(queue.validations.map((entry) => entry.student.pseudo)).toEqual([
      'Zébulon',
      'Pistache',
      'Kiwi',
    ])
    // Luciole mène ; les bots ont progressé seuls, sans passer devant elle.
    expect(board.entries[0]).toMatchObject({ rank: 1, pseudo: 'Luciole', missions: 9 })
    expect(board.entries).toHaveLength(9)
    for (const bot of bots) expect(bot.missions).toBeGreaterThan(0)
    expect(bots.find((bot) => bot.pseudo === 'Pixel')?.paused).toBe(true)
  })

  it('refuse de s’installer dans une base qui a déjà des comptes', async () => {
    const scene = createTestApp()
    await scene.client().signUpStudent('Léa')
    const passwordHash = await hashPassword(PASSWORD, scene.config.scrypt)

    const attempt = scene
      .database()
      .write((tx) => seedDemo(tx, { now: scene.clock.now, random: seededRandom(), passwordHash }))

    await expect(attempt).rejects.toBeInstanceOf(DemoError)
    // Rien n'a été écrit : la base ne contient toujours que Léa.
    const users = await scene.database().read((tx) => tx.all('SELECT id FROM users'))
    expect(users).toHaveLength(1)
  })

  it.each([
    ['un lundi au petit matin', '2026-11-23T05:10:00.000Z'],
    ['un dimanche soir', '2026-11-22T21:40:00.000Z'],
    ['un jour de changement d’heure', '2027-03-28T09:00:00.000Z'],
    ['un 1er janvier', '2027-01-01T11:00:00.000Z'],
  ])('s’installe quel que soit le moment : %s', async (_label, now) => {
    const { scene, summary } = await install(now)
    const admin = await logIn(scene, 'Coach')

    const students = (await admin.get<AdminStudentsResponse>('/api/admin/students')).body.students
    const overview = (await admin.get<AdminOverviewResponse>('/api/admin/overview')).body.overview

    expect(summary.quests).toBe(10)
    expect(students.find((student) => student.pseudo === 'Luciole')).toMatchObject({
      xp: 1325,
      missions: 9,
    })
    expect(overview.pendingValidations).toBe(3)
    expect(overview.inactiveStudents.map((student) => student.pseudo)).toEqual(['Flocon'])
  })
})
