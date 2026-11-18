import { describe, expect, it } from 'vitest'
import { SqliteBlobDatabase } from '../../server/db/database.js'
import { migrations } from '../../server/db/migrations/index.js'
import { listItems } from '../../server/quests/store.js'
import type { ApiErrorBody } from '../../shared/schemas/errors.js'
import type { LibraryExerciseResponse, LibraryResponse } from '../../shared/schemas/library.js'
import {
  EXPLANATION_MAX,
  type AdminQuestDetail,
  type AdminQuestResponse,
  type SaveQuestRequestBody,
  type StudentQuestResponse,
  type StudentQuestsResponse,
} from '../../shared/schemas/quests.js'
import { MemoryBlobStore } from '../helpers/memory-blob-store.js'
import { createTestApp, type TestApp, type TestClient } from '../helpers/test-app.js'

/**
 * Corrections détaillées et bibliothèque d'exercices (version 1.1).
 *
 * La correction d'une question dit comment trouver la réponse : elle suit la
 * règle des réponses attendues et ne quitte le serveur qu'une fois la quête
 * validée. La bibliothèque, elle, n'est servie qu'à l'admin.
 */
type QuestDraft = Partial<SaveQuestRequestBody>

/** Des corrections reconnaissables entre toutes, pour repérer la moindre fuite. */
const FIRST_EXPLANATION = '**6 × 7 = 42**\nTable de 7\u00A0: indice-alpha.'
const SECOND_EXPLANATION = 'La moitié de 7 vaut 3,5\u00A0: indice-bêta.'

const mathsQuest = (overrides: QuestDraft = {}): QuestDraft => ({
  title: 'Tables de multiplication',
  instructions: 'Réponds sans calculatrice.',
  category: 'maths',
  format: 'exact',
  difficulty: 'medium',
  rewardXp: 100,
  passThreshold: 80,
  maxAttempts: 2,
  items: [
    { prompt: '6 × 7 ?', answers: ['42'], explanation: FIRST_EXPLANATION },
    { prompt: 'La moitié de 7 ?', answers: ['3,5'], explanation: SECOND_EXPLANATION },
    { prompt: '2 + 2 ?', answers: ['4'] },
  ],
  assignees: 'all',
  publish: true,
  ...overrides,
})

interface Scene extends TestApp {
  admin: TestClient
  lea: TestClient
  tom: TestClient
  leaId: string
}

async function setup(): Promise<Scene> {
  const testApp = createTestApp()
  const admin = testApp.client()
  await admin.signUpAdmin('Coach')
  const lea = testApp.client()
  const tom = testApp.client()
  const leaId = (await lea.signUpStudent('Léa')).id
  await tom.signUpStudent('Tom')
  return { ...testApp, admin, lea, tom, leaId }
}

async function createQuest(admin: TestClient, quest: QuestDraft): Promise<AdminQuestDetail> {
  const response = await admin.post<AdminQuestResponse>('/api/admin/quests', quest)
  if (response.status !== 201) {
    throw new Error(`Création refusée : ${JSON.stringify(response.body)}`)
  }
  return response.body.quest
}

const attempt = (student: TestClient, questId: string, answers: Record<string, unknown>) =>
  student.post<StudentQuestResponse & ApiErrorBody>(`/api/quests/${questId}/attempts`, { answers })

