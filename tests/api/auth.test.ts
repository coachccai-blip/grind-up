import { describe, expect, it } from 'vitest'
import { PUBLIC_ID_PATTERN } from '../../shared/rules/public-id.js'
import type { SessionResponse } from '../../shared/schemas/auth.js'
import type { ApiErrorBody } from '../../shared/schemas/errors.js'
import { createTestApp, DAY, HOUR, MINUTE } from '../helpers/test-app.js'

const PASSWORD = 'motdepasse-solide'

describe('inscription d’un élève', () => {
  it('crée un compte élève avec un identifiant XXXX-XXXX et ouvre la session', async () => {
    const { client } = createTestApp()
    const browser = client()

    const response = await browser.post<SessionResponse>('/api/auth/signup', {
      pseudo: 'Léa',
      password: PASSWORD,
    })

    expect(response.status).toBe(201)
    expect(response.body.user).toMatchObject({
      role: 'student',
      pseudo: 'Léa',
      mustChangePassword: false,
    })
    expect(response.body.user?.publicId).toMatch(PUBLIC_ID_PATTERN)
    expect(await browser.currentUser()).toEqual(response.body.user)
  })

  it('donne à chaque élève un identifiant différent', async () => {
    const { client } = createTestApp()
    const identifiers = new Set<string>()

    for (const pseudo of ['Ana', 'Ben', 'Cléo', 'Dan', 'Eva', 'Fred']) {
      identifiers.add((await client().signUpStudent(pseudo)).publicId!)
    }

    expect(identifiers.size).toBe(6)
  })

  it('refuse un pseudo déjà pris, sans tenir compte des majuscules ni des accents', async () => {
    const { client } = createTestApp()
    await client().signUpStudent('Léa')

    for (const pseudo of ['Léa', 'LÉA', 'lea']) {
      const response = await client().post<ApiErrorBody>('/api/auth/signup', {
        pseudo,
        password: PASSWORD,
      })
      expect(response.status).toBe(409)
      expect(response.body.error).toMatchObject({
        code: 'pseudo_taken',
        fields: { pseudo: 'Ce pseudo est déjà pris.' },
      })
    }
  })

  it('valide le pseudo et le mot de passe côté serveur', async () => {
    const { client } = createTestApp()

    const response = await client().post<ApiErrorBody>('/api/auth/signup', {
      pseudo: 'a b',
      password: 'court',
    })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('invalid_input')
    expect(response.body.error.fields).toEqual({
      pseudo:
        'Le pseudo ne peut contenir que des lettres, des chiffres, des tirets et des tirets bas.',
      password: 'Le mot de passe doit faire entre 8 et 128 caractères.',
    })
    expect(await client().currentUser()).toBeNull()
  })

  it('limite les inscriptions à 20 par heure et par adresse IP', async () => {
    const { client, advance } = createTestApp()
    for (let index = 0; index < 20; index += 1) await client().signUpStudent(`eleve${index}`)

    const blocked = await client().post<ApiErrorBody>('/api/auth/signup', {
      pseudo: 'eleve20',
      password: PASSWORD,
    })
    expect(blocked.status).toBe(429)
    expect(blocked.body.error.code).toBe('too_many_attempts')
    expect(blocked.headers.get('retry-after')).toBeTruthy()

    // Une autre adresse n'est pas concernée, et la limite se lève à l'heure suivante.
    await client({ ip: '198.51.100.7' }).signUpStudent('ailleurs')
    advance(HOUR)
    await client().signUpStudent('eleve20')
  })
})

