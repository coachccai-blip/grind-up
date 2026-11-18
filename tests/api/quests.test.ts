import { describe, expect, it } from 'vitest'
import type { ApiErrorBody } from '../../shared/schemas/errors.js'
import type {
  AdminQuestDetail,
  AdminQuestResponse,
  AdminQuestsResponse,
  AssignmentResponse,
  SaveQuestRequest,
  StudentQuestDetail,
  StudentQuestResponse,
  StudentQuestsResponse,
  ValidationsResponse,
} from '../../shared/schemas/quests.js'
import {
  createTestApp,
  DAY,
  HOUR,
  MINUTE,
  type TestApp,
  type TestClient,
} from '../helpers/test-app.js'

/** L'horloge des tests démarre le 17 novembre 2026 à 10 h UTC. */
const IN_TWO_DAYS = '2026-11-19T10:00:00.000Z'
const IN_THREE_HOURS = '2026-11-17T13:00:00.000Z'

type QuestDraft = Partial<SaveQuestRequest>

const baseQuest = (overrides: QuestDraft = {}): QuestDraft => ({
  title: 'Tables de multiplication',
  instructions: 'Réponds sans calculatrice.',
  category: 'maths',
  format: 'exact',
  difficulty: 'medium',
  rewardXp: 100,
  deadlineAt: null,
  passThreshold: 80,
  maxAttempts: 3,
  items: [
    { prompt: '6 × 7 ?', answers: ['42'], choices: [], correct: [] },
    { prompt: 'La moitié de 7 ?', answers: ['3,5'], choices: [], correct: [] },
  ],
  assignees: 'all',
  publish: true,
  ...overrides,
})

const qcmQuest = (overrides: QuestDraft = {}): QuestDraft =>
  baseQuest({
    title: 'Capitales',
    format: 'qcm',
    items: [
      {
        prompt: 'Capitale de l’Italie ?',
        answers: [],
        choices: ['Milan', 'Rome', 'Naples'],
        correct: [1],
      },
      {
        prompt: 'Quelles villes sont en France ?',
        answers: [],
        choices: ['Lyon', 'Turin', 'Lille'],
        correct: [0, 2],
      },
    ],
    ...overrides,
  })

const cardsQuest = (overrides: QuestDraft = {}): QuestDraft =>
  baseQuest({
    title: 'Dates clés',
    category: 'memorization',
    format: 'flashcards',
    items: [
      { prompt: 'Prise de la Bastille', answers: ['1789'], choices: [], correct: [] },
      { prompt: 'Chute du mur de Berlin', answers: ['1989'], choices: [], correct: [] },
      { prompt: 'Premier pas sur la Lune', answers: ['1969'], choices: [], correct: [] },
    ],
    ...overrides,
  })

const sportQuest = (overrides: QuestDraft = {}): QuestDraft =>
  baseQuest({
    title: 'Courir 20 minutes',
    instructions: 'Cours **20 minutes** sans t’arrêter.',
    category: 'sport',
    format: 'declarative',
    manualValidation: false,
    items: [],
    ...overrides,
  })

const essayQuest = (overrides: QuestDraft = {}): QuestDraft =>
  baseQuest({
    title: 'Résume le chapitre 3',
    instructions: 'Écris un résumé en cinq lignes.',
    category: 'other',
    format: 'free_text',
    items: [],
    ...overrides,
  })

interface Scene extends TestApp {
  admin: TestClient
  lea: TestClient
  tom: TestClient
  leaId: string
  tomId: string
}

async function setup(): Promise<Scene> {
  const testApp = createTestApp()
  const admin = testApp.client()
  await admin.signUpAdmin('Coach')
  const lea = testApp.client()
  const tom = testApp.client()
  const leaId = (await lea.signUpStudent('Léa')).id
  const tomId = (await tom.signUpStudent('Tom')).id
  return { ...testApp, admin, lea, tom, leaId, tomId }
}

async function createQuest(admin: TestClient, quest: QuestDraft): Promise<AdminQuestDetail> {
  const response = await admin.post<AdminQuestResponse>('/api/admin/quests', quest)
  if (response.status !== 201) {
    throw new Error(`Création refusée : ${JSON.stringify(response.body)}`)
  }
  return response.body.quest
}

async function readMine(student: TestClient, questId: string): Promise<StudentQuestDetail> {
  const response = await student.get<StudentQuestResponse>(`/api/quests/${questId}`)
  if (response.status !== 200) throw new Error(`Lecture refusée : ${JSON.stringify(response.body)}`)
  return response.body.quest
}

const attempt = (student: TestClient, questId: string, body: unknown) =>
  student.post<StudentQuestResponse & ApiErrorBody>(`/api/quests/${questId}/attempts`, body)

/** Réponses justes à la quête de maths de baseQuest. */
async function rightAnswers(student: TestClient, questId: string, second = '3.5') {
  const quest = await readMine(student, questId)
  return { answers: { [quest.items[0]!.id]: '42', [quest.items[1]!.id]: second } }
}

interface XpLine {
  amount: number
  reason: string
  detail: string | null
  mission_delta: number
}

const xpLines = (scene: TestApp, studentId: string) =>
  scene.database().read((tx) =>
    tx.all<XpLine & Record<string, never>>(
      `SELECT amount, reason, detail, mission_delta FROM xp_entries
       WHERE user_id = ? ORDER BY created_at, reason DESC, rowid`,
      [studentId],
    ),
  )

