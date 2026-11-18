import { describe, expect, it } from 'vitest'
import type { ApiErrorBody } from '../../shared/schemas/errors.js'
import type { AdminQuestResponse, StudentQuestResponse } from '../../shared/schemas/quests.js'
import { createTestApp, type TestClient } from '../helpers/test-app.js'

/** Un PNG d'un pixel, et son encodage en adresse « data: ». */
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const PNG = `data:image/png;base64,${PNG_BASE64}`
const base64 = (bytes: number[]) => Buffer.from(bytes).toString('base64')

async function setup() {
  const testApp = createTestApp()
  const admin = testApp.client()
  await admin.signUpAdmin('Coach')
  const lea = testApp.client()
  const tom = testApp.client()
  const leaId = (await lea.signUpStudent('Léa')).id
  await tom.signUpStudent('Tom')
  const created = await admin.post<AdminQuestResponse>('/api/admin/quests', {
    title: 'Observe la carte',
    instructions: 'Regarde l’image, puis réponds.',
    category: 'other',
    format: 'declarative',
    difficulty: 'easy',
    rewardXp: 50,
    manualValidation: false,
    assignees: [leaId],
    publish: true,
  })
  return { ...testApp, admin, lea, tom, quest: created.body.quest }
}

/** Lit une image telle que la sert l'API. */
async function fetchImage(
  testApp: Awaited<ReturnType<typeof setup>>,
  who: TestClient,
  url: string,
) {
  const response = await testApp.app.request(
    `https://grind-up.test${url}`,
    { headers: who.cookie ? { cookie: `gu_session=${who.cookie}` } : {} },
    { ip: '203.0.113.10', deployContext: 'production', local: false },
  )
  return {
    status: response.status,
    type: response.headers.get('content-type'),
    cache: response.headers.get('cache-control'),
    sniff: response.headers.get('x-content-type-options'),
    bytes: new Uint8Array(await response.arrayBuffer()),
  }
}

