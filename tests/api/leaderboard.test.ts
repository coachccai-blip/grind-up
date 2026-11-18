import { describe, expect, it } from 'vitest'
import type { ApiErrorBody } from '../../shared/schemas/errors.js'
import type {
  AdminBotResponse,
  AdminBotsResponse,
  LeaderboardEntry,
  LeaderboardResponse,
} from '../../shared/schemas/leaderboard.js'
import type { ProgressResponse } from '../../shared/schemas/progress.js'
import type { AdminSettingsResponse } from '../../shared/schemas/settings.js'
import type { AdminQuestResponse, StudentQuestResponse } from '../../shared/schemas/quests.js'
import { instantToParisLocal } from '../../shared/time.js'
import {
  createTestApp,
  DAY,
  HOUR,
  MINUTE,
  type TestApp,
  type TestClient,
} from '../helpers/test-app.js'

/** L'horloge des tests démarre le mardi 17 novembre 2026 à 11 h, heure de Paris. */
interface Scene extends TestApp {
  admin: TestClient
  students: Record<string, { client: TestClient; id: string }>
}

async function setup(pseudos: string[] = ['Léa', 'Tom', 'Inès']): Promise<Scene> {
  const testApp = createTestApp()
  const admin = testApp.client()
  await admin.signUpAdmin('Coach')
  const students: Scene['students'] = {}
  for (const pseudo of pseudos) {
    const client = testApp.client()
    students[pseudo] = { client, id: (await client.signUpStudent(pseudo)).id }
  }
  return { ...testApp, admin, students }
}

let questNumber = 0

/** L'élève valide une quête créée pour lui, pour la récompense donnée. */
async function validate(scene: Scene, pseudo: string, rewardXp = 100): Promise<void> {
  questNumber += 1
  const student = scene.students[pseudo]!
  const created = await scene.admin.post<AdminQuestResponse>('/api/admin/quests', {
    title: `Quête ${questNumber}`,
    category: 'sport',
    format: 'declarative',
    difficulty: 'medium',
    rewardXp,
    manualValidation: false,
    instructions: 'Fais-le.',
    assignees: [student.id],
    publish: true,
  })
  const response = await student.client.post<StudentQuestResponse>(
    `/api/quests/${created.body.quest.id}/attempts`,
    {},
  )
  if (response.body.quest?.status !== 'validated') throw new Error(JSON.stringify(response.body))
}

const board = async (who: TestClient, query = ''): Promise<LeaderboardEntry[]> =>
  (await who.get<LeaderboardResponse>(`/api/leaderboard${query}`)).body.entries

const lines = (entries: LeaderboardEntry[]) =>
  entries.map((entry) => `${entry.rank ?? '-'} ${entry.pseudo} ${entry.missions} ${entry.xp}`)

async function createBot(admin: TestClient, overrides: Record<string, unknown> = {}) {
  const response = await admin.post<AdminBotResponse>('/api/admin/bots', {
    pseudo: 'Astro',
    avatar: 'astronaut',
    mode: 'regular',
    missionsPerWeek: 5,
    capped: false,
    ...overrides,
  })
  if (response.status !== 201) throw new Error(JSON.stringify(response.body))
  return response.body.bot
}

