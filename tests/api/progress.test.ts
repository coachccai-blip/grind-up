import { describe, expect, it } from 'vitest'
import type { AdminStudentResponse, AdminStudentsResponse } from '../../shared/schemas/admin.js'
import type { SessionResponse } from '../../shared/schemas/auth.js'
import type { ApiErrorBody } from '../../shared/schemas/errors.js'
import type {
  AdminStudentProgressResponse,
  JournalResponse,
  ProgressResponse,
  StudentProgress,
} from '../../shared/schemas/progress.js'
import type {
  AdminQuestResponse,
  AssignmentResponse,
  StudentQuestResponse,
  ValidationsResponse,
} from '../../shared/schemas/quests.js'
import { createTestApp, DAY, HOUR, type TestApp, type TestClient } from '../helpers/test-app.js'

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

let questNumber = 0

/** Publie une quête à une question (réponse « 42 ») et renvoie son identifiant. */
async function publish(
  admin: TestClient,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  questNumber += 1
  const response = await admin.post<AdminQuestResponse>('/api/admin/quests', {
    title: `Quête ${questNumber}`,
    category: 'maths',
    format: 'exact',
    difficulty: 'medium',
    rewardXp: 100,
    items: [{ prompt: '6 × 7 ?', answers: ['42'] }],
    assignees: 'all',
    publish: true,
    ...overrides,
  })
  if (response.status !== 201) throw new Error(JSON.stringify(response.body))
  return response.body.quest.id
}

/** L'élève répond à une quête à une question ; « 42 » est la bonne réponse. */
async function answer(student: TestClient, questId: string, value = '42') {
  const quest = (await student.get<StudentQuestResponse>(`/api/quests/${questId}`)).body.quest
  return student.post<StudentQuestResponse>(`/api/quests/${questId}/attempts`, {
    answers: { [quest.items[0]!.id]: value },
  })
}

const progressOf = async (student: TestClient): Promise<StudentProgress> =>
  (await student.get<ProgressResponse>('/api/progress')).body.progress

const earned = (progress: StudentProgress) =>
  progress.badges.filter((badge) => badge.earnedAt !== null).map((badge) => badge.code)

describe('progression d’un élève', () => {
  it('part de zéro : niveau 1, aucune mission, aucun badge', async () => {
    const { lea } = await setup()

    const progress = await progressOf(lea)

    expect(progress).toMatchObject({
      xp: 0,
      level: { level: 1, xpInLevel: 0, xpToNextLevel: 100, xpRemaining: 100, percent: 0 },
      missions: 0,
      streak: { current: 0, best: 0 },
      recentRewards: [],
      celebration: null,
    })
    expect(progress.badges).toHaveLength(9)
    expect(earned(progress)).toEqual([])
  })

  it('suit l’XP, le niveau, les missions et la série dès qu’une quête est validée', async () => {
    const { admin, lea, tom } = await setup()
    const questId = await publish(admin)

    await answer(lea, questId)
    const progress = await progressOf(lea)

    // 100 XP + 10 de bonus sans faute : le niveau 2 est atteint à 100 XP.
    expect(progress).toMatchObject({
      xp: 110,
      level: { level: 2, xpInLevel: 10, xpToNextLevel: 200, xpRemaining: 190, percent: 5 },
      missions: 1,
      streak: { current: 1, best: 1 },
    })
    expect(earned(progress)).toEqual(['first_step'])
    // La progression de Tom n'a pas bougé.
    expect(await progressOf(tom)).toMatchObject({ xp: 0, missions: 0 })
  })

  it('annonce la validation, le passage de niveau et le nouveau badge, une seule fois', async () => {
    const { admin, lea } = await setup()
    const questId = await publish(admin, { title: 'Tables de 6' })
    await answer(lea, questId)

    const first = await progressOf(lea)
    expect(first.celebration).toEqual({
      validations: [{ questId, title: 'Tables de 6', xp: 110 }],
      xpGained: 110,
      levelUp: { from: 1, to: 2 },
      // Première mission de la semaine : Léa prend la tête du classement.
      podium: { rank: 1 },
      badges: ['first_step'],
    })

    const seen = await lea.post<ProgressResponse>('/api/progress/celebration/seen')
    expect(seen.body.progress.celebration).toBeNull()
    expect((await progressOf(lea)).celebration).toBeNull()
    expect(earned(seen.body.progress)).toEqual(['first_step'])
  })

  it('annonce à l’élève une quête que l’admin a validée en son absence', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const questId = await publish(admin, {
      title: 'Résumé',
      category: 'other',
      format: 'free_text',
      instructions: 'Résume.',
      items: [],
    })
    await lea.post(`/api/quests/${questId}/attempts`, { text: 'Mon résumé.' })
    expect((await progressOf(lea)).celebration).toBeNull()

    const [pending] = (await admin.get<ValidationsResponse>('/api/admin/validations')).body
      .validations
    scene.advance(2 * DAY)
    await admin.post(`/api/admin/assignments/${pending!.assignmentId}/validate`)
    // La session de Léa est toujours valable deux jours plus tard.
    const progress = await progressOf(lea)

    expect(progress.celebration).toMatchObject({
      validations: [{ questId, title: 'Résumé', xp: 100 }],
      xpGained: 100,
      levelUp: { from: 1, to: 2 },
    })
    expect(leaId).toBeTruthy()
  })

  it('n’annonce pas de passage de niveau quand le niveau ne change pas', async () => {
    const { admin, lea } = await setup()
    const questId = await publish(admin, { rewardXp: 40 })
    await answer(lea, questId)

    const progress = await progressOf(lea)

    expect(progress.celebration).toMatchObject({ xpGained: 44, levelUp: null })
  })

  it('montre les dernières récompenses, la plus récente d’abord', async () => {
    const scene = await setup()
    const { admin, lea } = scene
    const first = await publish(admin, { title: 'Première' })
    const second = await publish(admin, {
      title: 'Seconde',
      deadlineAt: '2026-11-25T10:00:00.000Z',
    })
    await answer(lea, first)
    scene.advance(HOUR)
    await answer(lea, second)

    const progress = await progressOf(lea)
    const journal = await lea.get<JournalResponse>('/api/progress/journal')

    expect(progress.recentRewards.map((entry) => [entry.label, entry.amount])).toEqual([
      ['Bonus sans faute\u00A0: Seconde', 10],
      ['Bonus d’avance\u00A0: Seconde', 10],
      ['Seconde', 100],
      ['Bonus sans faute\u00A0: Première', 10],
      ['Première', 100],
    ])
    expect(journal.body.entries).toHaveLength(5)
    expect(journal.body.entries.reduce((sum, entry) => sum + entry.amount, 0)).toBe(230)
  })
})