describe('image de la consigne', () => {
  it('s’enregistre à côté de la base et se sert à l’admin comme à l’élève assigné', async () => {
    const scene = await setup()
    const { admin, lea, quest, store } = scene

    expect(quest.imageUrl).toBeNull()
    const saved = await admin.put<AdminQuestResponse>(`/api/admin/quests/${quest.id}/image`, {
      dataUrl: PNG,
    })

    expect(saved.status).toBe(200)
    expect(saved.body.quest.imageUrl).toMatch(
      new RegExp(`^/api/admin/quests/${quest.id}/image\\?v=[0-9a-f-]{36}$`),
    )
    expect(await store.list('images/')).toHaveLength(1)

    const forAdmin = await fetchImage(scene, admin, saved.body.quest.imageUrl!)
    expect(forAdmin).toMatchObject({
      status: 200,
      type: 'image/png',
      cache: 'private, max-age=31536000, immutable',
      sniff: 'nosniff',
    })
    expect(Buffer.from(forAdmin.bytes).toString('base64')).toBe(PNG_BASE64)

    const mine = await lea.get<StudentQuestResponse>(`/api/quests/${quest.id}`)
    expect(mine.body.quest.imageUrl).toMatch(new RegExp(`^/api/quests/${quest.id}/image\\?v=`))
    const forStudent = await fetchImage(scene, lea, mine.body.quest.imageUrl!)
    expect(forStudent.status).toBe(200)
    expect(forStudent.type).toBe('image/png')
  })

  it('n’est servie ni à un visiteur ni à un élève qui n’a pas la quête', async () => {
    const scene = await setup()
    const { admin, tom, quest, client } = scene
    await admin.put(`/api/admin/quests/${quest.id}/image`, { dataUrl: PNG })

    const asVisitor = await fetchImage(scene, client(), `/api/quests/${quest.id}/image`)
    const asOther = await fetchImage(scene, tom, `/api/quests/${quest.id}/image`)
    const adminRouteAsStudent = await fetchImage(scene, tom, `/api/admin/quests/${quest.id}/image`)

    expect(asVisitor.status).toBe(401)
    expect(asOther.status).toBe(404)
    expect(adminRouteAsStudent.status).toBe(403)
  })

  it('refuse ce qui n’est pas une image JPEG, PNG ou WebP de taille raisonnable', async () => {
    const { admin, quest, store } = await setup()
    const send = (dataUrl: string) =>
      admin.put<ApiErrorBody>(`/api/admin/quests/${quest.id}/image`, { dataUrl })

    const svg = await send(`data:image/svg+xml;base64,${base64([0x3c, 0x73, 0x76, 0x67])}`)
    const gif = await send(`data:image/gif;base64,${base64([0x47, 0x49, 0x46, 0x38])}`)
    // Un script qui se dit PNG : son contenu ne commence pas comme un PNG.
    const disguised = await send(`data:image/png;base64,${base64([0x3c, 0x73, 0x63, 0x72, 0x69])}`)
    const notBase64 = await send('data:image/png;base64,<script>')
    const tooBig = await send(
      `data:image/png;base64,${Buffer.concat([Buffer.from(PNG_BASE64, 'base64'), Buffer.alloc(1_500_000)]).toString('base64')}`,
    )

    for (const response of [svg, gif, disguised, notBase64, tooBig]) {
      expect(response.status).toBe(400)
      expect(response.body.error.fields?.image ?? response.body.error.fields?.dataUrl).toBeTruthy()
    }
    expect(svg.body.error.message).toBe('Choisissez une image au format JPEG, PNG ou WebP.')
    expect(disguised.body.error.message).toBe('Ce fichier n’est pas une image lisible.')
    expect(await store.list('images/')).toEqual([])
  })

  it('remplace l’image précédente, puis se retire', async () => {
    const { admin, quest, store } = await setup()
    const first = await admin.put<AdminQuestResponse>(`/api/admin/quests/${quest.id}/image`, {
      dataUrl: PNG,
    })
    const second = await admin.put<AdminQuestResponse>(`/api/admin/quests/${quest.id}/image`, {
      dataUrl: PNG,
    })

    // L'adresse change avec l'image, et l'ancien fichier est effacé.
    expect(second.body.quest.imageUrl).not.toBe(first.body.quest.imageUrl)
    expect(await store.list('images/')).toHaveLength(1)

    const removed = await admin.delete<AdminQuestResponse>(`/api/admin/quests/${quest.id}/image`)
    expect(removed.body.quest.imageUrl).toBeNull()
    expect(await store.list('images/')).toEqual([])
  })

  it('donne à une quête dupliquée sa propre copie de l’image', async () => {
    const { admin, quest, store } = await setup()
    await admin.put(`/api/admin/quests/${quest.id}/image`, { dataUrl: PNG })

    const copy = await admin.post<AdminQuestResponse>(`/api/admin/quests/${quest.id}/duplicate`)

    expect(copy.body.quest.imageUrl).toContain(`/api/admin/quests/${copy.body.quest.id}/image`)
    expect(await store.list('images/')).toHaveLength(2)
    // Supprimer le brouillon efface sa copie, pas l'image de l'original.
    await admin.delete(`/api/admin/quests/${copy.body.quest.id}`)
    expect(await store.list(`images/${quest.id}/`)).toHaveLength(1)
    expect(await store.list('images/')).toHaveLength(1)
  })

  it('reste modifiable une fois qu’un élève a répondu', async () => {
    const { admin, lea, quest } = await setup()
    await lea.post(`/api/quests/${quest.id}/attempts`, { comment: 'Fait' })

    const saved = await admin.put<AdminQuestResponse>(`/api/admin/quests/${quest.id}/image`, {
      dataUrl: PNG,
    })

    expect(saved.status).toBe(200)
    expect(saved.body.quest.locked).toBe(true)
  })

  it('répond 404 pour une quête inconnue ou sans image', async () => {
    const scene = await setup()
    const { admin, lea, quest } = scene

    expect((await fetchImage(scene, admin, `/api/admin/quests/${quest.id}/image`)).status).toBe(404)
    expect((await fetchImage(scene, lea, `/api/quests/${quest.id}/image`)).status).toBe(404)
    const unknown = await admin.put('/api/admin/quests/inconnue/image', { dataUrl: PNG })
    expect(unknown.status).toBe(404)
  })
})