describe('leaderboard', () => {
  it('se lit par les élèves et par l’admin, pas par un visiteur', async () => {
    const scene = await setup()

    expect((await scene.client().get('/api/leaderboard')).status).toBe(401)
    expect((await scene.students['Léa']!.client.get('/api/leaderboard')).status).toBe(200)
    expect((await scene.admin.get('/api/leaderboard')).status).toBe(200)
    const invalid = await scene.admin.get<ApiErrorBody>('/api/leaderboard?period=annee')
    expect(invalid.status).toBe(400)
  })

  it('classe par missions, puis par XP, puis par date de la dernière validation', async () => {
    const scene = await setup()
    await validate(scene, 'Tom', 100)
    scene.advance(MINUTE)
    await validate(scene, 'Léa', 100)
    scene.advance(MINUTE)
    await validate(scene, 'Léa', 50)
    scene.advance(MINUTE)
    await validate(scene, 'Inès', 100)

    const entries = await board(scene.admin)

    // Léa a deux missions ; Tom et Inès en ont une, avec la même XP : Tom a fini le premier.
    expect(lines(entries)).toEqual(['1 Léa 2 150', '2 Tom 1 100', '3 Inès 1 100'])
    expect(entries[0]).toEqual({
      rank: 1,
      pseudo: 'Léa',
      avatar: expect.any(String),
      level: 2,
      missions: 2,
      xp: 150,
      movement: null,
      isYou: false,
      isBot: false,
    })
  })

  it('peut se trier par XP', async () => {
    const scene = await setup()
    await validate(scene, 'Tom', 400)
    await validate(scene, 'Léa', 100)
    await validate(scene, 'Léa', 100)

    expect(lines(await board(scene.admin))).toEqual(['1 Léa 2 200', '2 Tom 1 400', '- Inès 0 0'])
    expect(lines(await board(scene.admin, '?sort=xp'))).toEqual([
      '1 Tom 1 400',
      '2 Léa 2 200',
      '- Inès 0 0',
    ])
  })

  it('met en avant la ligne de celui qui regarde, sans donner d’identifiant interne', async () => {
    const scene = await setup()
    await validate(scene, 'Tom')

    const entries = await board(scene.students['Tom']!.client)

    expect(entries.filter((entry) => entry.isYou).map((entry) => entry.pseudo)).toEqual(['Tom'])
    const sent = JSON.stringify(entries)
    for (const student of Object.values(scene.students)) expect(sent).not.toContain(student.id)
  })

  it('ne montre ni les admins ni les comptes désactivés', async () => {
    const scene = await setup()
    await validate(scene, 'Tom')
    await scene.admin.patch(`/api/admin/students/${scene.students['Tom']!.id}`, { isActive: false })

    const entries = await board(scene.admin)

    expect(entries.map((entry) => entry.pseudo).sort()).toEqual(['Inès', 'Léa'])
    // Réactivé, Tom retrouve sa place et ses missions.
    await scene.admin.patch(`/api/admin/students/${scene.students['Tom']!.id}`, { isActive: true })
    expect(lines(await board(scene.admin))[0]).toBe('1 Tom 1 100')
  })

  it('distingue cette semaine, ce mois et depuis toujours', async () => {
    const scene = await setup()
    // Mardi 17 novembre : une mission pour Léa.
    await validate(scene, 'Léa')
    // Lundi 23 novembre, nouvelle semaine du même mois : une mission pour Tom.
    scene.advance(6 * DAY)
    await validate(scene, 'Tom')

    expect(lines(await board(scene.admin, '?period=week'))).toEqual([
      '1 Tom 1 100',
      '- Inès 0 0',
      '- Léa 0 0',
    ])
    expect(lines(await board(scene.admin, '?period=month'))).toEqual([
      '1 Léa 1 100',
      '2 Tom 1 100',
      '- Inès 0 0',
    ])

    // Mardi 1er décembre : nouveau mois.
    scene.advance(8 * DAY)
    await scene.admin.post('/api/auth/login', { login: 'Coach', password: 'motdepasse-admin' })
    expect(lines(await board(scene.admin, '?period=month'))).toEqual([
      '- Inès 0 0',
      '- Léa 0 0',
      '- Tom 0 0',
    ])
    expect(lines(await board(scene.admin, '?period=all'))).toEqual([
      '1 Léa 1 100',
      '2 Tom 1 100',
      '- Inès 0 0',
    ])
  })

  it('indique les places gagnées ou perdues depuis la veille', async () => {
    const scene = await setup()
    await validate(scene, 'Léa')
    await validate(scene, 'Léa')
    scene.advance(MINUTE)
    await validate(scene, 'Tom')
    // Le lendemain, Inès dépasse tout le monde.
    scene.advance(DAY)
    await validate(scene, 'Inès')
    await validate(scene, 'Inès')
    await validate(scene, 'Inès')

    const entries = await board(scene.admin)

    expect(entries.map((entry) => `${entry.rank} ${entry.pseudo} ${entry.movement}`)).toEqual([
      '1 Inès null',
      '2 Léa -1',
      '3 Tom -1',
    ])
    // Le surlendemain, Tom repasse devant Léa : une place gagnée, une perdue.
    scene.advance(DAY)
    await validate(scene, 'Tom')
    await validate(scene, 'Tom')
    const next = await board(scene.admin)
    expect(next.map((entry) => `${entry.rank} ${entry.pseudo} ${entry.movement}`)).toEqual([
      '1 Inès 0',
      '2 Tom 1',
      '3 Léa -1',
    ])
  })

  it('ne compte plus une mission dont la validation a été annulée', async () => {
    const scene = await setup()
    await validate(scene, 'Léa')
    await validate(scene, 'Tom')
    const progress = await scene.admin.get<{
      progress: { assignments: { assignmentId: string }[] }
    }>(`/api/admin/students/${scene.students['Léa']!.id}/progress`)

    await scene.admin.post(
      `/api/admin/assignments/${progress.body.progress.assignments[0]!.assignmentId}/cancel`,
      {},
    )

    expect(lines(await board(scene.admin))).toEqual(['1 Tom 1 100', '- Inès 0 0', '- Léa 0 0'])
  })
})