describe('création, brouillon et publication', () => {
  it('enregistre un brouillon incomplet, invisible pour les élèves', async () => {
    const { admin, lea } = await setup()

    const quest = await createQuest(admin, {
      title: 'Idée à creuser',
      category: 'maths',
      format: 'exact',
      difficulty: 'easy',
      rewardXp: 50,
      publish: false,
    })

    expect(quest.state).toBe('draft')
    expect(quest.items).toEqual([])
    expect(quest.assignments).toEqual([])
    const mine = await lea.get<StudentQuestsResponse>('/api/quests')
    expect(mine.body.quests).toEqual([])
    expect((await lea.get(`/api/quests/${quest.id}`)).status).toBe(404)
  })

  it('exige un titre, même pour un brouillon', async () => {
    const { admin } = await setup()

    const response = await admin.post<ApiErrorBody>(
      '/api/admin/quests',
      baseQuest({ title: '   ', publish: false }),
    )

    expect(response.status).toBe(400)
    expect(response.body.error.fields).toEqual({ title: 'Donnez un titre à la quête.' })
  })

  it('refuse de publier une quête incomplète, en disant quoi corriger', async () => {
    const { admin } = await setup()

    const noQuestion = await admin.post<ApiErrorBody>('/api/admin/quests', baseQuest({ items: [] }))
    const holes = await admin.post<ApiErrorBody>(
      '/api/admin/quests',
      baseQuest({
        items: [
          { prompt: '', answers: ['42'], choices: [], correct: [] },
          { prompt: '2 + 2 ?', answers: ['  '], choices: [], correct: [] },
        ],
      }),
    )
    const pastDeadline = await admin.post<ApiErrorBody>(
      '/api/admin/quests',
      baseQuest({ deadlineAt: '2026-11-17T09:59:00.000Z' }),
    )
    const noInstructions = await admin.post<ApiErrorBody>(
      '/api/admin/quests',
      essayQuest({ instructions: '  ' }),
    )

    expect(noQuestion.status).toBe(400)
    expect(noQuestion.body.error.code).toBe('quest_incomplete')
    expect(noQuestion.body.error.fields).toEqual({ items: 'Ajoutez au moins une question.' })
    expect(holes.body.error.fields).toEqual({
      'items.0.prompt': 'Énoncé requis.',
      'items.1.answers': 'Indiquez au moins une réponse attendue.',
    })
    expect(pastDeadline.body.error.fields).toEqual({
      deadlineAt: 'La deadline doit être dans le futur.',
    })
    expect(Object.keys(noInstructions.body.error.fields ?? {})).toEqual(['instructions'])
  })

  it('contrôle chaque question d’un QCM et chaque carte', async () => {
    const { admin } = await setup()

    const qcm = await admin.post<ApiErrorBody>(
      '/api/admin/quests',
      qcmQuest({
        items: [
          { prompt: 'Un seul choix', answers: [], choices: ['Oui', ''], correct: [0] },
          { prompt: 'Aucune bonne réponse', answers: [], choices: ['A', 'B'], correct: [] },
          { prompt: 'Doublon', answers: [], choices: ['Paris', ' paris '], correct: [0] },
        ],
      }),
    )
    const cards = await admin.post<ApiErrorBody>(
      '/api/admin/quests',
      cardsQuest({
        items: [{ prompt: 'Seule carte', answers: ['1789'], choices: [], correct: [] }],
      }),
    )
    const sameBacks = await admin.post<ApiErrorBody>(
      '/api/admin/quests',
      cardsQuest({
        items: [
          { prompt: 'Carte A', answers: ['Paris'], choices: [], correct: [] },
          { prompt: 'Carte B', answers: ['paris'], choices: [], correct: [] },
        ],
      }),
    )

    expect(qcm.body.error.fields).toEqual({
      'items.0.choices': 'Proposez au moins 2 choix.',
      'items.1.choices': 'Cochez au moins une bonne réponse.',
      'items.2.choices': 'Deux choix sont identiques.',
    })
    expect(cards.body.error.fields).toEqual({ items: 'Ajoutez au moins 2 cartes.' })
    expect(sameBacks.body.error.fields).toEqual({
      items: 'Les cartes doivent avoir au moins deux réponses différentes.',
    })
  })

  it('donne la quête à tous les élèves actifs à la publication, pas aux admins', async () => {
    const { admin, lea, tom, tomId } = await setup()
    await admin.patch(`/api/admin/students/${tomId}`, { isActive: false })

    const quest = await createQuest(admin, baseQuest({ assignees: 'all' }))

    expect(quest.state).toBe('published')
    expect(quest.assignments.map((assignment) => assignment.student.pseudo)).toEqual(['Léa'])
    expect((await lea.get<StudentQuestsResponse>('/api/quests')).body.quests).toHaveLength(1)
    // Réactivé plus tard, Tom ne la reçoit pas automatiquement.
    await admin.patch(`/api/admin/students/${tomId}`, { isActive: true })
    await tom.post('/api/auth/login', { login: 'Tom', password: 'motdepasse-solide' })
    expect((await tom.get<StudentQuestsResponse>('/api/quests')).body.quests).toEqual([])
  })

  it('donne la quête aux seuls élèves choisis, puis à ceux qu’on ajoute', async () => {
    const { admin, lea, tom, leaId, tomId } = await setup()

    const quest = await createQuest(admin, baseQuest({ assignees: [leaId, 'inconnu'] }))

    expect(quest.assignments.map((assignment) => assignment.student.id)).toEqual([leaId])
    expect((await tom.get<StudentQuestsResponse>('/api/quests')).body.quests).toEqual([])

    const added = await admin.post<AdminQuestResponse>(`/api/admin/quests/${quest.id}/assignees`, {
      assignees: [tomId, leaId],
    })

    expect(added.body.quest.assignments.map((assignment) => assignment.student.pseudo)).toEqual([
      'Léa',
      'Tom',
    ])
    expect((await tom.get<StudentQuestsResponse>('/api/quests')).body.quests).toHaveLength(1)
    expect((await lea.get<StudentQuestsResponse>('/api/quests')).body.quests).toHaveLength(1)
  })

  it('ne donne pas une quête « tous les élèves » à un élève inscrit ensuite', async () => {
    const scene = await setup()
    const quest = await createQuest(scene.admin, baseQuest({ assignees: 'all' }))

    const late = scene.client()
    await late.signUpStudent('Inès')

    expect((await late.get<StudentQuestsResponse>('/api/quests')).body.quests).toEqual([])
    const added = await scene.admin.post<AdminQuestResponse>(
      `/api/admin/quests/${quest.id}/assignees`,
      { assignees: 'all' },
    )
    expect(added.body.quest.assignments).toHaveLength(3)
  })

  it('garde les élèves choisis d’un brouillon et les assigne à la publication', async () => {
    const { admin, lea, leaId } = await setup()
    const draft = await createQuest(admin, baseQuest({ assignees: [leaId], publish: false }))

    expect(draft.draftAssignees).toEqual([leaId])
    expect(draft.assignments).toEqual([])
    expect((await lea.get<StudentQuestsResponse>('/api/quests')).body.quests).toEqual([])

    const published = await admin.post<AdminQuestResponse>(`/api/admin/quests/${draft.id}/publish`)

    expect(published.status).toBe(200)
    expect(published.body.quest.state).toBe('published')
    expect(published.body.quest.draftAssignees).toEqual([])
    expect(published.body.quest.assignments.map((a) => a.student.id)).toEqual([leaId])
    expect((await lea.get<StudentQuestsResponse>('/api/quests')).body.quests).toHaveLength(1)
  })

  it('liste les quêtes avec leur avancement', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(admin, baseQuest())
    await createQuest(admin, baseQuest({ title: 'Brouillon', publish: false }))
    await attempt(lea, quest.id, await rightAnswers(lea, quest.id))

    const list = await admin.get<AdminQuestsResponse>('/api/admin/quests')

    expect(list.body.quests.map((entry) => [entry.title, entry.state, entry.progress])).toEqual(
      expect.arrayContaining([
        ['Tables de multiplication', 'published', { assigned: 2, validated: 1, submitted: 0 }],
        ['Brouillon', 'draft', { assigned: 0, validated: 0, submitted: 0 }],
      ]),
    )
  })

  it('duplique une quête en brouillon, sans ses élèves', async () => {
    const { admin } = await setup()
    const quest = await createQuest(admin, qcmQuest())

    const copy = await admin.post<AdminQuestResponse>(`/api/admin/quests/${quest.id}/duplicate`)

    expect(copy.status).toBe(201)
    expect(copy.body.quest).toMatchObject({
      title: 'Capitales (copie)',
      state: 'draft',
      format: 'qcm',
      assignments: [],
      draftAssignees: [],
    })
    expect(copy.body.quest.id).not.toBe(quest.id)
    expect(
      copy.body.quest.items.map(({ prompt, choices, correct }) => [prompt, choices, correct]),
    ).toEqual(quest.items.map(({ prompt, choices, correct }) => [prompt, choices, correct]))
  })

  it('ne supprime que les brouillons', async () => {
    const { admin } = await setup()
    const draft = await createQuest(admin, baseQuest({ publish: false }))
    const published = await createQuest(admin, baseQuest())

    expect((await admin.delete(`/api/admin/quests/${draft.id}`)).status).toBe(204)
    expect((await admin.get(`/api/admin/quests/${draft.id}`)).status).toBe(404)
    const refused = await admin.delete<ApiErrorBody>(`/api/admin/quests/${published.id}`)
    expect(refused.status).toBe(409)
    expect(refused.body.error.code).toBe('not_a_draft')
  })

  it('archive une quête : elle quitte les listes actives, l’XP gagnée reste', async () => {
    const scene = await setup()
    const { admin, lea, tom, leaId } = scene
    const quest = await createQuest(admin, baseQuest())
    await attempt(lea, quest.id, await rightAnswers(lea, quest.id))

    const archived = await admin.post<AdminQuestResponse>(`/api/admin/quests/${quest.id}/archive`)

    expect(archived.body.quest.state).toBe('archived')
    // Léa l'a validée : elle la garde dans ses quêtes terminées. Tom ne la voit plus.
    expect((await lea.get<StudentQuestsResponse>('/api/quests')).body.quests).toHaveLength(1)
    expect((await tom.get<StudentQuestsResponse>('/api/quests')).body.quests).toEqual([])
    expect((await tom.get(`/api/quests/${quest.id}`)).status).toBe(404)
    expect((await xpLines(scene, leaId)).reduce((sum, line) => sum + line.amount, 0)).toBe(110)

    await admin.post(`/api/admin/quests/${quest.id}/restore`)
    expect((await tom.get<StudentQuestsResponse>('/api/quests')).body.quests).toHaveLength(1)
  })
})