describe('entrée sur le podium', () => {
  it('s’annonce avec la quête qui y mène l’élève, une seule fois par semaine', async () => {
    const scene = await setup()
    const { admin, lea, tom } = scene
    const first = await publish(admin)
    const second = await publish(admin)

    // Tom valide le premier : il est seul en tête. Léa le rejoint ensuite, à la deuxième place.
    await answer(tom, first)
    scene.advance(HOUR)
    await answer(lea, first)
    const announced = await progressOf(lea)
    await lea.post('/api/progress/celebration/seen')
    // Sa deuxième quête la fait passer première : le podium, lui, a déjà été annoncé.
    await answer(lea, second)
    const sameWeek = await progressOf(lea)
    await lea.post('/api/progress/celebration/seen')

    expect(announced.celebration?.podium).toEqual({ rank: 2 })
    expect(sameWeek.celebration).toMatchObject({ xpGained: 110, podium: null })

    // La semaine suivante, le classement repart de zéro : une nouvelle entrée s'annonce.
    scene.advance(7 * DAY)
    const third = await publish(admin)
    await answer(lea, third)
    expect((await progressOf(lea)).celebration?.podium).toEqual({ rank: 1 })
  })

  it('ne s’annonce pas à un élève qui n’est pas dans les trois premiers', async () => {
    const scene = await setup()
    const { admin, lea, tom } = scene
    const ines = scene.client()
    const noa = scene.client()
    await ines.signUpStudent('Inès')
    await noa.signUpStudent('Noa')
    const first = await publish(admin)
    const second = await publish(admin)

    for (const student of [tom, ines, noa]) {
      await answer(student, first)
      await answer(student, second)
    }
    scene.advance(HOUR)
    await answer(lea, first)
    const fourth = await progressOf(lea)

    // Léa est quatrième : sa quête est fêtée, pas le podium.
    expect(fourth.celebration).toMatchObject({ xpGained: 110, podium: null })
    expect((await progressOf(tom)).celebration?.podium).toEqual({ rank: 1 })
  })

  it('ne s’annonce jamais seul, sans quête validée à fêter', async () => {
    const scene = await setup()
    const { admin, lea, tom, tomId } = scene
    const quest = await publish(admin)
    await answer(tom, quest)
    scene.advance(HOUR)
    await answer(lea, quest)
    await lea.post('/api/progress/celebration/seen')

    // Le compte de Tom est désactivé : Léa passe première sans rien avoir fait.
    await admin.patch(`/api/admin/students/${tomId}`, { isActive: false })

    expect((await progressOf(lea)).celebration).toBeNull()
  })
})