describe('étiquette « Bot »', () => {
  it('est visible de l’admin, et des élèves seulement si l’admin le décide', async () => {
    const scene = await setup(['Léa'])
    await createBot(scene.admin)
    const lea = scene.students['Léa']!.client
    const isBot = (entries: LeaderboardEntry[]) =>
      Object.fromEntries(entries.map((entry) => [entry.pseudo, entry.isBot]))

    expect(isBot(await board(scene.admin))).toEqual({ Astro: true, Léa: false })
    expect(isBot(await board(lea))).toEqual({ Astro: false, Léa: false })

    const changed = await scene.admin.patch<AdminSettingsResponse>('/api/admin/settings', {
      showBotLabel: true,
    })
    expect(changed.body.settings.showBotLabel).toBe(true)
    expect(isBot(await board(lea))).toEqual({ Astro: true, Léa: false })
    expect((await lea.patch('/api/admin/settings', { showBotLabel: false })).status).toBe(403)
  })
})

describe('badge Podium', () => {
  it('récompense les élèves qui terminent une semaine dans les trois premiers', async () => {
    const scene = await setup(['Léa', 'Tom', 'Inès', 'Noa'])
    await validate(scene, 'Léa')
    await validate(scene, 'Léa')
    await validate(scene, 'Léa')
    await validate(scene, 'Tom')
    await validate(scene, 'Tom')
    await validate(scene, 'Inès', 100)
    await validate(scene, 'Noa', 50)
    const badge = async (pseudo: string) =>
      (
        await scene.students[pseudo]!.client.get<ProgressResponse>('/api/progress')
      ).body.progress.badges.find((one) => one.code === 'podium')?.earnedAt

    // En cours de semaine, personne n'a encore le badge.
    await board(scene.admin)
    expect(await badge('Léa')).toBeNull()

    // Lundi suivant : la semaine est terminée, le classement est demandé.
    scene.advance(6 * DAY)
    await board(scene.students['Noa']!.client)

    expect(await badge('Léa')).toBeTruthy()
    expect(await badge('Tom')).toBeTruthy()
    expect(await badge('Inès')).toBeTruthy()
    expect(await badge('Noa')).toBeNull()
    // Le nouveau badge est annoncé à l'élève.
    const lea = await scene.students['Léa']!.client.get<ProgressResponse>('/api/progress')
    expect(lea.body.progress.celebration?.badges).toContain('podium')
  })

  it('compte les bots dans le podium : un élève quatrième derrière un bot ne l’obtient pas', async () => {
    const scene = await setup(['Léa', 'Tom', 'Inès'])
    const bot = await createBot(scene.admin)
    await scene.admin.post(`/api/admin/bots/${bot.id}/adjust`, { missions: 5, xp: 500 })
    await validate(scene, 'Léa')
    await validate(scene, 'Léa')
    await validate(scene, 'Tom')
    await validate(scene, 'Tom', 50)
    await validate(scene, 'Inès', 50)

    await scene.admin.patch(`/api/admin/bots/${bot.id}`, { paused: true })
    scene.advance(6 * DAY)
    await board(scene.admin)

    const earned = async (pseudo: string) =>
      (
        await scene.students[pseudo]!.client.get<ProgressResponse>('/api/progress')
      ).body.progress.badges.find((one) => one.code === 'podium')?.earnedAt
    expect(await earned('Léa')).toBeTruthy()
    expect(await earned('Tom')).toBeTruthy()
    expect(await earned('Inès')).toBeNull()
  })
})