describe('modification d’une quête', () => {
  it('laisse tout modifier tant qu’aucun élève n’a répondu', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(admin, baseQuest())

    const updated = await admin.put<AdminQuestResponse>(
      `/api/admin/quests/${quest.id}`,
      baseQuest({
        title: 'Calcul mental',
        rewardXp: 150,
        items: [{ prompt: '9 × 9 ?', answers: ['81'], choices: [], correct: [] }],
      }),
    )

    expect(updated.status).toBe(200)
    expect(updated.body.quest).toMatchObject({
      title: 'Calcul mental',
      rewardXp: 150,
      locked: false,
    })
    const mine = await readMine(lea, quest.id)
    expect(mine.items.map((item) => item.prompt)).toEqual(['9 × 9 ?'])
  })

  it('fige les questions et la récompense dès qu’un élève a répondu', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(admin, baseQuest())
    await attempt(lea, quest.id, { answers: {} })

    const frozen = await admin.put<ApiErrorBody>(
      `/api/admin/quests/${quest.id}`,
      baseQuest({ rewardXp: 500 }),
    )
    const open = await admin.put<AdminQuestResponse>(
      `/api/admin/quests/${quest.id}`,
      baseQuest({
        title: 'Nouveau titre',
        instructions: 'Nouvelle consigne.',
        deadlineAt: IN_TWO_DAYS,
      }),
    )

    expect(frozen.status).toBe(409)
    expect(frozen.body.error.code).toBe('quest_locked')
    expect(open.status).toBe(200)
    expect(open.body.quest).toMatchObject({
      title: 'Nouveau titre',
      instructions: 'Nouvelle consigne.',
      deadlineAt: IN_TWO_DAYS,
      rewardXp: 100,
      locked: true,
    })
  })

  it('refuse une nouvelle deadline déjà passée, mais laisse modifier une quête échue', async () => {
    const scene = await setup()
    const { admin } = scene
    const quest = await createQuest(admin, baseQuest({ deadlineAt: IN_THREE_HOURS }))
    scene.advance(4 * HOUR)

    const past = await admin.put<ApiErrorBody>(
      `/api/admin/quests/${quest.id}`,
      baseQuest({ deadlineAt: '2026-11-17T13:30:00.000Z' }),
    )
    const sameDeadline = await admin.put<AdminQuestResponse>(
      `/api/admin/quests/${quest.id}`,
      baseQuest({ title: 'Titre corrigé', deadlineAt: IN_THREE_HOURS }),
    )

    expect(past.status).toBe(400)
    expect(past.body.error.fields).toEqual({ deadlineAt: 'La deadline doit être dans le futur.' })
    expect(sameDeadline.status).toBe(200)
    expect(sameDeadline.body.quest.title).toBe('Titre corrigé')
  })

  it('fait revivre les quêtes expirées quand la deadline est repoussée', async () => {
    const scene = await setup()
    const { admin, lea } = scene
    const quest = await createQuest(admin, baseQuest({ deadlineAt: IN_THREE_HOURS }))
    scene.advance(4 * HOUR)
    expect((await readMine(lea, quest.id)).status).toBe('expired')

    await admin.put(`/api/admin/quests/${quest.id}`, baseQuest({ deadlineAt: IN_TWO_DAYS }))

    expect((await readMine(lea, quest.id)).status).toBe('todo')
  })

  it('ne retire jamais d’élèves à une quête publiée', async () => {
    const { admin, leaId, tomId } = await setup()
    const quest = await createQuest(admin, baseQuest({ assignees: [leaId] }))

    const updated = await admin.put<AdminQuestResponse>(
      `/api/admin/quests/${quest.id}`,
      baseQuest({ assignees: [tomId] }),
    )

    expect(updated.body.quest.assignments.map((a) => a.student.pseudo)).toEqual(['Léa', 'Tom'])
  })

  it('refuse de modifier une quête archivée', async () => {
    const { admin } = await setup()
    const quest = await createQuest(admin, baseQuest())
    await admin.post(`/api/admin/quests/${quest.id}/archive`)

    const response = await admin.put<ApiErrorBody>(`/api/admin/quests/${quest.id}`, baseQuest())

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('quest_archived')
  })
})