describe('série', () => {
  it('grandit d’un jour à chaque jour avec une quête validée', async () => {
    const scene = await setup()
    const { admin, lea } = scene

    for (let day = 0; day < 3; day += 1) {
      await answer(lea, await publish(admin, { assignees: [scene.leaId] }))
      scene.advance(DAY)
    }
    // Quatrième jour, pas encore de validation : la série tient toujours.
    await publish(admin, { assignees: [scene.leaId] })

    expect((await progressOf(lea)).streak).toEqual({ current: 3, best: 3 })
  })

  it('repart de zéro après un jour sans validation alors qu’une quête attendait', async () => {
    const scene = await setup()
    const { admin, lea } = scene
    await answer(lea, await publish(admin, { assignees: [scene.leaId] }))
    await publish(admin, { assignees: [scene.leaId] })

    scene.advance(2 * DAY)

    expect((await progressOf(lea)).streak).toEqual({ current: 0, best: 1 })
  })

  it('ne se casse pas un jour où l’élève n’avait aucune quête à faire', async () => {
    const scene = await setup()
    const { admin, lea } = scene
    await answer(lea, await publish(admin, { assignees: [scene.leaId] }))

    // Trois jours sans aucune quête, puis une nouvelle quête, validée le jour même.
    scene.advance(3 * DAY)
    await answer(lea, await publish(admin, { assignees: [scene.leaId] }))

    expect((await progressOf(lea)).streak).toEqual({ current: 2, best: 2 })
  })

  it('ne se casse pas pour une quête soumise qui attend l’admin', async () => {
    const scene = await setup()
    const { admin, lea } = scene
    await answer(lea, await publish(admin, { assignees: [scene.leaId] }))
    const essay = await publish(admin, {
      category: 'other',
      format: 'free_text',
      instructions: 'Résume.',
      items: [],
      assignees: [scene.leaId],
    })
    await lea.post(`/api/quests/${essay}/attempts`, { text: 'Rendu.' })

    scene.advance(2 * DAY)

    expect((await progressOf(lea)).streak).toEqual({ current: 1, best: 1 })
  })

  it('compte le jour de la soumission quand l’admin valide plus tard', async () => {
    const scene = await setup()
    const { admin, lea } = scene
    const essay = await publish(admin, {
      category: 'other',
      format: 'free_text',
      instructions: 'Résume.',
      items: [],
      assignees: [scene.leaId],
    })
    await lea.post(`/api/quests/${essay}/attempts`, { text: 'Rendu lundi.' })
    scene.advance(DAY)
    await answer(lea, await publish(admin, { assignees: [scene.leaId] }))
    const [pending] = (await admin.get<ValidationsResponse>('/api/admin/validations')).body
      .validations

    await admin.post(`/api/admin/assignments/${pending!.assignmentId}/validate`)

    // Lundi (soumission) et mardi (quête de maths) : deux jours de suite.
    expect((await progressOf(lea)).streak).toEqual({ current: 2, best: 2 })
  })
})

describe('badges', () => {
  it('attribue « Matheux » à la dixième quête de maths et « Sans faute » à la cinquième', async () => {
    const { admin, lea, leaId } = await setup()

    for (let count = 1; count <= 10; count += 1) {
      await answer(lea, await publish(admin, { assignees: [leaId] }))
      const badges = earned(await progressOf(lea))
      expect(badges.includes('flawless'), `sans faute après ${count}`).toBe(count >= 5)
      expect(badges.includes('maths'), `matheux après ${count}`).toBe(count >= 10)
    }
    const maths = (await progressOf(lea)).badges.find((badge) => badge.code === 'maths')
    expect(maths).toMatchObject({ done: 10, goal: 10 })
  })

  it('attribue « En avance » à la cinquième quête rendue plus de 24 h avant la deadline', async () => {
    const { admin, lea, leaId } = await setup()

    for (let count = 1; count <= 5; count += 1) {
      const questId = await publish(admin, {
        category: 'sport',
        format: 'declarative',
        manualValidation: false,
        instructions: 'Cours.',
        items: [],
        deadlineAt: '2026-11-27T10:00:00.000Z',
        assignees: [leaId],
      })
      await lea.post(`/api/quests/${questId}/attempts`, {})
      expect(earned(await progressOf(lea)).includes('early')).toBe(count >= 5)
    }
    const sport = (await progressOf(lea)).badges.find((badge) => badge.code === 'athlete')
    expect(sport).toMatchObject({ done: 5, goal: 10, earnedAt: null })
  })

  it('dit où en est l’élève pour chaque badge, sans rien attribuer d’avance', async () => {
    const { admin, lea, leaId } = await setup()
    await answer(lea, await publish(admin, { assignees: [leaId] }))

    const progress = await progressOf(lea)

    expect(Object.fromEntries(progress.badges.map((badge) => [badge.code, badge.done]))).toEqual({
      first_step: 1,
      regular: 1,
      unstoppable: 1,
      maths: 1,
      memory: 0,
      athlete: 0,
      early: 0,
      flawless: 1,
      podium: 0,
    })
  })
})