describe('correction détaillée d’une question', () => {
  it('s’enregistre avec la question, et l’admin la relit', async () => {
    const { admin } = await setup()

    const quest = await createQuest(
      admin,
      mathsQuest({
        items: [
          { prompt: '6 × 7 ?', answers: ['42'], explanation: `  ${FIRST_EXPLANATION}\n\n` },
          { prompt: '2 + 2 ?', answers: ['4'] },
        ],
      }),
    )
    const reread = await admin.get<AdminQuestResponse>(`/api/admin/quests/${quest.id}`)

    // Les espaces et les lignes vides autour du texte sont retirés ; sans correction, la chaîne est vide.
    expect(reread.body.quest.items.map((item) => item.explanation)).toEqual([FIRST_EXPLANATION, ''])
  })

  it('n’existe que pour les questions : une carte se corrige par son verso', async () => {
    const { admin } = await setup()

    const cards = await createQuest(
      admin,
      mathsQuest({
        format: 'flashcards',
        category: 'memorization',
        items: [
          { prompt: 'Italie', answers: ['Rome'], explanation: 'Sans objet.' },
          { prompt: 'Espagne', answers: ['Madrid'], explanation: 'Sans objet.' },
        ],
      }),
    )
    const qcm = await createQuest(
      admin,
      mathsQuest({
        format: 'qcm',
        items: [
          {
            prompt: 'Capitale de l’Italie ?',
            choices: ['Milan', 'Rome'],
            correct: [1],
            explanation: 'Rome est la capitale depuis 1871.',
          },
        ],
      }),
    )

    expect(cards.items.map((item) => item.explanation)).toEqual(['', ''])
    expect(qcm.items[0]?.explanation).toBe('Rome est la capitale depuis 1871.')
  })

  it('refuse une correction trop longue, en désignant la question', async () => {
    const { admin } = await setup()

    const refused = await admin.post<ApiErrorBody>(
      '/api/admin/quests',
      mathsQuest({
        items: [
          { prompt: '6 × 7 ?', answers: ['42'], explanation: 'x'.repeat(EXPLANATION_MAX + 1) },
        ],
      }),
    )

    expect(refused.status).toBe(400)
    expect(refused.body.error.fields).toEqual({
      'items.0.explanation': `${EXPLANATION_MAX} caractères au maximum.`,
    })
  })

  it('ne quitte jamais le serveur avant la validation, même tentatives épuisées', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(admin, mathsQuest())
    const [first, second, third] = quest.items.map((item) => item.id)

    const list = await lea.get<StudentQuestsResponse>('/api/quests')
    const detail = await lea.get<StudentQuestResponse>(`/api/quests/${quest.id}`)
    const started = await lea.post(`/api/quests/${quest.id}/start`)
    const failed = await attempt(lea, quest.id, { [first!]: '41', [second!]: '3', [third!]: '5' })
    const blocked = await attempt(lea, quest.id, { [first!]: '42', [second!]: '3', [third!]: '5' })
    const after = await lea.get<StudentQuestResponse>(`/api/quests/${quest.id}`)

    expect(blocked.body.quest).toMatchObject({ status: 'in_progress', blocked: true })
    for (const response of [detail, failed, blocked, after]) {
      expect(response.body.quest.explanations).toBeNull()
    }
    const sent = JSON.stringify([list, detail, started, failed, blocked, after].map((r) => r.body))
    expect(sent).not.toContain('indice')
    expect(sent).not.toContain('Table de 7')
    // Aucun élément n'apporte autre chose que son énoncé.
    expect(detail.body.quest.items.map((item) => Object.keys(item).sort())).toEqual([
      ['id', 'prompt'],
      ['id', 'prompt'],
      ['id', 'prompt'],
    ])
  })

  it('est montrée une fois la quête validée, pour les questions qui en ont une', async () => {
    const { admin, lea, tom } = await setup()
    const quest = await createQuest(admin, mathsQuest())
    const [first, second, third] = quest.items.map((item) => item.id)

    const done = await attempt(lea, quest.id, { [first!]: '42', [second!]: '3.5', [third!]: '4' })
    const reread = await lea.get<StudentQuestResponse>(`/api/quests/${quest.id}`)
    const other = await tom.get<StudentQuestResponse>(`/api/quests/${quest.id}`)

    expect(done.body.quest.status).toBe('validated')
    expect(done.body.quest.explanations).toEqual({
      [first!]: FIRST_EXPLANATION,
      [second!]: SECOND_EXPLANATION,
    })
    expect(reread.body.quest.explanations).toEqual(done.body.quest.explanations)
    // Tom, qui n'a pas encore validé la même quête, ne reçoit toujours rien.
    expect(other.body.quest.explanations).toBeNull()
    expect(JSON.stringify(other.body)).not.toContain('indice')
  })

  it('n’est pas envoyée pour un format sans corrigé', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(
      admin,
      mathsQuest({ format: 'declarative', category: 'sport', manualValidation: false, items: [] }),
    )

    const done = await lea.post<StudentQuestResponse>(`/api/quests/${quest.id}/attempts`, {})

    expect(done.body.quest).toMatchObject({ status: 'validated', explanations: null })
  })

  it('est figée avec la question dès qu’un élève a répondu', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(admin, mathsQuest())
    await attempt(lea, quest.id, {})

    const changed = await admin.put<ApiErrorBody>(
      `/api/admin/quests/${quest.id}`,
      mathsQuest({
        items: [
          { prompt: '6 × 7 ?', answers: ['42'], explanation: 'Une autre correction.' },
          { prompt: 'La moitié de 7 ?', answers: ['3,5'], explanation: SECOND_EXPLANATION },
          { prompt: '2 + 2 ?', answers: ['4'] },
        ],
      }),
    )
    const renamed = await admin.put<AdminQuestResponse>(
      `/api/admin/quests/${quest.id}`,
      mathsQuest({ title: 'Tables de 6 et de 7' }),
    )

    expect(changed.status).toBe(409)
    expect(changed.body.error.code).toBe('quest_locked')
    expect(renamed.status).toBe(200)
    expect(renamed.body.quest.items[0]?.explanation).toBe(FIRST_EXPLANATION)
  })

  it('suit la quête quand elle est dupliquée', async () => {
    const { admin } = await setup()
    const quest = await createQuest(admin, mathsQuest())

    const copy = await admin.post<AdminQuestResponse>(`/api/admin/quests/${quest.id}/duplicate`)

    expect(copy.status).toBe(201)
    expect(copy.body.quest.items.map((item) => item.explanation)).toEqual([
      FIRST_EXPLANATION,
      SECOND_EXPLANATION,
      '',
    ])
  })

  it('arrive sans rien perdre dans une base créée avant la version 1.1', async () => {
    const store = new MemoryBlobStore()
    const open = (list: typeof migrations) =>
      new SqliteBlobDatabase({
        store,
        key: 'db/main.sqlite',
        migrations: list,
        backups: null,
        sleep: async () => undefined,
      })
    // La base telle que la version 1.0 l'a laissée : une quête et sa question, sans correction.
    await open(migrations.slice(0, 6)).write((tx) => {
      tx.run(
        `INSERT INTO quests (id, title, category, format, difficulty, reward_xp, manual_validation,
           pass_threshold, max_attempts, state, created_at, updated_at)
         VALUES ('q1', 'Ancienne quête', 'maths', 'exact', 'easy', 50, 0, 80, 3, 'published', ?, ?)`,
        ['2026-11-01T10:00:00.000Z', '2026-11-01T10:00:00.000Z'],
      )
      tx.run(
        `INSERT INTO quest_items (id, quest_id, position, kind, prompt, expected_answers, choices)
         VALUES ('i1', 'q1', 0, 'question', '6 × 7 ?', '["42"]', '[]')`,
      )
    })

    const items = await open(migrations).read((tx) => listItems(tx, 'q1'))

    const upgraded = await open(migrations).read((tx) =>
      tx.get<{ lesson: string; example: string }>('SELECT lesson, example FROM quests'),
    )
    expect(upgraded).toEqual({ lesson: '', example: '' })
    expect(items).toEqual([
      {
        id: 'i1',
        position: 0,
        prompt: '6 × 7 ?',
        answers: ['42'],
        choices: [],
        correct: [],
        explanation: '',
      },
    ])
  })
})