describe('réponses attendues', () => {
  it('ne quittent jamais le serveur avant la validation', async () => {
    const { admin, lea } = await setup()
    // Des réponses reconnaissables entre toutes, pour repérer la moindre fuite.
    const exact = await createQuest(
      admin,
      baseQuest({
        items: [
          { prompt: 'Premier mot de passe ?', answers: ['sésame-alpha'], choices: [], correct: [] },
          {
            prompt: 'Second mot de passe ?',
            answers: ['sésame-bêta', 'sésame-gamma'],
            choices: [],
            correct: [],
          },
        ],
      }),
    )
    const qcm = await createQuest(admin, qcmQuest())

    const list = await lea.get('/api/quests')
    const exactDetail = await lea.get<StudentQuestResponse>(`/api/quests/${exact.id}`)
    const qcmDetail = await lea.get<StudentQuestResponse>(`/api/quests/${qcm.id}`)
    const started = await lea.post(`/api/quests/${exact.id}/start`)
    const failed = await attempt(lea, exact.id, {
      answers: { [exact.items[0]!.id]: 'raté', [exact.items[1]!.id]: 'raté aussi' },
    })

    const sent = JSON.stringify([list.body, exactDetail.body, started.body, failed.body])
    expect(failed.body.quest.lastAttempt?.score).toBe(0)
    expect(sent).not.toContain('sésame')
    expect(exactDetail.body.quest.corrections).toBeNull()
    expect(failed.body.quest.corrections).toBeNull()
    expect(exactDetail.body.quest.items[0]).toEqual({
      id: exact.items[0]!.id,
      prompt: 'Premier mot de passe ?',
    })
    // QCM : les choix sont envoyés, pas la position des bons.
    expect(qcmDetail.body.quest.items[0]).toEqual({
      id: qcm.items[0]!.id,
      prompt: 'Capitale de l’Italie ?',
      choices: ['Milan', 'Rome', 'Naples'],
      multiple: false,
    })
    expect(qcmDetail.body.quest.items[1]?.multiple).toBe(true)
    for (const item of qcmDetail.body.quest.items) {
      expect(Object.keys(item).sort()).toEqual(['choices', 'id', 'multiple', 'prompt'])
    }
  })

  it('restent cachées quand les tentatives sont épuisées sans réussite', async () => {
    const { admin, lea } = await setup()
    const exact = await createQuest(
      admin,
      baseQuest({
        maxAttempts: 1,
        items: [{ prompt: 'Mot de passe ?', answers: ['sésame-alpha'], choices: [], correct: [] }],
      }),
    )

    const failed = await attempt(lea, exact.id, { answers: { [exact.items[0]!.id]: 'raté' } })
    const after = await lea.get(`/api/quests/${exact.id}`)

    expect(failed.body.quest).toMatchObject({ blocked: true, corrections: null })
    expect(JSON.stringify([failed.body, after.body])).not.toContain('sésame')
  })

  it('sont montrées une fois la quête validée', async () => {
    const { admin, lea } = await setup()
    const exact = await createQuest(admin, baseQuest())
    const qcm = await createQuest(admin, qcmQuest())

    const exactDone = await attempt(lea, exact.id, await rightAnswers(lea, exact.id))
    const qcmDone = await attempt(lea, qcm.id, {
      answers: { [qcm.items[0]!.id]: [1], [qcm.items[1]!.id]: [2, 0] },
    })

    expect(exactDone.body.quest.corrections).toEqual({
      [exact.items[0]!.id]: ['42'],
      [exact.items[1]!.id]: ['3,5'],
    })
    expect(qcmDone.body.quest.corrections).toEqual({
      [qcm.items[0]!.id]: ['Rome'],
      [qcm.items[1]!.id]: ['Lyon', 'Lille'],
    })
  })
})

describe('questions à réponse exacte', () => {
  it('valide la quête et crédite l’XP dès que le seuil est atteint', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const quest = await createQuest(admin, baseQuest())

    const response = await attempt(lea, quest.id, await rightAnswers(lea, quest.id, ' 3.50 '))

    expect(response.status).toBe(200)
    expect(response.body.quest).toMatchObject({
      status: 'validated',
      xpAwarded: 110,
      attemptsUsed: 1,
      validatedAt: '2026-11-17T10:00:00.000Z',
      reward: { base: 100, late: false, bonuses: [{ kind: 'flawless', amount: 10 }], total: 110 },
    })
    expect(response.body.quest.lastAttempt).toMatchObject({ number: 1, score: 100 })
    expect(await xpLines(scene, leaId)).toEqual([
      { amount: 100, reason: 'quest', detail: null, mission_delta: 1 },
      { amount: 10, reason: 'bonus', detail: 'flawless', mission_delta: 0 },
    ])
  })

  it('dit quelles réponses sont justes, sans donner les bonnes', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(admin, baseQuest())
    const [first, second] = quest.items

    const response = await attempt(lea, quest.id, {
      answers: { [first!.id]: '42', [second!.id]: '4' },
    })

    expect(response.body.quest).toMatchObject({
      status: 'in_progress',
      blocked: false,
      attemptsUsed: 1,
      attemptsAllowed: 3,
      xpAwarded: null,
      reward: null,
      corrections: null,
    })
    expect(response.body.quest.lastAttempt).toMatchObject({
      number: 1,
      score: 50,
      results: { [first!.id]: true, [second!.id]: false },
      answers: { [first!.id]: '42', [second!.id]: '4' },
    })
  })

  it('n’accorde pas le bonus sans faute à la deuxième tentative', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const quest = await createQuest(admin, baseQuest())

    await attempt(lea, quest.id, { answers: {} })
    const response = await attempt(lea, quest.id, await rightAnswers(lea, quest.id))

    expect(response.body.quest).toMatchObject({ status: 'validated', xpAwarded: 100 })
    expect(await xpLines(scene, leaId)).toEqual([
      { amount: 100, reason: 'quest', detail: null, mission_delta: 1 },
    ])
  })

  it('valide au seuil sans exiger le sans-faute', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(admin, baseQuest({ passThreshold: 50 }))

    const response = await attempt(lea, quest.id, {
      answers: { [quest.items[0]!.id]: '42', [quest.items[1]!.id]: 'faux' },
    })

    // 50 % : la quête est validée, mais sans le bonus sans faute.
    expect(response.body.quest).toMatchObject({ status: 'validated', xpAwarded: 100 })
  })

  it('bloque l’élève quand ses tentatives sont épuisées, jusqu’à ce que l’admin en redonne', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(admin, baseQuest({ maxAttempts: 2 }))

    await attempt(lea, quest.id, { answers: {} })
    const second = await attempt(lea, quest.id, { answers: {} })
    const third = await attempt(lea, quest.id, await rightAnswers(lea, quest.id))

    expect(second.body.quest).toMatchObject({ status: 'in_progress', blocked: true })
    expect(third.status).toBe(409)
    expect(third.body.error.code).toBe('no_attempts_left')

    const detail = await admin.get<AdminQuestResponse>(`/api/admin/quests/${quest.id}`)
    const assignment = detail.body.quest.assignments.find((a) => a.student.pseudo === 'Léa')!
    expect(assignment).toMatchObject({ blocked: true, attemptsUsed: 2, attemptsAllowed: 2 })

    const granted = await admin.post<AssignmentResponse>(
      `/api/admin/assignments/${assignment.id}/attempts`,
      { count: 1 },
    )
    expect(granted.body.assignment).toMatchObject({ blocked: false, attemptsAllowed: 3 })

    const retry = await attempt(lea, quest.id, await rightAnswers(lea, quest.id))
    expect(retry.body.quest).toMatchObject({ status: 'validated', attemptsUsed: 3, xpAwarded: 100 })
  })
})