describe('ajustement manuel d’XP par l’admin', () => {
  it('ajoute une ligne au journal, positive ou négative, avec son motif', async () => {
    const { admin, lea, leaId } = await setup()

    const bonus = await admin.post<AdminStudentProgressResponse>(
      `/api/admin/students/${leaId}/xp`,
      { amount: 250, reason: 'Aide apportée à un camarade' },
    )
    const penalty = await admin.post<AdminStudentProgressResponse>(
      `/api/admin/students/${leaId}/xp`,
      { amount: -40, reason: 'Correction d’une erreur de saisie' },
    )

    expect(bonus.status).toBe(200)
    expect(bonus.body.progress).toMatchObject({ xp: 250, missions: 0, level: { level: 2 } })
    expect(penalty.body.progress.xp).toBe(210)
    expect(penalty.body.progress.journal.map((entry) => [entry.label, entry.amount])).toEqual([
      ['Correction d’une erreur de saisie', -40],
      ['Aide apportée à un camarade', 250],
    ])
    // L'élève le voit dans son journal ; ce n'est pas une mission.
    const progress = await progressOf(lea)
    expect(progress).toMatchObject({ xp: 210, missions: 0, celebration: null })
    expect(progress.recentRewards[0]).toMatchObject({ reason: 'manual', amount: -40 })
  })

  it('exige un montant non nul et un motif', async () => {
    const { admin, leaId } = await setup()
    const send = (body: unknown) =>
      admin.post<ApiErrorBody>(`/api/admin/students/${leaId}/xp`, body)

    const noReason = await send({ amount: 50, reason: '   ' })
    const zero = await send({ amount: 0, reason: 'Rien' })
    const tooMuch = await send({ amount: 10_001, reason: 'Trop' })
    const fraction = await send({ amount: 1.5, reason: 'Demi' })

    expect(noReason.body.error.fields).toEqual({ reason: 'Indiquez le motif de cet ajustement.' })
    expect(zero.body.error.fields).toEqual({ amount: 'Le montant ne peut pas être nul.' })
    expect(tooMuch.status).toBe(400)
    expect(fraction.status).toBe(400)
  })

  it('laisse l’XP totale descendre sous zéro sans descendre sous le niveau 1', async () => {
    const { admin, lea, leaId } = await setup()

    await admin.post(`/api/admin/students/${leaId}/xp`, { amount: -30, reason: 'Test' })

    expect(await progressOf(lea)).toMatchObject({
      xp: -30,
      level: { level: 1, xpInLevel: 0, xpRemaining: 100 },
    })
  })

  it('est réservé à l’admin', async () => {
    const { lea, tom, tomId, client } = await setup()
    const body = { amount: 500, reason: 'Pour moi' }

    expect((await lea.post(`/api/admin/students/${tomId}/xp`, body)).status).toBe(403)
    expect((await client().post(`/api/admin/students/${tomId}/xp`, body)).status).toBe(401)
    expect(await progressOf(tom)).toMatchObject({ xp: 0 })
  })
})

