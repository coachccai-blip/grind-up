import { createApp } from '../../server/app.js'
import { loadConfig, type AppConfig } from '../../server/config.js'
import { SqliteBlobDatabase } from '../../server/db/database.js'
import { migrations } from '../../server/db/migrations/index.js'
import { databaseLocation } from '../../server/runtime.js'
import type { SessionResponse, SessionUser } from '../../shared/schemas/auth.js'
import { MemoryBlobStore } from './memory-blob-store.js'

/**
 * L'application telle qu'elle tourne sur Netlify, avec un stockage en mémoire,
 * une horloge réglable et un hachage de mots de passe allégé pour la vitesse.
 */
export interface TestApp {
  app: ReturnType<typeof createApp>
  store: MemoryBlobStore
  clock: { now: Date }
  config: AppConfig
  /** Un navigateur simulé : il garde le cookie de session d'une requête à l'autre. */
  client(options?: { ip?: string }): TestClient
  /** Avance l'horloge. */
  advance(milliseconds: number): void
  /** La base de production, pour préparer ou vérifier des données directement. */
  database(): SqliteBlobDatabase
}

export const MINUTE = 60 * 1000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

/**
 * `shared` permet de créer une seconde application sur le même stockage et la même
 * horloge : deux instances de la fonction serveur, comme Netlify en lance en parallèle.
 */
export function createTestApp(
  configOverrides: Partial<AppConfig> = {},
  shared?: Pick<TestApp, 'store' | 'clock'>,
): TestApp {
  const store = shared?.store ?? new MemoryBlobStore()
  const clock = shared?.clock ?? { now: new Date('2026-11-17T10:00:00Z') }
  const config: AppConfig = {
    ...loadConfig({}),
    scrypt: { cost: 2 ** 10, blockSize: 8, parallelization: 1 },
    ...configOverrides,
  }
  const databases = new Map<string, SqliteBlobDatabase>()

  const databaseFor = (deployContext: string | undefined): SqliteBlobDatabase => {
    const { key, backupPrefix } = databaseLocation(deployContext)
    let database = databases.get(key)
    if (!database) {
      database = new SqliteBlobDatabase({
        store,
        key,
        migrations,
        backups: { prefix: backupPrefix, keep: 7 },
        now: () => clock.now,
        sleep: async () => undefined,
      })
      databases.set(key, database)
    }
    return database
  }

  // Hasard reproductible : la même suite de tirages à chaque test.
  let seed = 12345
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }

  const app = createApp({
    config,
    now: () => clock.now,
    random,
    storage: (deployContext) => ({ store, database: databaseFor(deployContext) }),
  })

  return {
    app,
    store,
    clock,
    config,
    client: (options = {}) => new TestClient(app, options.ip ?? '203.0.113.10'),
    advance: (milliseconds) => {
      clock.now = new Date(clock.now.getTime() + milliseconds)
    },
    database: () => databaseFor('production'),
  }
}

export interface TestResponse<Body = unknown> {
  status: number
  body: Body
  headers: Headers
  /** En-tête Set-Cookie de la session, s'il y en a un. */
  sessionCookie: string | undefined
}

const ORIGIN = 'https://grind-up.test'

export class TestClient {
  /** Valeur courante du cookie de session, comme la garderait un navigateur. */
  cookie: string | null = null

  constructor(
    private readonly app: ReturnType<typeof createApp>,
    private readonly ip: string,
  ) {}

  async request<Body = unknown>(
    method: string,
    path: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ): Promise<TestResponse<Body>> {
    const requestHeaders: Record<string, string> = { origin: ORIGIN, ...headers }
    if (this.cookie) requestHeaders.cookie = `gu_session=${this.cookie}`
    if (body !== undefined) requestHeaders['content-type'] ??= 'application/json'

    const response = await this.app.request(
      `${ORIGIN}${path}`,
      {
        method,
        headers: requestHeaders,
        body:
          body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
      },
      { ip: this.ip, deployContext: 'production', local: false },
    )

    const sessionCookie = response.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith('gu_session='))
    if (sessionCookie) {
      const value = sessionCookie.split(';')[0]!.slice('gu_session='.length)
      this.cookie = value === '' || /max-age=0/i.test(sessionCookie) ? null : value
    }

    const text = await response.text()
    return {
      status: response.status,
      body: (text ? JSON.parse(text) : null) as Body,
      headers: response.headers,
      sessionCookie,
    }
  }

  get<Body = unknown>(path: string) {
    return this.request<Body>('GET', path)
  }

  post<Body = unknown>(path: string, body: unknown = {}) {
    return this.request<Body>('POST', path, body)
  }

  put<Body = unknown>(path: string, body: unknown) {
    return this.request<Body>('PUT', path, body)
  }

  patch<Body = unknown>(path: string, body: unknown) {
    return this.request<Body>('PATCH', path, body)
  }

  delete<Body = unknown>(path: string) {
    return this.request<Body>('DELETE', path)
  }

  /** Crée un compte élève et reste connecté. */
  async signUpStudent(pseudo: string, password = 'motdepasse-solide'): Promise<SessionUser> {
    const response = await this.post<SessionResponse>('/api/auth/signup', { pseudo, password })
    if (response.status !== 201 || !response.body.user) {
      throw new Error(`Inscription de ${pseudo} refusée : ${JSON.stringify(response.body)}`)
    }
    return response.body.user
  }

  /** Crée un compte admin avec le code spécial et reste connecté. */
  async signUpAdmin(pseudo = 'Coach', specialCode = 'SuperAdmin'): Promise<SessionUser> {
    const response = await this.post<SessionResponse>('/api/auth/signup', {
      pseudo,
      password: 'motdepasse-admin',
      specialCode,
    })
    if (response.status !== 201 || !response.body.user) {
      throw new Error(`Inscription admin refusée : ${JSON.stringify(response.body)}`)
    }
    return response.body.user
  }

  async currentUser(): Promise<SessionUser | null> {
    return (await this.get<SessionResponse>('/api/session')).body.user
  }
}