describe('QCM', () => {
  it('compte juste une question seulement si tous ses bons choix sont cochés, et eux seuls', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(admin, qcmQuest())
    const [italy, france] = quest.items

    const partial = await attempt(lea, quest.id, {
      answers: { [italy!.id]: [1], [france!.id]: [0] },
    })
    const tooMany = await attempt(lea, quest.id, {
      answers: { [italy!.id]: [1], [france!.id]: [0, 1, 2] },
    })
    const right = await attempt(lea, quest.id, {
      answers: { [italy!.id]: [1], [france!.id]: [2, 0] },
    })

    expect(partial.body.quest.lastAttempt).toMatchObject({
      score: 50,
      results: { [italy!.id]: true, [france!.id]: false },
    })
    expect(tooMany.body.quest.lastAttempt?.score).toBe(50)
    expect(right.body.quest).toMatchObject({ status: 'validated', xpAwarded: 100 })
  })

  it('retire les choix vides sans décaler les bonnes réponses', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(
      admin,
      qcmQuest({
        items: [
          { prompt: 'Le plus grand ?', answers: [], choices: ['', '3', '', '9'], correct: [3] },
        ],
      }),
    )

    expect(quest.items[0]).toMatchObject({ choices: ['3', '9'], correct: [1] })
    const response = await attempt(lea, quest.id, { answers: { [quest.items[0]!.id]: [1] } })
    expect(response.body.quest.status).toBe('validated')
  })
})

describe('cartes de mémorisation', () => {
  it('montre les cartes et propose, au test, la bonne réponse parmi celles des autres cartes', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(admin, cardsQuest())

    const mine = await readMine(lea, quest.id)

    expect(mine.items.map((item) => [item.prompt, item.back])).toEqual([
      ['Prise de la Bastille', '1789'],
      ['Chute du mur de Berlin', '1989'],
      ['Premier pas sur la Lune', '1969'],
    ])
    for (const item of mine.items) {
      const texts = item.options!.map((option) => option.text)
      expect(texts).toContain(item.back)
      expect(new Set(texts).size).toBe(texts.length)
      expect([...texts].sort()).toEqual(['1789', '1969', '1989'])
    }
  })

  it('ne propose pas plus de quatre réponses par carte', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(
      admin,
      cardsQuest({
        items: Array.from({ length: 8 }, (_, index) => ({
          prompt: `Carte ${index + 1}`,
          answers: [`Réponse ${index + 1}`],
          choices: [],
          correct: [],
        })),
      }),
    )

    const mine = await readMine(lea, quest.id)

    for (const item of mine.items) {
      expect(item.options).toHaveLength(4)
      expect(item.options!.map((option) => option.text)).toContain(item.back)
    }
  })

  it('corrige le test : l’élève désigne la carte qui porte la bonne réponse', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(admin, cardsQuest())
    const [bastille, berlin, moon] = quest.items

    const wrong = await attempt(lea, quest.id, {
      answers: { [bastille!.id]: berlin!.id, [berlin!.id]: berlin!.id, [moon!.id]: bastille!.id },
    })
    const right = await attempt(lea, quest.id, {
      answers: { [bastille!.id]: bastille!.id, [berlin!.id]: berlin!.id, [moon!.id]: moon!.id },
    })

    expect(wrong.body.quest.lastAttempt).toMatchObject({
      score: 33,
      results: { [bastille!.id]: false, [berlin!.id]: true, [moon!.id]: false },
    })
    expect(right.body.quest).toMatchObject({ status: 'validated', xpAwarded: 100 })
  })
})

describe('quête déclarative', () => {
  it('est validée aussitôt quand l’admin a choisi la validation immédiate', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const quest = await createQuest(admin, sportQuest())

    const response = await attempt(lea, quest.id, { comment: '22 minutes, 3 km' })

    expect(response.body.quest).toMatchObject({ status: 'validated', xpAwarded: 100 })
    expect(response.body.quest.lastAttempt).toMatchObject({
      comment: '22 minutes, 3 km',
      score: null,
    })
    // Pas de bonus sans faute : il est réservé aux formats corrigés automatiquement.
    expect(await xpLines(scene, leaId)).toEqual([
      { amount: 100, reason: 'quest', detail: null, mission_delta: 1 },
    ])
  })

  it('attend l’admin quand il a choisi la validation manuelle', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const quest = await createQuest(admin, sportQuest({ manualValidation: true }))

    const submitted = await attempt(lea, quest.id, { comment: 'Fait ce matin' })

    expect(submitted.body.quest).toMatchObject({
      status: 'submitted',
      xpAwarded: null,
      submittedAt: '2026-11-17T10:00:00.000Z',
    })
    expect(await xpLines(scene, leaId)).toEqual([])

    const queue = await admin.get<ValidationsResponse>('/api/admin/validations')
    expect(queue.body.validations).toHaveLength(1)
    expect(queue.body.validations[0]).toMatchObject({
      quest: { id: quest.id, title: 'Courir 20 minutes', format: 'declarative' },
      student: { pseudo: 'Léa' },
      answer: 'Fait ce matin',
      late: false,
    })
  })
})

