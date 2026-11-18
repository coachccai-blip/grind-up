import { describe, expect, it } from 'vitest'
import type {
  AdminStudentResponse,
  AdminStudentsResponse,
  TemporaryPasswordResponse,
} from '../../shared/schemas/admin.js'
import type { SessionResponse } from '../../shared/schemas/auth.js'
import type { ApiErrorBody } from '../../shared/schemas/errors.js'
import { createTestApp, HOUR } from '../helpers/test-app.js'

const PASSWORD = 'motdepasse-solide'

async function setup() {
  const testApp = createTestApp()
  const admin = testApp.client()
  await admin.signUpAdmin('Coach')
  const lea = await testApp.client().signUpStudent('Léa', PASSWORD)
  const tom = await testApp.client().signUpStudent('Tom', PASSWORD)
  return { ...testApp, admin, lea, tom }
}

describe('liste des élèves', () => {
  it('montre les élèves avec leur identifiant, sans les admins', async () => {
    const { admin, lea, tom } = await setup()

    const response = await admin.get<AdminStudentsResponse>('/api/admin/students')

    expect(response.status).toBe(200)
    expect(response.body.students.map((student) => student.pseudo)).toEqual(['Léa', 'Tom'])
    expect(response.body.students[0]).toEqual({
      id: lea.id,
      pseudo: 'Léa',
      publicId: lea.publicId,
      avatar: lea.avatar,
      isActive: true,
      createdAt: '2026-11-17T10:00:00.000Z',
      lastActiveAt: '2026-11-17T10:00:00.000Z',
    })
    expect(response.body.students[1]?.id).toBe(tom.id)
  })

  it('ne renvoie jamais d’empreinte de mot de passe', async () => {
    const { admin, lea } = await setup()

    const list = await admin.get('/api/admin/students')
    const one = await admin.get(`/api/admin/students/${lea.id}`)

    expect(JSON.stringify([list.body, one.body])).not.toMatch(/scrypt|password/i)
  })

  it('suit la dernière activité de chaque élève', async () => {
    const { admin, client, advance } = await setup()
    const lea = client()
    await lea.post('/api/auth/login', { login: 'Léa', password: PASSWORD })

    advance(2 * HOUR)
    await lea.currentUser()

    const { students } = (await admin.get<AdminStudentsResponse>('/api/admin/students')).body
    expect(students.find((student) => student.pseudo === 'Léa')?.lastActiveAt).toBe(
      '2026-11-17T12:00:00.000Z',
    )
    expect(students.find((student) => student.pseudo === 'Tom')?.lastActiveAt).toBe(
      '2026-11-17T10:00:00.000Z',
    )
  })
})

describe('fiche d’un élève', () => {
  it('répond 404 pour un élève inconnu ou pour un admin', async () => {
    const { admin } = await setup()
    const coach = await admin.currentUser()

    const unknown = await admin.get<ApiErrorBody>('/api/admin/students/inconnu')
    const anAdmin = await admin.get<ApiErrorBody>(`/api/admin/students/${coach!.id}`)

    expect(unknown.status).toBe(404)
    expect(unknown.body.error.message).toBe('Cet élève est introuvable.')
    expect(anAdmin.status).toBe(404)
  })

  it('permet de renommer un élève, qui se connecte ensuite avec son nouveau pseudo', async () => {
    const { admin, client, lea } = await setup()

    const response = await admin.patch<AdminStudentResponse>(`/api/admin/students/${lea.id}`, {
      pseudo: 'Léonie',
    })

    expect(response.status).toBe(200)
    expect(response.body.student).toMatchObject({ pseudo: 'Léonie', publicId: lea.publicId })
    const login = await client().post('/api/auth/login', { login: 'leonie', password: PASSWORD })
    expect(login.status).toBe(200)
    const oldPseudo = await client().post('/api/auth/login', { login: 'Léa', password: PASSWORD })
    expect(oldPseudo.status).toBe(401)
  })

  it('refuse un nouveau pseudo déjà pris ou invalide', async () => {
    const { admin, lea } = await setup()

    const taken = await admin.patch<ApiErrorBody>(`/api/admin/students/${lea.id}`, {
      pseudo: 'TOM',
    })
    const invalid = await admin.patch<ApiErrorBody>(`/api/admin/students/${lea.id}`, {
      pseudo: 'x',
    })
    const sameWithNewCase = await admin.patch(`/api/admin/students/${lea.id}`, { pseudo: 'LÉA' })
    const nothing = await admin.patch(`/api/admin/students/${lea.id}`, {})

    expect(taken.status).toBe(409)
    expect(taken.body.error.fields).toEqual({ pseudo: 'Ce pseudo est déjà pris.' })
    expect(invalid.status).toBe(400)
    // Changer seulement les majuscules de son propre pseudo est permis.
    expect(sameWithNewCase.status).toBe(200)
    expect(nothing.status).toBe(400)
  })

  it('ne modifie jamais l’identifiant d’un élève', async () => {
    const { admin, lea } = await setup()

    await admin.patch(`/api/admin/students/${lea.id}`, { pseudo: 'Léonie', publicId: 'AAAA-AAAA' })

    const { student } = (await admin.get<AdminStudentResponse>(`/api/admin/students/${lea.id}`))
      .body
    expect(student.publicId).toBe(lea.publicId)
  })
})