describe('bots', () => {
  it('se créent avec un pseudo libre, un avatar de la galerie et des réglages valides', async () => {
    const scene = await setup(['Léa'])
    const send = (body: Record<string, unknown>) =>
      scene.admin.post<ApiErrorBody>('/api/admin/bots', {
        pseudo: 'Astro',
        avatar: 'astronaut',
        mode: 'regular',
        ...body,
      })

    const taken = await send({ pseudo: 'léa' })
    const avatar = await send({ avatar: 'photo' })
    const tooMany = await send({ missionsPerWeek: 21 })
    const emptyMix = await send({ difficultyMix: { easy: 0, medium: 0, hard: 0, epic: 0 } })
    const created = await scene.admin.post<AdminBotResponse>('/api/admin/bots', {
      pseudo: 'Astro',
      avatar: 'astronaut',
      mode: 'adaptive',
      target: 'ahead_of_first',
    })

    expect(taken.status).toBe(409)
    expect(avatar.status).toBe(400)
    expect(tooMany.body.error.fields).toEqual({
      missionsPerWeek: 'De 1 à 20 missions par semaine.',
    })
    expect(emptyMix.status).toBe(400)
    expect(created.body.bot).toMatchObject({
      pseudo: 'Astro',
      mode: 'adaptive',
      target: 'ahead_of_first',
      missionsPerWeek: 5,
      difficultyMix: { easy: 40, medium: 40, hard: 15, epic: 5 },
      capped: true,
      paused: false,
      missions: 0,
      xp: 0,
      level: 1,
    })
  })

  it('apparaissent dans le classement, sans pouvoir se connecter ni recevoir de quête', async () => {
    const scene = await setup(['Léa'])
    await createBot(scene.admin)

    const quest = await scene.admin.post<AdminQuestResponse>('/api/admin/quests', {
      title: 'Pour tous',
      category: 'sport',
      format: 'declarative',
      difficulty: 'easy',
      rewardXp: 50,
      instructions: 'Cours.',
      assignees: 'all',
      publish: true,
    })
    const login = await scene.client().post<ApiErrorBody>('/api/auth/login', {
      login: 'Astro',
      password: 'peu-importe',
    })

    expect((await board(scene.admin)).map((entry) => entry.pseudo).sort()).toEqual(['Astro', 'Léa'])
    expect(quest.body.quest.assignments.map((a) => a.student.pseudo)).toEqual(['Léa'])
    expect(login.status).toBe(401)
  })

  it('régulier : accomplit ses missions de la semaine, entre 8 h et 21 h, sans tâche planifiée', async () => {
    const scene = await setup(['Léa'])
    // Lundi 23 novembre, 7 h à Paris : le bot commence une semaine entière.
    scene.advance(5 * DAY + 19 * HOUR)
    const bot = await createBot(scene.admin, { missionsPerWeek: 6 })

    // Personne n'a demandé de classement : rien n'est écrit au journal.
    scene.advance(8 * DAY)
    const before = await scene
      .database()
      .read((tx) => tx.all('SELECT id FROM xp_entries WHERE user_id = ?', [bot.id]))
    expect(before).toEqual([])

    // Une semaine et un jour plus tard, quelqu'un ouvre le classement.
    await scene.admin.post('/api/auth/login', { login: 'Coach', password: 'motdepasse-admin' })
    await board(scene.admin)
    const entries = await scene
      .database()
      .read((tx) =>
        tx.all<{ amount: number; mission_delta: number; created_at: string; reason: string }>(
          'SELECT amount, mission_delta, created_at, reason FROM xp_entries WHERE user_id = ? ORDER BY created_at',
          [bot.id],
        ),
      )
    const firstWeek = entries.filter((entry) => entry.created_at < '2026-11-29T23:00:00.000Z')

    // Les six missions de la première semaine, chacune à son heure.
    expect(firstWeek).toHaveLength(6)
    for (const entry of entries) {
      const hour = Number(instantToParisLocal(new Date(entry.created_at)).slice(11, 13))
      expect(hour).toBeGreaterThanOrEqual(8)
      expect(hour).toBeLessThan(21)
      expect(entry.mission_delta).toBe(1)
      expect(entry.reason).toBe('bot')
      expect([50, 100, 200, 400]).toContain(entry.amount)
    }
    // Redemander le classement ne recrédite rien.
    await board(scene.admin)
    const after = await scene
      .database()
      .read((tx) => tx.all('SELECT id FROM xp_entries WHERE user_id = ?', [bot.id]))
    expect(after).toHaveLength(entries.length)
  })

  it('régulier : rattrape les semaines où personne n’a ouvert le classement', async () => {
    const scene = await setup(['Léa'])
    scene.advance(5 * DAY + 19 * HOUR)
    const bot = await createBot(scene.admin, { missionsPerWeek: 4 })

    // Trois semaines entières passent, puis le dimanche soir à 22 h.
    scene.advance(20 * DAY + 15 * HOUR)
    await scene.admin.post('/api/auth/login', { login: 'Coach', password: 'motdepasse-admin' })
    await board(scene.admin)

    const list = await scene.admin.get<AdminBotsResponse>('/api/admin/bots')
    expect(list.body.bots.find((one) => one.id === bot.id)).toMatchObject({
      missions: 12,
      missionsThisWeek: 4,
    })
  })

  it('en pause : ne progresse plus ; à la reprise, ne rattrape pas la pause', async () => {
    const scene = await setup(['Léa'])
    scene.advance(5 * DAY + 19 * HOUR)
    const bot = await createBot(scene.admin, { missionsPerWeek: 20 })
    await scene.admin.patch(`/api/admin/bots/${bot.id}`, { paused: true })

    scene.advance(7 * DAY)
    await scene.admin.post('/api/auth/login', { login: 'Coach', password: 'motdepasse-admin' })
    await board(scene.admin)
    const paused = await scene.admin.get<AdminBotsResponse>('/api/admin/bots')
    expect(paused.body.bots[0]).toMatchObject({ paused: true, missions: 0 })

    // Reprise le lundi suivant à 7 h : seules les missions à venir compteront.
    const resumed = await scene.admin.patch<AdminBotResponse>(`/api/admin/bots/${bot.id}`, {
      paused: false,
    })
    await board(scene.admin)
    expect(resumed.body.bot.paused).toBe(false)
    expect(
      (await scene.admin.get<AdminBotsResponse>('/api/admin/bots')).body.bots[0]?.missions,
    ).toBe(0)

    scene.advance(7 * DAY)
    await scene.admin.post('/api/auth/login', { login: 'Coach', password: 'motdepasse-admin' })
    await board(scene.admin)
    expect(
      (await scene.admin.get<AdminBotsResponse>('/api/admin/bots')).body.bots[0]?.missions,
    ).toBe(20)
  })

  it('plafonné : ne dépasse jamais le premier élève réel, en missions comme en XP', async () => {
    const scene = await setup(['Léa', 'Tom'])
    scene.advance(5 * DAY + 19 * HOUR)
    await createBot(scene.admin, { missionsPerWeek: 20, capped: true })
    // Léa valide trois quêtes dans la semaine, Tom une.
    for (let count = 0; count < 3; count += 1) {
      scene.advance(DAY)
      await validate(scene, 'Léa', 400)
    }
    await validate(scene, 'Tom', 100)

    scene.advance(3 * DAY)
    const entries = await board(scene.students['Léa']!.client)
    const byXp = await board(scene.students['Léa']!.client, '?sort=xp')

    expect(entries[0]?.pseudo).toBe('Léa')
    expect(byXp[0]?.pseudo).toBe('Léa')
    const bot = entries.find((entry) => entry.pseudo === 'Astro')!
    // Le bot a avancé, mais reste au moins une mission derrière Léa.
    expect(bot.missions).toBeGreaterThan(0)
    expect(bot.missions).toBeLessThan(3)
    expect(bot.xp).toBeLessThan(1200)
    for (const period of ['month', 'all']) {
      expect((await board(scene.admin, `?period=${period}`))[0]?.pseudo).toBe('Léa')
    }
  })

  it('adaptatif : avance d’une mission par heure au plus, vers la position visée', async () => {
    const scene = await setup(['Léa', 'Tom'])
    for (let count = 0; count < 4; count += 1) await validate(scene, 'Léa')
    await validate(scene, 'Tom')
    const bot = await createBot(scene.admin, {
      mode: 'adaptive',
      target: 'ahead_of_first',
      capped: false,
    })
    const missions = async () =>
      (await scene.admin.get<AdminBotsResponse>('/api/admin/bots')).body.bots.find(
        (one) => one.id === bot.id,
      )!.missionsThisWeek

    // À sa création, rien ; moins d'une heure après, toujours rien.
    await board(scene.admin)
    expect(await missions()).toBe(0)
    scene.advance(30 * MINUTE)
    await board(scene.admin)
    expect(await missions()).toBe(0)

    // Une heure plus tard : une mission, pas davantage, même si le classement est redemandé.
    scene.advance(31 * MINUTE)
    await board(scene.admin)
    await board(scene.admin)
    expect(await missions()).toBe(1)

    // Heure après heure, il rejoint puis dépasse Léa d'une mission, et s'arrête là.
    for (let hour = 0; hour < 8; hour += 1) {
      scene.advance(HOUR)
      await board(scene.admin)
    }
    expect(await missions()).toBe(5)
    expect((await board(scene.admin))[0]?.pseudo).toBe('Astro')
  })

  it('adaptatif : vise le milieu ou la dernière place, et ne bouge pas la nuit', async () => {
    const scene = await setup(['Léa', 'Tom', 'Inès'])
    for (let count = 0; count < 6; count += 1) await validate(scene, 'Léa')
    for (let count = 0; count < 4; count += 1) await validate(scene, 'Tom')
    for (let count = 0; count < 2; count += 1) await validate(scene, 'Inès')
    const middle = await createBot(scene.admin, {
      pseudo: 'Milieu',
      mode: 'adaptive',
      target: 'middle',
      capped: false,
    })
    const last = await createBot(scene.admin, {
      pseudo: 'Dernier',
      mode: 'adaptive',
      target: 'behind_last',
      capped: false,
    })
    const missions = async (id: string) =>
      (await scene.admin.get<AdminBotsResponse>('/api/admin/bots')).body.bots.find(
        (one) => one.id === id,
      )!.missionsThisWeek

    // De 11 h à 20 h, heure de Paris : neuf réévaluations.
    for (let hour = 0; hour < 9; hour += 1) {
      scene.advance(HOUR)
      await board(scene.admin)
    }
    // Médiane de 6, 4 et 2 : 4 missions. Une de moins que la dernière : 1 mission.
    expect(await missions(middle.id)).toBe(4)
    expect(await missions(last.id)).toBe(1)

    // Léa valide encore deux quêtes, mais il est 22 h : le bot attend le lendemain 8 h.
    scene.advance(2 * HOUR)
    for (let count = 0; count < 4; count += 1) await validate(scene, 'Tom')
    await board(scene.admin)
    expect(await missions(middle.id)).toBe(4)
    scene.advance(11 * HOUR)
    await board(scene.admin)
    expect(await missions(middle.id)).toBe(5)
  })

  it('s’ajustent à la main : missions et XP, en plus ou en moins', async () => {
    const scene = await setup(['Léa'])
    const bot = await createBot(scene.admin)

    const added = await scene.admin.post<AdminBotResponse>(`/api/admin/bots/${bot.id}/adjust`, {
      missions: 3,
      xp: 250,
    })
    const removed = await scene.admin.post<AdminBotResponse>(`/api/admin/bots/${bot.id}/adjust`, {
      missions: -1,
      xp: -50,
    })
    const nothing = await scene.admin.post<ApiErrorBody>(`/api/admin/bots/${bot.id}/adjust`, {})

    expect(added.body.bot).toMatchObject({ missions: 3, xp: 250, missionsThisWeek: 3 })
    expect(removed.body.bot).toMatchObject({ missions: 2, xp: 200 })
    expect(nothing.status).toBe(400)
    expect(lines(await board(scene.admin))).toEqual(['1 Astro 2 200', '- Léa 0 0'])
  })

  it('se règlent après coup : pseudo, avatar, rythme, répartition, plafond', async () => {
    const scene = await setup(['Léa'])
    const bot = await createBot(scene.admin)

    const updated = await scene.admin.patch<AdminBotResponse>(`/api/admin/bots/${bot.id}`, {
      pseudo: 'Comète',
      avatar: 'fox',
      mode: 'adaptive',
      target: 'behind_last',
      missionsPerWeek: 12,
      difficultyMix: { easy: 0, medium: 0, hard: 0, epic: 100 },
      capped: true,
    })
    const taken = await scene.admin.patch<ApiErrorBody>(`/api/admin/bots/${bot.id}`, {
      pseudo: 'Léa',
    })

    expect(updated.body.bot).toMatchObject({
      pseudo: 'Comète',
      avatar: 'fox',
      mode: 'adaptive',
      target: 'behind_last',
      missionsPerWeek: 12,
      difficultyMix: { easy: 0, medium: 0, hard: 0, epic: 100 },
      capped: true,
    })
    expect(taken.status).toBe(409)
    expect((await scene.admin.patch('/api/admin/bots/inconnu', { paused: true })).status).toBe(404)
  })

  it('supprimés, disparaissent du classement, passé compris', async () => {
    const scene = await setup(['Léa'])
    const bot = await createBot(scene.admin)
    await scene.admin.post(`/api/admin/bots/${bot.id}/adjust`, { missions: 4, xp: 400 })
    expect(lines(await board(scene.admin, '?period=all'))[0]).toBe('1 Astro 4 400')

    const removed = await scene.admin.delete(`/api/admin/bots/${bot.id}`)

    expect(removed.status).toBe(204)
    expect(lines(await board(scene.admin, '?period=all'))).toEqual(['- Léa 0 0'])
    const left = await scene
      .database()
      .read((tx) => tx.all('SELECT id FROM xp_entries WHERE user_id = ?', [bot.id]))
    expect(left).toEqual([])
    // Un élève ne se supprime pas par la route des bots.
    expect((await scene.admin.delete(`/api/admin/bots/${scene.students['Léa']!.id}`)).status).toBe(
      404,
    )
  })
})