describe('réponse libre et file de validation', () => {
  it('exige un texte', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(admin, essayQuest())

    const response = await attempt(lea, quest.id, { text: '   ' })

    expect(response.status).toBe(400)
    expect(response.body.error.fields).toEqual({ text: 'Écris ta réponse avant de l’envoyer.' })
    expect((await readMine(lea, quest.id)).status).toBe('todo')
  })

  it('crédite l’XP quand l’admin valide', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const quest = await createQuest(admin, essayQuest())
    await attempt(lea, quest.id, { text: 'Mon résumé du chapitre.' })
    const [pending] = (await admin.get<ValidationsResponse>('/api/admin/validations')).body
      .validations

    const validated = await admin.post<AssignmentResponse>(
      `/api/admin/assignments/${pending!.assignmentId}/validate`,
      { comment: 'Très bon résumé.' },
    )

    expect(pending).toMatchObject({ answer: 'Mon résumé du chapitre.', attemptNumber: 1 })
    expect(validated.body.assignment).toMatchObject({
      status: 'validated',
      xpAwarded: 100,
      adminComment: 'Très bon résumé.',
    })
    expect(await xpLines(scene, leaId)).toEqual([
      { amount: 100, reason: 'quest', detail: null, mission_delta: 1 },
    ])
    expect(await readMine(lea, quest.id)).toMatchObject({
      status: 'validated',
      xpAwarded: 100,
      adminComment: 'Très bon résumé.',
    })
    expect(
      (await admin.get<ValidationsResponse>('/api/admin/validations')).body.validations,
    ).toEqual([])
  })

  it('présente les réalisations de la plus ancienne à la plus récente', async () => {
    const scene = await setup()
    const { admin, lea, tom } = scene
    const quest = await createQuest(admin, essayQuest())
    await attempt(tom, quest.id, { text: 'Réponse de Tom' })
    scene.advance(10 * MINUTE)
    await attempt(lea, quest.id, { text: 'Réponse de Léa' })

    const queue = await admin.get<ValidationsResponse>('/api/admin/validations')

    expect(queue.body.validations.map((entry) => entry.student.pseudo)).toEqual(['Tom', 'Léa'])
  })

  it('après un refus, montre le commentaire à l’élève et le laisse recommencer', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const quest = await createQuest(admin, essayQuest())
    await attempt(lea, quest.id, { text: 'Trop court.' })
    const [pending] = (await admin.get<ValidationsResponse>('/api/admin/validations')).body
      .validations

    const noComment = await admin.post<ApiErrorBody>(
      `/api/admin/assignments/${pending!.assignmentId}/reject`,
      { comment: '  ' },
    )
    const rejected = await admin.post<AssignmentResponse>(
      `/api/admin/assignments/${pending!.assignmentId}/reject`,
      { comment: 'Développe davantage.' },
    )

    expect(noComment.status).toBe(400)
    expect(rejected.body.assignment).toMatchObject({
      status: 'rejected',
      adminComment: 'Développe davantage.',
    })
    expect(await readMine(lea, quest.id)).toMatchObject({
      status: 'rejected',
      adminComment: 'Développe davantage.',
    })
    expect(await xpLines(scene, leaId)).toEqual([])

    const again = await attempt(lea, quest.id, { text: 'Une réponse bien plus développée.' })
    expect(again.body.quest).toMatchObject({ status: 'submitted', adminComment: null })
    expect(again.body.quest.lastAttempt?.number).toBe(2)
  })

  it('refuse une seconde soumission tant que la première attend', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(admin, essayQuest())
    await attempt(lea, quest.id, { text: 'Première version' })

    const second = await attempt(lea, quest.id, { text: 'Seconde version' })

    expect(second.status).toBe(409)
    expect(second.body.error.code).toBe('already_submitted')
  })

  it('ne valide ni ne refuse une réalisation qui n’est pas soumise', async () => {
    const { admin } = await setup()
    const quest = await createQuest(admin, essayQuest())
    const assignmentId = quest.assignments[0]!.id

    const validate = await admin.post<ApiErrorBody>(
      `/api/admin/assignments/${assignmentId}/validate`,
    )
    const reject = await admin.post<ApiErrorBody>(`/api/admin/assignments/${assignmentId}/reject`, {
      comment: 'Non',
    })
    const unknown = await admin.post(`/api/admin/assignments/inconnue/validate`)

    expect(validate.status).toBe(409)
    expect(validate.body.error.code).toBe('not_submitted')
    expect(reject.status).toBe(409)
    expect(unknown.status).toBe(404)
  })
})

