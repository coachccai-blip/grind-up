import { describe, expect, it } from 'vitest'
import type { ApiErrorBody } from '../../shared/schemas/errors.js'
import { createTestApp } from '../helpers/test-app.js'

/** Corps à envoyer avec une méthode : aucun pour une lecture. */
const bodyFor = (method: string) => (method === 'GET' || method === 'HEAD' ? undefined : {})

/**
 * Droits d'accès par rôle. Les routes sont lues dans l'application elle-même :
 * toute route ajoutée plus tard sous /api/admin est vérifiée sans toucher à ce test.
 */
function adminRoutes(app: ReturnType<typeof createTestApp>['app']) {
  const routes = app.routes
    .filter((route) => route.method !== 'ALL' && route.path.startsWith('/api/admin'))
    .map((route) => ({
      method: route.method,
      path: route.path.replace(/:\w+/g, '00000000-0000-4000-8000-000000000000'),
    }))
  return [...new Map(routes.map((route) => [`${route.method} ${route.path}`, route])).values()]
}

/** Routes réservées aux élèves : leurs quêtes et leur progression. Même principe. */
function studentRoutes(app: ReturnType<typeof createTestApp>['app']) {
  const routes = app.routes
    .filter(
      (route) =>
        route.method !== 'ALL' &&
        (route.path.startsWith('/api/quests') || route.path.startsWith('/api/progress')),
    )
    .map((route) => ({
      method: route.method,
      path: route.path.replace(/:\w+/g, '00000000-0000-4000-8000-000000000000'),
    }))
  return [...new Map(routes.map((route) => [`${route.method} ${route.path}`, route])).values()]
}

describe('quêtes et progression des élèves', () => {
  it('compte bien des routes à protéger', () => {
    const { app } = createTestApp()

    const paths = studentRoutes(app).map((route) => route.path)
    expect(paths.length).toBeGreaterThanOrEqual(8)
    expect(paths.some((path) => path.startsWith('/api/progress'))).toBe(true)
  })

  it('sont fermées à un visiteur non connecté et à un admin, sur toutes leurs routes', async () => {
    const { app, client } = createTestApp()
    const admin = client()
    await admin.signUpAdmin()

    for (const route of studentRoutes(app)) {
      const label = `${route.method} ${route.path}`
      const asVisitor = await client().request<ApiErrorBody>(
        route.method,
        route.path,
        bodyFor(route.method),
      )
      const asAdmin = await admin.request<ApiErrorBody>(
        route.method,
        route.path,
        bodyFor(route.method),
      )
      expect(asVisitor.status, label).toBe(401)
      expect(asAdmin.status, label).toBe(403)
    }
  })

  it('restent fermées tant qu’un mot de passe temporaire n’a pas été remplacé', async () => {
    const { client } = createTestApp()
    const admin = client()
    const student = client()
    await admin.signUpAdmin()
    const lea = await student.signUpStudent('Léa')
    const temporary = await admin.post<{ temporaryPassword: string }>(
      `/api/admin/students/${lea.id}/temporary-password`,
    )
    await student.post('/api/auth/login', {
      login: 'Léa',
      password: temporary.body.temporaryPassword,
    })

    const response = await student.get<ApiErrorBody>('/api/quests')

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('password_change_required')
  })
})

describe('espace admin', () => {
  it('compte bien des routes à protéger', () => {
    const { app } = createTestApp()

    expect(adminRoutes(app).length).toBeGreaterThanOrEqual(5)
  })

  it('est fermé à un visiteur non connecté', async () => {
    const { app, client } = createTestApp()

    for (const route of adminRoutes(app)) {
      const response = await client().request<ApiErrorBody>(
        route.method,
        route.path,
        bodyFor(route.method),
      )
      expect(response.status, `${route.method} ${route.path}`).toBe(401)
      expect(response.body.error.code).toBe('unauthenticated')
    }
  })

  it('est fermé à un élève, sur toutes ses routes', async () => {
    const { app, client } = createTestApp()
    const student = client()
    await student.signUpStudent('Léa')

    for (const route of adminRoutes(app)) {
      const response = await student.request<ApiErrorBody>(
        route.method,
        route.path,
        bodyFor(route.method),
      )
      expect(response.status, `${route.method} ${route.path}`).toBe(403)
      expect(response.body.error).toEqual({ code: 'forbidden', message: 'Accès refusé.' })
    }
  })

  it('est fermé à un élève même pour une adresse admin qui n’existe pas', async () => {
    const { client } = createTestApp()
    const student = client()
    await student.signUpStudent('Léa')

    const response = await student.get('/api/admin/nimporte-quoi')

    expect(response.status).toBe(403)
  })

  it('est ouvert à un admin', async () => {
    const { app, client } = createTestApp()
    const admin = client()
    await admin.signUpAdmin()

    for (const route of adminRoutes(app)) {
      const response = await admin.request(route.method, route.path, bodyFor(route.method))
      expect([401, 403], `${route.method} ${route.path}`).not.toContain(response.status)
    }
  })

  it('ne se laisse pas ouvrir par un élève qui se dit admin', async () => {
    const { client } = createTestApp()
    const student = client()
    await student.signUpStudent('Léa')

    const response = await student.request('GET', '/api/admin/students', undefined, {
      'x-role': 'admin',
      'x-user-role': 'admin',
    })

    expect(response.status).toBe(403)
  })
})

describe('comptes désactivés et bots', () => {
  it('refuse la connexion d’un compte désactivé et ferme ses sessions', async () => {
    const { client } = createTestApp()
    const admin = client()
    const student = client()
    await admin.signUpAdmin()
    const lea = await student.signUpStudent('Léa', 'motdepasse-solide')

    await admin.patch(`/api/admin/students/${lea.id}`, { isActive: false })

    expect(await student.currentUser()).toBeNull()
    const login = await client().post<ApiErrorBody>('/api/auth/login', {
      login: 'Léa',
      password: 'motdepasse-solide',
    })
    expect(login.status).toBe(403)
    expect(login.body.error).toEqual({
      code: 'account_disabled',
      message: 'Ce compte est désactivé. Contacte ton accompagnant.',
    })

    // Avec un mauvais mot de passe, rien n'indique que le compte existe ou qu'il est désactivé.
    const wrong = await client().post<ApiErrorBody>('/api/auth/login', {
      login: 'Léa',
      password: 'pas-le-bon',
    })
    expect(wrong.body.error.code).toBe('invalid_credentials')

    // Réactivé, le compte retrouve ses données et peut se reconnecter.
    await admin.patch(`/api/admin/students/${lea.id}`, { isActive: true })
    const back = await client().post('/api/auth/login', {
      login: 'Léa',
      password: 'motdepasse-solide',
    })
    expect(back.status).toBe(200)
  })

  it('ne laisse pas un bot se connecter', async () => {
    const { client, database } = createTestApp()
    await client().signUpStudent('Léa')
    // Un bot est un faux participant, sans mot de passe ni identifiant.
    await database().write((tx) =>
      tx.run(
        `INSERT INTO users (id, role, pseudo, pseudo_key, avatar, created_at)
         VALUES ('bot-1', 'bot', 'RoboQuête', 'roboquete', 'fox', '2026-11-17T10:00:00.000Z')`,
      ),
    )

    const response = await client().post<ApiErrorBody>('/api/auth/login', {
      login: 'RoboQuête',
      password: 'peu-importe',
    })

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('invalid_credentials')
  })
})
