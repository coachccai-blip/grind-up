import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../../server/app.js'
import { SqliteBlobDatabase } from '../../server/db/database.js'
import { migrations } from '../../server/db/migrations/index.js'
import { databaseLocation } from '../../server/runtime.js'
import type { HealthReport } from '../../shared/health.js'
import { APP_VERSION } from '../../shared/version.js'
import { MemoryBlobStore } from '../helpers/memory-blob-store.js'

/** L'application telle qu'elle tourne sur Netlify, avec un stockage en mémoire. */
function createTestApp(store = new MemoryBlobStore()) {
  const databases = new Map<string, SqliteBlobDatabase>()
  const app = createApp({
    now: () => new Date('2026-11-17T10:00:00Z'),
    storage: (deployContext) => {
      const { key, backupPrefix } = databaseLocation(deployContext)
      let database = databases.get(key)
      if (!database) {
        database = new SqliteBlobDatabase({
          store,
          key,
          migrations,
          backups: { prefix: backupPrefix, keep: 7 },
          now: () => new Date('2026-11-17T10:00:00Z'),
          sleep: async () => undefined,
        })
        databases.set(key, database)
      }
      return { store, database }
    },
  })
  return { app, store }
}

async function getHealth(
  app: ReturnType<typeof createApp>,
  deployContext = 'production',
  local = false,
) {
  const response = await app.request('/api/sante', {}, { deployContext, local })
  return { response, report: (await response.json()) as HealthReport }
}

describe('GET /api/sante', () => {
  it('reste juste quand plusieurs vérifications tournent en même temps', async () => {
    const { app } = createTestApp()

    const results = await Promise.all([
      getHealth(app),
      getHealth(app),
      getHealth(app),
      getHealth(app),
    ])

    for (const { report } of results) {
      expect(report.checks.filter((check) => !check.ok)).toEqual([])
      expect(report.ok).toBe(true)
    }
  })

  it('confirme que la fonction écrit dans la base et relit ce qui est écrit', async () => {
    const { app } = createTestApp()

    const { response, report } = await getHealth(app)

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(report.ok).toBe(true)
    expect(report.message).toBe('Tout fonctionne\u00A0: la fonction lit et écrit dans la base.')
    expect(report.version).toBe(APP_VERSION)
    expect(report.checks.map((check) => [check.id, check.ok])).toEqual([
      ['function', true],
      ['database_write', true],
      ['database_read', true],
      ['conditional_write', true],
      ['backup', true],
    ])
    expect(report.checks[1]?.detail).toBe('Écriture n° 1 enregistrée')
  })

  it('vérifie que le stockage refuse les écritures concurrentes', async () => {
    const { app, store } = createTestApp()

    const { report } = await getHealth(app)

    expect(report.checks[3]?.detail).toBe(
      'Version dépassée refusée, fichier existant protégé\u00A0; 1 écriture acceptée sur 4 lancées en même temps',
    )
    // Le fichier d'essai ne reste pas dans le stockage.
    expect(store.keys()).toEqual(['backups/main/2026-11-17.sqlite', 'db/main.sqlite'])
  })

  it('ne teste pas les écritures simultanées en local, où Netlify ne les garantit pas', async () => {
    const { app } = createTestApp()

    const { report } = await getHealth(app, 'dev', true)

    expect(report.checks[3]).toMatchObject({
      ok: true,
      detail:
        'Version dépassée refusée, fichier existant protégé (écritures simultanées non testées en local)',
    })
  })

  it('signale un stockage qui accepterait une version dépassée', async () => {
    const { app, store } = createTestApp()
    // Stockage défaillant : il ignore les conditions d'écriture.
    const write = store.write.bind(store)
    vi.spyOn(store, 'write').mockImplementation((key, bytes, condition) =>
      key.startsWith('health/') ? write(key, bytes) : write(key, bytes, condition),
    )

    const { response, report } = await getHealth(app)

    expect(response.status).toBe(503)
    expect(report.checks[3]).toMatchObject({ id: 'conditional_write', ok: false })
    expect(report.checks[3]?.detail).toContain('version dépassée a été acceptée')
  })

  it('compte les écritures d’un appel à l’autre', async () => {
    const { app } = createTestApp()

    await getHealth(app)
    await getHealth(app)
    const { report } = await getHealth(app)

    expect(report.checks[1]?.detail).toBe('Écriture n° 3 enregistrée')
  })

  it('garde une table de taille bornée, quel que soit le nombre d’appels', async () => {
    const { app } = createTestApp()

    let report: HealthReport | undefined
    for (let call = 0; call < 25; call += 1) ({ report } = await getHealth(app))

    expect(report?.checks[1]?.detail).toBe('Écriture n° 25 enregistrée')
    expect(report?.checks[2]?.detail).toContain('20 ligne(s) relue(s)')
  })

  it('sépare la base de production de celle des autres contextes', async () => {
    const { app, store } = createTestApp()

    await getHealth(app, 'production')
    await getHealth(app, 'production')
    const { report } = await getHealth(app, 'deploy-preview')

    // L'aperçu repart de zéro : il n'a pas touché à la base de production.
    expect(report.checks[1]?.detail).toBe('Écriture n° 1 enregistrée')
    expect(store.keys()).toEqual([
      'backups/deploy-preview/2026-11-17.sqlite',
      'backups/main/2026-11-17.sqlite',
      'db/deploy-preview.sqlite',
      'db/main.sqlite',
    ])
  })

  it('répond 503 avec la cause quand le stockage est indisponible', async () => {
    const { app, store } = createTestApp()
    vi.spyOn(store, 'read').mockRejectedValue(new Error('stockage indisponible'))

    const { response, report } = await getHealth(app)

    expect(response.status).toBe(503)
    expect(report.ok).toBe(false)
    expect(report.message).toBe('Le test a échoué\u00A0: voir le détail des vérifications.')
    expect(report.checks.map((check) => [check.id, check.ok])).toEqual([
      ['function', true],
      ['database_write', false],
      ['conditional_write', true],
    ])
    expect(report.checks[1]?.detail).toContain('stockage indisponible')
  })
})

describe('API', () => {
  it('répond 404 en JSON pour une adresse inconnue', async () => {
    const { app } = createTestApp()

    const response = await app.request('/api/inconnue')

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({
      error: { code: 'not_found', message: 'Cette adresse n’existe pas.' },
    })
  })
})

describe('emplacement de la base', () => {
  it('réserve la base principale à la production', () => {
    expect(databaseLocation('production').key).toBe('db/main.sqlite')
    expect(databaseLocation(undefined).key).toBe('db/main.sqlite')
    expect(databaseLocation('dev').key).toBe('db/dev.sqlite')
    expect(databaseLocation('branch-deploy').key).toBe('db/branch-deploy.sqlite')
  })
})