describe('une quête ne crédite jamais deux fois l’XP', () => {
  it('ignore une validation rejouée par l’admin', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const quest = await createQuest(admin, essayQuest())
    await attempt(lea, quest.id, { text: 'Ma réponse' })
    const assignmentId = quest.assignments.find((a) => a.student.id === leaId)!.id

    const first = await admin.post<AssignmentResponse>(
      `/api/admin/assignments/${assignmentId}/validate`,
    )
    const replay = await admin.post<AssignmentResponse>(
      `/api/admin/assignments/${assignmentId}/validate`,
    )

    expect(first.status).toBe(200)
    expect(replay.status).toBe(200)
    expect(replay.body.assignment).toMatchObject({ status: 'validated', xpAwarded: 100 })
    expect(await xpLines(scene, leaId)).toHaveLength(1)
  })

  it('ignore un double clic de l’admin', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const quest = await createQuest(admin, essayQuest())
    await attempt(lea, quest.id, { text: 'Ma réponse' })
    const assignmentId = quest.assignments.find((a) => a.student.id === leaId)!.id

    const responses = await Promise.all(
      Array.from({ length: 4 }, () =>
        admin.post<AssignmentResponse>(`/api/admin/assignments/${assignmentId}/validate`),
      ),
    )

    expect(responses.map((response) => response.status)).toEqual([200, 200, 200, 200])
    expect(await xpLines(scene, leaId)).toHaveLength(1)
  })

  it('refuse une réponse de l’élève à une quête déjà validée', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const quest = await createQuest(admin, baseQuest())
    const answers = await rightAnswers(lea, quest.id)

    const [first, second] = await Promise.all([
      attempt(lea, quest.id, answers),
      attempt(lea, quest.id, answers),
    ])
    const third = await attempt(lea, quest.id, answers)

    expect([first.status, second.status].sort()).toEqual([200, 409])
    expect(third.status).toBe(409)
    expect(third.body.error.code).toBe('already_validated')
    expect((await xpLines(scene, leaId)).filter((line) => line.reason === 'quest')).toHaveLength(1)
  })

  it('ne crédite qu’une fois quand deux instances de la fonction valident en même temps', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const quest = await createQuest(admin, essayQuest())
    await attempt(lea, quest.id, { text: 'Ma réponse' })
    const assignmentId = quest.assignments.find((a) => a.student.id === leaId)!.id
    // Une seconde instance de la fonction, sur le même stockage, avec la session du même admin.
    const other = createTestApp({}, scene)
    const sameAdmin = other.client()
    sameAdmin.cookie = admin.cookie
    await sameAdmin.get('/api/session')

    const responses = await Promise.all([
      admin.post<AssignmentResponse>(`/api/admin/assignments/${assignmentId}/validate`),
      sameAdmin.post<AssignmentResponse>(`/api/admin/assignments/${assignmentId}/validate`),
    ])

    expect(responses.map((response) => response.status)).toEqual([200, 200])
    await scene.database().reload()
    expect(await xpLines(scene, leaId)).toEqual([
      { amount: 100, reason: 'quest', detail: null, mission_delta: 1 },
    ])
  })
})

describe('deadline, bonus d’avance et expiration', () => {
  it('ajoute le bonus d’avance quand la quête est validée plus de 24 h avant la deadline', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(admin, sportQuest({ deadlineAt: IN_TWO_DAYS }))

    const response = await attempt(lea, quest.id, {})

    expect(response.body.quest.reward).toEqual({
      base: 100,
      late: false,
      bonuses: [{ kind: 'early', amount: 10 }],
      total: 110,
    })
  })

  it('cumule bonus d’avance et bonus sans faute', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const quest = await createQuest(admin, baseQuest({ deadlineAt: IN_TWO_DAYS }))

    const response = await attempt(lea, quest.id, await rightAnswers(lea, quest.id))

    expect(response.body.quest.xpAwarded).toBe(120)
    expect(await xpLines(scene, leaId)).toEqual([
      { amount: 100, reason: 'quest', detail: null, mission_delta: 1 },
      { amount: 10, reason: 'bonus', detail: 'early', mission_delta: 0 },
      { amount: 10, reason: 'bonus', detail: 'flawless', mission_delta: 0 },
    ])
  })

  it('calcule le bonus sur la date de soumission, même si l’admin valide après la deadline', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const quest = await createQuest(admin, essayQuest({ deadlineAt: IN_TWO_DAYS }))
    await attempt(lea, quest.id, { text: 'Rendu en avance.' })
    const assignmentId = quest.assignments.find((a) => a.student.id === leaId)!.id

    // La deadline passe : la réalisation soumise n'expire pas.
    scene.advance(3 * DAY)
    expect((await readMine(lea, quest.id)).status).toBe('submitted')
    const validated = await admin.post<AssignmentResponse>(
      `/api/admin/assignments/${assignmentId}/validate`,
    )

    expect(validated.body.assignment).toMatchObject({ status: 'validated', xpAwarded: 110 })
    expect((await readMine(lea, quest.id)).reward).toEqual({
      base: 100,
      late: false,
      bonuses: [{ kind: 'early', amount: 10 }],
      total: 110,
    })
  })

  it('passe en Expirée à la deadline et refuse toute soumission tardive', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const quest = await createQuest(admin, baseQuest({ deadlineAt: IN_THREE_HOURS }))
    const answers = await rightAnswers(lea, quest.id)

    scene.advance(3 * HOUR + MINUTE)
    const list = await lea.get<StudentQuestsResponse>('/api/quests')
    const late = await attempt(lea, quest.id, answers)
    const start = await lea.post<StudentQuestResponse>(`/api/quests/${quest.id}/start`)

    expect(list.body.quests[0]).toMatchObject({ status: 'expired', xpAwarded: null })
    expect(late.status).toBe(409)
    expect(late.body.error).toEqual({
      code: 'expired',
      message: 'La deadline est passée\u00A0: cette quête est expirée.',
    })
    expect(start.body.quest.status).toBe('expired')
    expect(await xpLines(scene, leaId)).toEqual([])
    const detail = await admin.get<AdminQuestResponse>(`/api/admin/quests/${quest.id}`)
    expect(detail.body.quest.assignments.map((a) => a.status)).toEqual(['expired', 'expired'])
  })

  it('ne rapporte que la moitié quand l’admin rouvre une quête expirée', async () => {
    const scene = await setup()
    const { admin, lea, tom, leaId } = scene
    const quest = await createQuest(admin, baseQuest({ deadlineAt: IN_THREE_HOURS }))
    const assignmentId = quest.assignments.find((a) => a.student.id === leaId)!.id
    const answers = await rightAnswers(lea, quest.id)

    const tooEarly = await admin.post<ApiErrorBody>(`/api/admin/assignments/${assignmentId}/reopen`)
    scene.advance(4 * HOUR)
    const expired = await readMine(lea, quest.id)
    const reopened = await admin.post<AssignmentResponse>(
      `/api/admin/assignments/${assignmentId}/reopen`,
    )
    const offered = await readMine(lea, quest.id)
    const listed = (await lea.get<StudentQuestsResponse>('/api/quests')).body.quests
    const done = await attempt(lea, quest.id, answers)

    expect(tooEarly.status).toBe(409)
    expect(tooEarly.body.error.code).toBe('not_expired')
    expect(reopened.body.assignment.status).toBe('todo')
    // L'élève sait ce que la quête rouverte rapporte désormais : la moitié de sa récompense.
    expect(expired.lateRewardXp).toBeNull()
    expect(offered).toMatchObject({ status: 'todo', rewardXp: 100, lateRewardXp: 50 })
    expect(listed.find((entry) => entry.id === quest.id)?.lateRewardXp).toBe(50)
    expect(done.body.quest.lateRewardXp).toBeNull()
    // 50 % de la récompense, plus le bonus sans faute calculé sur cette moitié.
    expect(done.body.quest.reward).toEqual({
      base: 50,
      late: true,
      bonuses: [{ kind: 'flawless', amount: 5 }],
      total: 55,
    })
    expect(await xpLines(scene, leaId)).toEqual([
      { amount: 50, reason: 'quest', detail: 'late', mission_delta: 1 },
      { amount: 5, reason: 'bonus', detail: 'flawless', mission_delta: 0 },
    ])
    // La réouverture ne vaut que pour cet élève.
    expect((await readMine(tom, quest.id)).status).toBe('expired')
  })

  it('peut rouvrir la quête en refusant une réalisation après la deadline', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const quest = await createQuest(admin, essayQuest({ deadlineAt: IN_THREE_HOURS }))
    await attempt(lea, quest.id, { text: 'Rendu à temps.' })
    const assignmentId = quest.assignments.find((a) => a.student.id === leaId)!.id
    scene.advance(4 * HOUR)

    const rejected = await admin.post<AssignmentResponse>(
      `/api/admin/assignments/${assignmentId}/reject`,
      { comment: 'À reprendre.', reopen: true },
    )

    expect(rejected.body.assignment.status).toBe('rejected')
    const again = await attempt(lea, quest.id, { text: 'Version reprise.' })
    expect(again.status).toBe(200)
    const queue = await admin.get<ValidationsResponse>('/api/admin/validations')
    expect(queue.body.validations[0]).toMatchObject({ late: true })
  })

  it('laisse expirer une réalisation refusée après la deadline si elle n’est pas rouverte', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const quest = await createQuest(admin, essayQuest({ deadlineAt: IN_THREE_HOURS }))
    await attempt(lea, quest.id, { text: 'Rendu à temps.' })
    const assignmentId = quest.assignments.find((a) => a.student.id === leaId)!.id
    scene.advance(4 * HOUR)

    await admin.post(`/api/admin/assignments/${assignmentId}/reject`, { comment: 'Trop tard.' })

    expect((await readMine(lea, quest.id)).status).toBe('expired')
  })

  it('ne fait jamais expirer une quête sans deadline', async () => {
    const scene = await setup()
    const { admin, lea } = scene
    const quest = await createQuest(admin, sportQuest())

    scene.advance(400 * DAY)
    // La session a expiré entre-temps : l'élève se reconnecte.
    await lea.post('/api/auth/login', { login: 'Léa', password: 'motdepasse-solide' })
    const response = await attempt(lea, quest.id, {})

    expect(response.body.quest).toMatchObject({ status: 'validated', xpAwarded: 100 })
  })
})