describe('rappel du cours et exemple expliqué', () => {
  const LESSON = 'Le carré d’un nombre est ce nombre multiplié par lui-même.'
  const EXAMPLE =
    '**Énoncé\u00A0:** Calcule 5².\n\n**5² = 5 × 5 = 25**\nOn multiplie 5 par lui-même.'

  it('s’enregistrent avec la quête ; l’élève les lit dès qu’il l’ouvre', async () => {
    const { admin, lea } = await setup()

    const quest = await createQuest(
      admin,
      mathsQuest({ lesson: `  ${LESSON}\n`, example: EXAMPLE }),
    )
    const mine = await lea.get<StudentQuestResponse>(`/api/quests/${quest.id}`)

    // Les espaces autour du texte sont retirés.
    expect(quest).toMatchObject({ lesson: LESSON, example: EXAMPLE })
    expect(mine.body.quest).toMatchObject({ lesson: LESSON, example: EXAMPLE, status: 'todo' })
  })

  it('sont vides pour une quête qui n’en a pas', async () => {
    const { admin, lea } = await setup()

    const quest = await createQuest(admin, mathsQuest())
    const mine = await lea.get<StudentQuestResponse>(`/api/quests/${quest.id}`)

    expect(quest).toMatchObject({ lesson: '', example: '' })
    expect(mine.body.quest).toMatchObject({ lesson: '', example: '' })
  })

  it('restent modifiables après la première réponse d’un élève, comme la consigne', async () => {
    const { admin, lea } = await setup()
    const quest = await createQuest(admin, mathsQuest({ lesson: LESSON, example: EXAMPLE }))
    await attempt(lea, quest.id, {})

    const edited = await admin.put<AdminQuestResponse>(
      `/api/admin/quests/${quest.id}`,
      mathsQuest({ lesson: 'Un rappel plus clair.', example: '' }),
    )

    expect(edited.status).toBe(200)
    expect(edited.body.quest).toMatchObject({
      lesson: 'Un rappel plus clair.',
      example: '',
      locked: true,
    })
  })

  it('suivent la quête quand elle est dupliquée', async () => {
    const { admin } = await setup()
    const quest = await createQuest(admin, mathsQuest({ lesson: LESSON, example: EXAMPLE }))

    const copy = await admin.post<AdminQuestResponse>(`/api/admin/quests/${quest.id}/duplicate`)

    expect(copy.body.quest).toMatchObject({ lesson: LESSON, example: EXAMPLE, state: 'draft' })
  })

  it('refusent un texte trop long, en désignant le champ', async () => {
    const { admin } = await setup()

    const refused = await admin.post<ApiErrorBody>(
      '/api/admin/quests',
      mathsQuest({ lesson: 'x'.repeat(5001) }),
    )

    expect(refused.status).toBe(400)
    expect(refused.body.error.fields).toEqual({ lesson: '5000 caractères au maximum.' })
  })
})