describe('code admin', () => {
  it('crée un compte admin, sans identifiant XXXX-XXXX, avec le code SuperAdmin', async () => {
    const { client } = createTestApp()

    const admin = await client().signUpAdmin('Coach', 'SuperAdmin')

    expect(admin).toMatchObject({ role: 'admin', pseudo: 'Coach', publicId: null })
  })

  it('ne crée jamais de compte admin sans code', async () => {
    const { client } = createTestApp()

    for (const specialCode of [undefined, '', '   ']) {
      const response = await client().post<SessionResponse>('/api/auth/signup', {
        pseudo: `eleve${String(specialCode).length}`,
        password: PASSWORD,
        specialCode,
      })
      expect(response.body.user?.role).toBe('student')
    }
  })

  it('ne crée aucun compte avec un mauvais code, et répond par un message générique', async () => {
    const { client } = createTestApp()
    const browser = client()

    for (const specialCode of ['superadmin', 'SuperAdmin ', 'admin', 'SuperAdmi']) {
      const response = await browser.post<ApiErrorBody>('/api/auth/signup', {
        pseudo: 'Intrus',
        password: PASSWORD,
        specialCode: specialCode === 'SuperAdmin ' ? 'SuperAdmin x' : specialCode,
      })
      expect(response.status).toBe(400)
      expect(response.body.error).toEqual({
        code: 'signup_rejected',
        message: 'Inscription impossible avec ces informations.',
      })
    }

    // Aucun compte « Intrus » n'existe : le pseudo est toujours libre.
    expect(await browser.currentUser()).toBeNull()
    expect((await client().signUpStudent('Intrus')).role).toBe('student')
  })

  it('limite les essais de code à 5 par heure et par adresse IP', async () => {
    const { client, advance } = createTestApp()
    const attempt = (specialCode: string, ip?: string) =>
      client({ ip }).post<ApiErrorBody>('/api/auth/signup', {
        pseudo: 'Coach',
        password: PASSWORD,
        specialCode,
      })

    for (let index = 0; index < 5; index += 1) {
      expect((await attempt(`essai-${index}`)).status).toBe(400)
    }

    // Sixième essai : refusé même avec le bon code.
    const blocked = await attempt('SuperAdmin')
    expect(blocked.status).toBe(429)
    expect(blocked.body.error.message).toMatch(
      /^Trop de tentatives\. Nouvel essai possible dans \d+ minutes?\.$/,
    )

    // Une inscription sans code reste possible, comme un essai depuis une autre adresse.
    await client().signUpStudent('Léa')
    expect((await attempt('SuperAdmin', '198.51.100.7')).status).toBe(201)

    advance(HOUR)
    expect((await attempt('SuperAdmin')).status).toBe(409)
  })

  it('se remplace par la variable ADMIN_SIGNUP_CODE', async () => {
    const { loadConfig } = await import('../../server/config.js')
    const { client } = createTestApp({
      adminSignupCode: loadConfig({ ADMIN_SIGNUP_CODE: 'code-du-coach' }).adminSignupCode,
    })

    const refused = await client().post<ApiErrorBody>('/api/auth/signup', {
      pseudo: 'Coach',
      password: PASSWORD,
      specialCode: 'SuperAdmin',
    })
    expect(refused.status).toBe(400)

    expect((await client().signUpAdmin('Coach', 'code-du-coach')).role).toBe('admin')
    expect(loadConfig({}).adminSignupCode).toBe('SuperAdmin')
    expect(loadConfig({ ADMIN_SIGNUP_CODE: '  ' }).adminSignupCode).toBe('SuperAdmin')
  })
})

describe('connexion', () => {
  it('accepte le pseudo ou l’identifiant, avec le mot de passe', async () => {
    const { client } = createTestApp()
    const lea = await client().signUpStudent('Léa', PASSWORD)

    for (const login of [
      'Léa',
      'lea',
      ' LÉA ',
      lea.publicId!,
      lea.publicId!.toLowerCase().replace('-', ''),
    ]) {
      const browser = client()
      const response = await browser.post<SessionResponse>('/api/auth/login', {
        login,
        password: PASSWORD,
      })
      expect(response.status, login).toBe(200)
      expect(response.body.user?.id).toBe(lea.id)
      expect((await browser.currentUser())?.id).toBe(lea.id)
    }
  })

  it('répond le même message pour un mauvais mot de passe et un compte inconnu', async () => {
    const { client } = createTestApp()
    await client().signUpStudent('Léa', PASSWORD)

    const wrongPassword = await client().post<ApiErrorBody>('/api/auth/login', {
      login: 'Léa',
      password: 'mauvais-mot-de-passe',
    })
    const unknownAccount = await client().post<ApiErrorBody>('/api/auth/login', {
      login: 'Personne',
      password: PASSWORD,
    })

    expect(wrongPassword.status).toBe(401)
    expect(unknownAccount.status).toBe(401)
    expect(wrongPassword.body).toEqual(unknownAccount.body)
    expect(wrongPassword.body.error.message).toBe('Identifiant ou mot de passe incorrect.')
  })

  it('bloque une adresse IP après 10 échecs en un quart d’heure', async () => {
    const { client, advance } = createTestApp()
    await client().signUpStudent('Léa', PASSWORD)
    const tryLogin = (password: string, ip?: string) =>
      client({ ip }).post<ApiErrorBody>('/api/auth/login', { login: 'Léa', password })

    for (let index = 0; index < 10; index += 1) {
      expect((await tryLogin('mauvais-mot-de-passe')).status).toBe(401)
    }

    // Même le bon mot de passe est refusé tant que l'adresse est bloquée.
    expect((await tryLogin(PASSWORD)).status).toBe(429)
    expect((await tryLogin(PASSWORD, '198.51.100.7')).status).toBe(200)

    advance(15 * MINUTE)
    expect((await tryLogin(PASSWORD)).status).toBe(200)
  })

  it('ne compte pas les connexions réussies comme des échecs', async () => {
    const { client } = createTestApp()
    await client().signUpStudent('Léa', PASSWORD)

    for (let index = 0; index < 15; index += 1) {
      const response = await client().post('/api/auth/login', { login: 'Léa', password: PASSWORD })
      expect(response.status).toBe(200)
    }
  })

  it('exige un identifiant et un mot de passe', async () => {
    const { client } = createTestApp()

    const response = await client().post<ApiErrorBody>('/api/auth/login', {
      login: ' ',
      password: '',
    })

    expect(response.status).toBe(400)
    expect(response.body.error.fields).toEqual({
      login: 'Identifiant ou pseudo requis.',
      password: 'Mot de passe requis.',
    })
  })
})