describe('cycle de vie côté élève', () => {
  it('passe de « À faire » à « En cours » quand l’élève ouvre la quête', async () => {
    const scene = await setup()
    const { admin, lea, tom } = scene
    const quest = await createQuest(admin, baseQuest())

    expect((await readMine(lea, quest.id)).status).toBe('todo')
    const started = await lea.post<StudentQuestResponse>(`/api/quests/${quest.id}/start`)
    const again = await lea.post<StudentQuestResponse>(`/api/quests/${quest.id}/start`)

    expect(started.body.quest.status).toBe('in_progress')
    expect(again.body.quest.status).toBe('in_progress')
    expect((await readMine(tom, quest.id)).status).toBe('todo')
  })

  it('trie les quêtes par deadline la plus proche, celles sans deadline à la fin', async () => {
    const { admin, lea } = await setup()
    await createQuest(admin, baseQuest({ title: 'Sans deadline' }))
    await createQuest(admin, baseQuest({ title: 'Dans deux jours', deadlineAt: IN_TWO_DAYS }))
    await createQuest(admin, baseQuest({ title: 'Dans trois heures', deadlineAt: IN_THREE_HOURS }))

    const list = await lea.get<StudentQuestsResponse>('/api/quests')

    expect(list.body.quests.map((quest) => quest.title)).toEqual([
      'Dans trois heures',
      'Dans deux jours',
      'Sans deadline',
    ])
  })
})

describe('droits sur les quêtes', () => {
  it('ne montre à un élève que ses propres quêtes', async () => {
    const { admin, lea, tom, leaId } = await setup()
    const quest = await createQuest(admin, baseQuest({ assignees: [leaId] }))

    const list = await tom.get<StudentQuestsResponse>('/api/quests')
    const detail = await tom.get<ApiErrorBody>(`/api/quests/${quest.id}`)
    const start = await tom.post(`/api/quests/${quest.id}/start`)
    const submit = await attempt(tom, quest.id, await rightAnswers(lea, quest.id))

    expect(list.body.quests).toEqual([])
    expect(detail.status).toBe(404)
    expect(detail.body.error).toEqual({
      code: 'not_found',
      message: 'Cette quête est introuvable.',
    })
    expect(start.status).toBe(404)
    expect(submit.status).toBe(404)
  })

  it('répond de la même façon pour une quête inconnue et pour celle d’un autre', async () => {
    const { admin, tom, leaId } = await setup()
    const quest = await createQuest(admin, baseQuest({ assignees: [leaId] }))

    const others = await tom.get(`/api/quests/${quest.id}`)
    const unknown = await tom.get('/api/quests/00000000-0000-4000-8000-000000000000')

    expect(others.status).toBe(404)
    expect(others.body).toEqual(unknown.body)
  })

  it('n’ouvre les quêtes d’élève ni à un visiteur ni à un admin', async () => {
    const { admin, client } = await setup()
    const quest = await createQuest(admin, baseQuest())

    for (const path of ['/api/quests', `/api/quests/${quest.id}`]) {
      expect((await client().get(path)).status).toBe(401)
      expect((await admin.get(path)).status).toBe(403)
    }
    expect((await client().post(`/api/quests/${quest.id}/attempts`, {})).status).toBe(401)
    expect((await admin.post(`/api/quests/${quest.id}/attempts`, {})).status).toBe(403)
  })

  it('supprime les quêtes, tentatives et XP d’un élève avec son compte', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const quest = await createQuest(admin, baseQuest())
    await attempt(lea, quest.id, await rightAnswers(lea, quest.id))

    await admin.delete(`/api/admin/students/${leaId}`)

    const left = await scene.database().read((tx) => ({
      assignments: tx.all('SELECT id FROM assignments WHERE student_id = ?', [leaId]).length,
      attempts: tx.all('SELECT id FROM attempts').length,
      xp: tx.all('SELECT id FROM xp_entries WHERE user_id = ?', [leaId]).length,
    }))
    expect(left).toEqual({ assignments: 0, attempts: 0, xp: 0 })
    const detail = await admin.get<AdminQuestResponse>(`/api/admin/quests/${quest.id}`)
    expect(detail.body.quest.assignments.map((a) => a.student.pseudo)).toEqual(['Tom'])
  })
})