describe('mot de passe temporaire', () => {
  it('remplace le mot de passe oublié et oblige à en choisir un nouveau', async () => {
    const { admin, client, lea } = await setup()
    const forgetful = client()
    await forgetful.post('/api/auth/login', { login: 'Léa', password: PASSWORD })

    const generated = await admin.post<TemporaryPasswordResponse>(
      `/api/admin/students/${lea.id}/temporary-password`,
    )
    const temporary = generated.body.temporaryPassword
    expect(generated.status).toBe(200)
    expect(temporary).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/)

    // L'ancien mot de passe et les sessions ouvertes ne valent plus rien.
    expect(await forgetful.currentUser()).toBeNull()
    expect(
      (await client().post('/api/auth/login', { login: 'Léa', password: PASSWORD })).status,
    ).toBe(401)

    // Avec le mot de passe temporaire, l'élève se connecte mais doit en changer.
    const login = await forgetful.post<SessionResponse>('/api/auth/login', {
      login: lea.publicId,
      password: temporary,
    })
    expect(login.body.user?.mustChangePassword).toBe(true)

    // Il choisit son nouveau mot de passe sans ressaisir le temporaire.
    const changed = await forgetful.post<SessionResponse>('/api/account/password', {
      newPassword: 'mon-nouveau-secret',
    })
    expect(changed.status).toBe(200)
    expect(changed.body.user?.mustChangePassword).toBe(false)
    expect(
      (await client().post('/api/auth/login', { login: 'Léa', password: temporary })).status,
    ).toBe(401)
    expect(
      (await client().post('/api/auth/login', { login: 'Léa', password: 'mon-nouveau-secret' }))
        .status,
    ).toBe(200)
  })

  it('n’existe que pour un élève connu', async () => {
    const { admin } = await setup()

    const response = await admin.post('/api/admin/students/inconnu/temporary-password')

    expect(response.status).toBe(404)
  })
})

describe('suppression d’un élève', () => {
  it('efface le compte, libère le pseudo et ferme la session', async () => {
    const { admin, client, lea } = await setup()
    const student = client()
    await student.post('/api/auth/login', { login: 'Léa', password: PASSWORD })

    const response = await admin.delete(`/api/admin/students/${lea.id}`)

    expect(response.status).toBe(204)
    expect(await student.currentUser()).toBeNull()
    const { students } = (await admin.get<AdminStudentsResponse>('/api/admin/students')).body
    expect(students.map((entry) => entry.pseudo)).toEqual(['Tom'])
    expect((await admin.delete(`/api/admin/students/${lea.id}`)).status).toBe(404)
    // Le pseudo redevient disponible.
    expect((await client().signUpStudent('Léa')).id).not.toBe(lea.id)
  })

  it('ne peut pas supprimer un admin', async () => {
    const { admin } = await setup()
    const coach = await admin.currentUser()

    const response = await admin.delete(`/api/admin/students/${coach!.id}`)

    expect(response.status).toBe(404)
    expect(await admin.currentUser()).not.toBeNull()
  })
})