describe('annulation d’une validation', () => {
  it('retire l’XP par une ligne négative, décompte la mission et repasse la quête à Refusée', async () => {
    const { admin, lea, leaId } = await setup()
    const questId = await publish(admin, { title: 'Tables de 7', assignees: [leaId] })
    await answer(lea, questId)
    const detail = await admin.get<AdminQuestResponse>(`/api/admin/quests/${questId}`)
    const assignmentId = detail.body.quest.assignments[0]!.id

    const cancelled = await admin.post<AssignmentResponse>(
      `/api/admin/assignments/${assignmentId}/cancel`,
      { comment: 'Réponse recopiée.' },
    )

    expect(cancelled.status).toBe(200)
    expect(cancelled.body.assignment).toMatchObject({
      status: 'rejected',
      xpAwarded: null,
      validatedAt: null,
      adminComment: 'Réponse recopiée.',
    })
    const progress = await progressOf(lea)
    expect(progress).toMatchObject({ xp: 0, missions: 0, level: { level: 1 } })
    expect(progress.recentRewards.map((entry) => [entry.label, entry.amount])).toEqual([
      ['Validation annulée\u00A0: Tables de 7', -110],
      ['Bonus sans faute\u00A0: Tables de 7', 10],
      ['Tables de 7', 100],
    ])
    // Le badge déjà obtenu n'est pas retiré.
    expect(earned(progress)).toEqual(['first_step'])
    const mine = await lea.get<StudentQuestResponse>(`/api/quests/${questId}`)
    expect(mine.body.quest).toMatchObject({ status: 'rejected', adminComment: 'Réponse recopiée.' })
  })

  it('laisse l’élève recommencer, pour un seul nouveau crédit', async () => {
    const { admin, lea, leaId } = await setup()
    const questId = await publish(admin, { assignees: [leaId] })
    await answer(lea, questId)
    const detail = await admin.get<AdminQuestResponse>(`/api/admin/quests/${questId}`)
    const assignmentId = detail.body.quest.assignments[0]!.id
    await admin.post(`/api/admin/assignments/${assignmentId}/cancel`, {})

    const again = await answer(lea, questId)
    const replay = await answer(lea, questId)

    expect(again.body.quest).toMatchObject({ status: 'validated', xpAwarded: 100 })
    expect(replay.status).toBe(409)
    // 110 gagnés, 110 retirés, 100 regagnés (plus de bonus sans faute au deuxième essai).
    expect(await progressOf(lea)).toMatchObject({ xp: 100, missions: 1 })
  })

  it('ne s’applique qu’à une quête validée', async () => {
    const { admin, leaId } = await setup()
    const questId = await publish(admin, { assignees: [leaId] })
    const detail = await admin.get<AdminQuestResponse>(`/api/admin/quests/${questId}`)

    const response = await admin.post<ApiErrorBody>(
      `/api/admin/assignments/${detail.body.quest.assignments[0]!.id}/cancel`,
      {},
    )

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('not_validated')
  })
})

describe('fiche et liste des élèves côté admin', () => {
  it('donnent le niveau, l’XP et les missions de chaque élève', async () => {
    const { admin, lea, leaId, tomId } = await setup()
    await answer(lea, await publish(admin))

    const list = await admin.get<AdminStudentsResponse>('/api/admin/students')
    const one = await admin.get<AdminStudentResponse>(`/api/admin/students/${leaId}`)

    expect(list.body.students.map((s) => [s.id, s.xp, s.level, s.missions])).toEqual([
      [leaId, 110, 2, 1],
      [tomId, 0, 1, 0],
    ])
    expect(one.body.student).toMatchObject({ xp: 110, level: 2, missions: 1 })
  })

  it('montrent les quêtes de l’élève avec leur statut, son journal, sa série et ses badges', async () => {
    const { admin, lea, leaId } = await setup()
    const done = await publish(admin, { title: 'Faite' })
    await publish(admin, { title: 'À faire' })
    await answer(lea, done)

    const response = await admin.get<AdminStudentProgressResponse>(
      `/api/admin/students/${leaId}/progress`,
    )

    expect(response.status).toBe(200)
    const { progress } = response.body
    expect(progress).toMatchObject({ xp: 110, missions: 1, streak: { current: 1, best: 1 } })
    expect(progress.assignments.map((a) => [a.quest.title, a.status, a.xpAwarded])).toEqual([
      ['À faire', 'todo', null],
      ['Faite', 'validated', 110],
    ])
    expect(progress.journal).toHaveLength(2)
    expect(progress.badges.find((badge) => badge.code === 'first_step')?.earnedAt).toBeTruthy()
    expect((await admin.get('/api/admin/students/inconnu/progress')).status).toBe(404)
  })
})

describe('avatar', () => {
  it('se choisit dans la galerie fournie', async () => {
    const { lea } = await setup()

    const changed = await lea.patch<SessionResponse>('/api/account/avatar', { avatar: 'owl' })
    const refused = await lea.patch<ApiErrorBody>('/api/account/avatar', { avatar: 'photo.png' })

    expect(changed.status).toBe(200)
    expect(changed.body.user?.avatar).toBe('owl')
    expect((await lea.currentUser())?.avatar).toBe('owl')
    expect(refused.status).toBe(400)
    expect(refused.body.error.fields).toEqual({
      avatar: 'Cet avatar ne fait pas partie de la galerie.',
    })
  })

  it('demande d’être connecté', async () => {
    const { client } = await setup()

    expect((await client().patch('/api/account/avatar', { avatar: 'owl' })).status).toBe(401)
  })
})
