import { describe, expect, it } from 'vitest'
import type { AdminOverviewResponse } from '../../shared/schemas/admin.js'
import type { AdminQuestResponse, StudentQuestResponse } from '../../shared/schemas/quests.js'
import { createTestApp, DAY, HOUR, type TestApp, type TestClient } from '../helpers/test-app.js'

/** L'horloge des tests démarre le mardi 17 novembre 2026 à 10 h UTC. */
const at = (scene: TestApp, milliseconds: number) =>
  new Date(scene.clock.now.getTime() + milliseconds).toISOString()

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

const overview = async (admin: TestClient) =>
  (await admin.get<AdminOverviewResponse>('/api/admin/overview')).body.overview

/** Une quête de sport : « C'est fait » la valide aussitôt, sauf validation par l'admin. */
async function createQuest(admin: TestClient, overrides: Record<string, unknown> = {}) {
  const response = await admin.post<AdminQuestResponse>('/api/admin/quests', {
    title: 'Courir 20 minutes',
    instructions: 'Cours sans t’arrêter.',
    category: 'sport',
    format: 'declarative',
    difficulty: 'medium',
    rewardXp: 100,
    manualValidation: false,
    deadlineAt: null,
    assignees: 'all',
    publish: true,
    ...overrides,
  })
  if (response.status !== 201) throw new Error(JSON.stringify(response.body))
  return response.body.quest
}

const done = (student: TestClient, questId: string) =>
  student.post<StudentQuestResponse>(`/api/quests/${questId}/attempts`, {})

describe('vue d’ensemble de l’admin', () => {
  it('est réservée à l’admin', async () => {
    const scene = await setup(['Léa'])

    expect((await scene.client().get('/api/admin/overview')).status).toBe(401)
    expect((await scene.students['Léa']!.client.get('/api/admin/overview')).status).toBe(403)
  })

  it('part de zéro dans un espace tout neuf', async () => {
    const scene = await setup([])

    expect(await overview(scene.admin)).toEqual({
      totalStudents: 0,
      activeStudents: 0,
      questsInProgress: 0,
      pendingValidations: 0,
      expiringSoon: [],
      inactiveStudents: [],
    })
  })

  it('compte les élèves actifs, sans les comptes désactivés', async () => {
    const scene = await setup()
    await scene.admin.patch(`/api/admin/students/${scene.students['Tom']!.id}`, {
      isActive: false,
    })

    const result = await overview(scene.admin)

    expect(result.totalStudents).toBe(3)
    expect(result.activeStudents).toBe(2)
  })

  it('compte les quêtes en cours : publiées, avec un élève qui a encore à faire', async () => {
    const scene = await setup(['Léa', 'Tom'])
    const { admin, students } = scene
    const lea = students['Léa']!.client
    const tom = students['Tom']!.client

    await createQuest(admin, { title: 'Brouillon', publish: false })
    const archived = await createQuest(admin, { title: 'Archivée' })
    await admin.post(`/api/admin/quests/${archived.id}/archive`)
    const finished = await createQuest(admin, { title: 'Finie par tous' })
    await done(lea, finished.id)
    await done(tom, finished.id)
    const half = await createQuest(admin, { title: 'Finie par Léa seulement' })
    await done(lea, half.id)
    const waiting = await createQuest(admin, { title: 'À valider', manualValidation: true })
    await done(lea, waiting.id)
    await done(tom, waiting.id)
    await createQuest(admin, { title: 'Bientôt expirée', deadlineAt: at(scene, HOUR) })

    const before = await overview(admin)
    // Une heure plus tard, la dernière quête est expirée pour tout le monde.
    scene.advance(2 * HOUR)
    const after = await overview(admin)

    // « Finie par Léa seulement », « À valider » et « Bientôt expirée ».
    expect(before.questsInProgress).toBe(3)
    expect(after.questsInProgress).toBe(2)
    // Deux réalisations attendent l'admin.
    expect(before.pendingValidations).toBe(2)
  })

  it('ne compte pas une quête que seul un élève désactivé doit encore finir', async () => {
    const scene = await setup(['Léa', 'Tom'])
    const quest = await createQuest(scene.admin)
    await done(scene.students['Léa']!.client, quest.id)

    await scene.admin.patch(`/api/admin/students/${scene.students['Tom']!.id}`, {
      isActive: false,
    })

    expect((await overview(scene.admin)).questsInProgress).toBe(0)
  })

  it('liste les quêtes qui expirent dans les 48 h, avec les élèves qui ne les ont pas finies', async () => {
    const scene = await setup()
    const { admin, students } = scene
    const lea = students['Léa']!.client

    const tomorrow = await createQuest(admin, { title: 'Demain', deadlineAt: at(scene, DAY) })
    const soon = await createQuest(admin, { title: 'Dans 3 h', deadlineAt: at(scene, 3 * HOUR) })
    await createQuest(admin, { title: 'Dans 3 jours', deadlineAt: at(scene, 3 * DAY) })
    await createQuest(admin, { title: 'Sans deadline' })
    const allDone = await createQuest(admin, { title: 'Finie', deadlineAt: at(scene, DAY) })
    for (const student of Object.values(students)) await done(student.client, allDone.id)
    const submitted = await createQuest(admin, {
      title: 'Soumise',
      manualValidation: true,
      deadlineAt: at(scene, DAY),
      assignees: [students['Léa']!.id],
    })
    await done(lea, submitted.id)
    await done(lea, tomorrow.id)

    const result = await overview(admin)

    // La deadline la plus proche d'abord ; une réalisation soumise n'expire plus.
    expect(result.expiringSoon).toEqual([
      {
        id: soon.id,
        title: 'Dans 3 h',
        category: 'sport',
        deadlineAt: at(scene, 3 * HOUR),
        remaining: 3,
      },
      {
        id: tomorrow.id,
        title: 'Demain',
        category: 'sport',
        deadlineAt: at(scene, DAY),
        remaining: 2,
      },
    ])
  })

  it('liste les élèves inactifs depuis 7 jours, le plus anciennement vu d’abord', async () => {
    const scene = await setup()
    const { admin, students } = scene

    // Trois jours plus tard, Tom revient ; cinq jours après, Inès aussi.
    scene.advance(3 * DAY)
    await students['Tom']!.client.get('/api/session')
    scene.advance(5 * DAY)
    await students['Inès']!.client.get('/api/session')
    await admin.post('/api/auth/login', { login: 'Coach', password: 'motdepasse-admin' })

    const eightDays = await overview(admin)
    scene.advance(3 * DAY)
    const elevenDays = await overview(admin)

    // Au huitième jour, seule Léa n'est pas venue depuis une semaine.
    expect(eightDays.inactiveStudents.map((student) => student.pseudo)).toEqual(['Léa'])
    expect(eightDays.inactiveStudents[0]).toMatchObject({
      id: students['Léa']!.id,
      lastActiveAt: '2026-11-17T10:00:00.000Z',
    })
    // Au onzième, Tom non plus ; Inès est venue il y a trois jours.
    expect(elevenDays.inactiveStudents.map((student) => student.pseudo)).toEqual(['Léa', 'Tom'])
  })

  it('ne signale pas un compte désactivé parmi les inactifs', async () => {
    const scene = await setup(['Léa'])
    await scene.admin.patch(`/api/admin/students/${scene.students['Léa']!.id}`, {
      isActive: false,
    })

    scene.advance(10 * DAY)
    await scene.admin.post('/api/auth/login', { login: 'Coach', password: 'motdepasse-admin' })

    expect((await overview(scene.admin)).inactiveStudents).toEqual([])
  })
})