describe('session', () => {
  it('est portée par un cookie inaccessible au JavaScript de la page', async () => {
    const { client } = createTestApp()

    const response = await client().post('/api/auth/signup', { pseudo: 'Léa', password: PASSWORD })

    const cookie = response.sessionCookie ?? ''
    expect(cookie).toMatch(/^gu_session=v1\./)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Path=/')
    expect(cookie).toContain(`Max-Age=${30 * 24 * 60 * 60}`)
    // Le corps de la réponse ne contient ni jeton, ni mot de passe, ni empreinte.
    const body = JSON.stringify(response.body)
    expect(body).not.toContain('v1.')
    expect(body).not.toContain(PASSWORD)
    expect(body).not.toContain('scrypt')
    expect(Object.keys((response.body as SessionResponse).user ?? {}).sort()).toEqual([
      'avatar',
      'id',
      'mustChangePassword',
      'pseudo',
      'publicId',
      'role',
    ])
  })

  it('répond sans consulter la base pour un visiteur anonyme', async () => {
    const { client, store } = createTestApp()

    const response = await client().get<SessionResponse>('/api/session')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ user: null })
    expect(store.calls).toEqual({ read: 0, write: 0, list: 0, delete: 0 })
  })

  it('se ferme à la déconnexion', async () => {
    const { client } = createTestApp()
    const browser = client()
    await browser.signUpStudent('Léa')

    const response = await browser.post('/api/auth/logout')

    expect(response.status).toBe(204)
    expect(browser.cookie).toBeNull()
    expect(await browser.currentUser()).toBeNull()
  })

  it('dure 30 jours sans activité, et se prolonge à chaque visite', async () => {
    const { client, advance } = createTestApp()
    const visitor = client()
    const absent = client()
    await visitor.signUpStudent('Léa', PASSWORD)
    await absent.post('/api/auth/login', { login: 'Léa', password: PASSWORD })

    // L'un revient tous les 20 jours, l'autre jamais.
    for (let visit = 0; visit < 3; visit += 1) {
      advance(20 * DAY)
      expect(await visitor.currentUser()).not.toBeNull()
    }
    expect(await absent.currentUser()).toBeNull()
  })

  it('ignore un cookie falsifié', async () => {
    const { client } = createTestApp()
    const browser = client()
    await browser.signUpStudent('Léa')

    browser.cookie = `${browser.cookie!.slice(0, -4)}AAAA`

    expect(await browser.currentUser()).toBeNull()
  })

  it('enregistre la dernière activité au plus une fois par heure', async () => {
    const { client, store, advance } = createTestApp()
    const browser = client()
    await browser.signUpStudent('Léa')
    const writesAfterSignup = store.calls.write

    await browser.currentUser()
    advance(30 * MINUTE)
    await browser.currentUser()
    expect(store.calls.write).toBe(writesAfterSignup)

    advance(31 * MINUTE)
    await browser.currentUser()
    expect(store.calls.write).toBeGreaterThan(writesAfterSignup)
  })
})