describe('bibliothèque d’exercices', () => {
  const SIMPLE = 'identites-remarquables-cas-simples'

  it('est réservée à l’admin', async () => {
    const { admin, lea, client } = await setup()
    const visitor = client()

    for (const path of ['/api/admin/library', `/api/admin/library/${SIMPLE}`]) {
      expect((await visitor.get(path)).status).toBe(401)
      expect((await lea.get(path)).status).toBe(403)
      expect((await admin.get(path)).status).toBe(200)
    }
  })

  it('présente les exercices sans leurs questions', async () => {
    const { admin } = await setup()

    const library = await admin.get<LibraryResponse>('/api/admin/library')

    const ids = library.body.exercises.map((exercise) => exercise.id)
    expect(ids).toContain(SIMPLE)
    expect(ids).toContain('identites-remarquables-cas-difficiles')
    expect(library.body.exercises.find((exercise) => exercise.id === SIMPLE)).toEqual({
      id: SIMPLE,
      title: 'Identités remarquables\u00A0: cas simples',
      theme: 'calcul-litteral',
      level: '3e',
      description: expect.any(String) as string,
      category: 'maths',
      format: 'qcm',
      difficulty: 'easy',
      itemCount: 6,
    })
    // Les thèmes arrivent dans l'ordre du programme, chacun avec au moins un exercice.
    expect(library.body.themes).toContainEqual({ id: 'calcul-litteral', label: 'Calcul littéral' })
    for (const theme of library.body.themes) {
      expect(library.body.exercises.some((exercise) => exercise.theme === theme.id)).toBe(true)
    }
  })

  it('donne un exercice complet, et répond 404 pour un exercice inconnu', async () => {
    const { admin } = await setup()

    const found = await admin.get<LibraryExerciseResponse>(`/api/admin/library/${SIMPLE}`)
    const missing = await admin.get<ApiErrorBody>('/api/admin/library/exercice-inconnu')

    expect(found.body.exercise.items).toHaveLength(6)
    expect(found.body.exercise.items[0]).toMatchObject({
      prompt: 'Développe et réduis A = (x\u00A0+\u00A03)².',
      choices: ['x² + 9', 'x² + 6x + 9', 'x² + 3x + 9', 'x² + 6x + 6'],
      correct: [1],
    })
    expect(found.body.exercise.items[0]?.explanation).toContain('**Les pièges**')
    expect(found.body.exercise.lesson).toContain('double produit')
    expect(found.body.exercise.example).toContain('**Énoncé\u00A0:**')
    expect(missing.status).toBe(404)
    expect(missing.body.error.message).toBe('Cet exercice est introuvable.')
  })

  it('devient une quête donnée à un seul élève, qui lit les corrections une fois validée', async () => {
    const { admin, lea, tom, leaId } = await setup()
    const { exercise } = (await admin.get<LibraryExerciseResponse>(`/api/admin/library/${SIMPLE}`))
      .body

    // Ce que fait l'écran : l'exercice pré-remplit une nouvelle quête, donnée à Léa seulement.
    const quest = await createQuest(admin, {
      title: exercise.title,
      lesson: exercise.lesson,
      example: exercise.example,
      instructions: exercise.instructions,
      category: exercise.category,
      format: exercise.format,
      difficulty: exercise.difficulty,
      rewardXp: 50,
      items: exercise.items,
      assignees: [leaId],
      publish: true,
    })
    const mine = await lea.get<StudentQuestResponse>(`/api/quests/${quest.id}`)
    const others = await tom.get<StudentQuestsResponse>('/api/quests')

    expect(quest.assignments.map((assignment) => assignment.student.pseudo)).toEqual(['Léa'])
    expect(others.body.quests).toEqual([])
    expect((await tom.get(`/api/quests/${quest.id}`)).status).toBe(404)
    // Avant de répondre : le rappel du cours et l'exemple, les choix, mais ni les bonnes
    // positions ni les corrections.
    expect(mine.body.quest.lesson).toBe(exercise.lesson)
    expect(mine.body.quest.example).toBe(exercise.example)
    expect(mine.body.quest.items).toHaveLength(6)
    expect(mine.body.quest.explanations).toBeNull()
    expect(JSON.stringify(mine.body)).not.toContain('Les pièges')
    for (const item of mine.body.quest.items) {
      expect(Object.keys(item).sort()).toEqual(['choices', 'id', 'multiple', 'prompt'])
    }
    expect(mine.body.quest.corrections).toBeNull()

    const answers = Object.fromEntries(quest.items.map((item) => [item.id, item.correct]))
    const done = await attempt(lea, quest.id, answers)

    // Sans faute du premier coup : 50 XP et le bonus de 10 %.
    expect(done.body.quest).toMatchObject({ status: 'validated', xpAwarded: 55 })
    expect(Object.keys(done.body.quest.explanations ?? {})).toHaveLength(6)
    expect(done.body.quest.explanations?.[quest.items[0]!.id]).toBe(exercise.items[0]?.explanation)
    expect(done.body.quest.corrections?.[quest.items[0]!.id]).toEqual(['x² + 6x + 9'])
  })
})