describe('changement de mot de passe', () => {
  it('exige le mot de passe actuel', async () => {
    const { client } = createTestApp()
    const browser = client()
    await browser.signUpStudent('Léa', PASSWORD)

    const refused = await browser.post<ApiErrorBody>('/api/account/password', {
      currentPassword: 'pas-le-bon',
      newPassword: 'nouveau-mot-de-passe',
    })
    expect(refused.status).toBe(400)
    expect(refused.body.error.fields).toEqual({
      currentPassword: 'Le mot de passe actuel est incorrect.',
    })

    const missing = await browser.post('/api/account/password', {
      newPassword: 'nouveau-mot-de-passe',
    })
    expect(missing.status).toBe(400)
  })

  it('garde la session en cours et ferme les autres', async () => {
    const { client } = createTestApp()
    const phone = client()
    const computer = client()
    await phone.signUpStudent('Léa', PASSWORD)
    await computer.post('/api/auth/login', { login: 'Léa', password: PASSWORD })

    const response = await phone.post('/api/account/password', {
      currentPassword: PASSWORD,
      newPassword: 'nouveau-mot-de-passe',
    })

    expect(response.status).toBe(200)
    expect(await phone.currentUser()).not.toBeNull()
    expect(await computer.currentUser()).toBeNull()

    const oldPassword = await client().post('/api/auth/login', { login: 'Léa', password: PASSWORD })
    const newPassword = await client().post('/api/auth/login', {
      login: 'Léa',
      password: 'nouveau-mot-de-passe',
    })
    expect(oldPassword.status).toBe(401)
    expect(newPassword.status).toBe(200)
  })

  it('est réservé aux utilisateurs connectés', async () => {
    const { client } = createTestApp()

    const response = await client().post('/api/account/password', {
      currentPassword: PASSWORD,
      newPassword: 'nouveau-mot-de-passe',
    })

    expect(response.status).toBe(401)
  })
})

describe('protection des requêtes', () => {
  it('refuse une modification venue d’un autre site', async () => {
    const { client } = createTestApp()

    const response = await client().request<ApiErrorBody>(
      'POST',
      '/api/auth/signup',
      { pseudo: 'Léa', password: PASSWORD },
      { origin: 'https://site-malveillant.example' },
    )

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('cross_origin')
  })

  it('refuse un corps qui n’est pas du JSON', async () => {
    const { client } = createTestApp()

    const form = await client().request<ApiErrorBody>(
      'POST',
      '/api/auth/login',
      'login=L%C3%A9a&password=x',
      { 'content-type': 'application/x-www-form-urlencoded' },
    )
    const broken = await client().request<ApiErrorBody>('POST', '/api/auth/login', '{pas du json')

    expect(form.status).toBe(415)
    expect(broken.status).toBe(400)
    expect(broken.body.error.code).toBe('invalid_json')
  })

  it('ne met jamais les réponses en cache', async () => {
    const { client } = createTestApp()

    const ok = await client().get('/api/session')
    const error = await client().post('/api/auth/login', { login: 'x', password: 'y' })

    expect(ok.headers.get('cache-control')).toBe('no-store')
    expect(error.headers.get('cache-control')).toBe('no-store')
  })

  it('pose les en-têtes de sécurité sur toute réponse, y compris une erreur ou une adresse inconnue', async () => {
    const { client } = createTestApp()

    const responses = [
      await client().get('/api/session'),
      await client().post('/api/auth/login', { login: 'x', password: 'y' }),
      await client().get('/api/admin/students'),
      await client().get('/api/adresse-inconnue'),
    ]

    expect(responses.map((response) => response.status)).toEqual([200, 401, 401, 404])
    for (const response of responses) {
      expect(response.headers.get('x-content-type-options')).toBe('nosniff')
      expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
      expect(response.headers.get('cache-control')).toBe('no-store')
    }
  })
})

describe('mode réservé aux tests de bout en bout', () => {
  it('ne peut s’activer qu’en local, jamais sur un site publié', async () => {
    const { loadConfig } = await import('../../server/config.js')
    const { localDeployContext, localSettings } = await import('../../server/local.js')

    const published = { GRIND_UP_E2E_RUN: 'abc' }
    const local = { NETLIFY_DEV: 'true', GRIND_UP_E2E_RUN: 'abc' }

    expect(localSettings(published)).toEqual({ local: false, e2eRun: null })
    expect(loadConfig(published).limits.signupsPerHour).toBe(20)
    expect(loadConfig(published).scrypt.cost).toBe(2 ** 17)

    expect(localSettings(local)).toEqual({ local: true, e2eRun: 'abc' })
    expect(localDeployContext(localSettings(local))).toBe('e2e-abc')
    expect(localDeployContext(localSettings({ NETLIFY_LOCAL: 'true' }))).toBe('dev')
    expect(loadConfig(local).limits.signupsPerHour).toBeGreaterThan(20)
    expect(loadConfig(local).limits.adminCodeAttemptsPerHour).toBeGreaterThan(5)
    expect(loadConfig(published).limits.adminCodeAttemptsPerHour).toBe(5)
  })
})
