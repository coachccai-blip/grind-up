import { Hono } from 'hono'
import type { BlobStore } from './db/blob-store.js'
import type { SqliteBlobDatabase } from './db/database.js'
import { runHealthCheck } from './health.js'

/** Informations fournies par Netlify à chaque requête. */
export interface RequestEnvironment {
  /** Adresse IP du visiteur. */
  ip?: string
  /** Contexte de déploiement : production, deploy-preview, branch-deploy ou dev. */
  deployContext?: string
}

/** Stockage et base à utiliser pour un contexte de déploiement. */
export interface Storage {
  store: BlobStore
  database: SqliteBlobDatabase
}

export interface AppDependencies {
  storage: (deployContext: string | undefined) => Storage
  now?: () => Date
}

/** Toutes les routes de l'API, servies sous /api/. */
export function createApp(dependencies: AppDependencies) {
  const app = new Hono<{ Bindings: RequestEnvironment }>().basePath('/api')

  // Les réponses de l'API ne doivent jamais être mises en cache.
  app.use('*', async (c, next) => {
    await next()
    c.header('Cache-Control', 'no-store')
  })

  app.get('/sante', async (c) => {
    const deployContext = c.env?.deployContext
    const report = await runHealthCheck({
      ...dependencies.storage(deployContext),
      deployContext,
      now: dependencies.now,
    })
    return c.json(report, report.ok ? 200 : 503)
  })

  app.notFound((c) =>
    c.json({ error: { code: 'not_found', message: "Cette adresse n'existe pas." } }, 404),
  )

  app.onError((error, c) => {
    console.error('[grind-up] Erreur non gérée', error)
    return c.json(
      {
        error: {
          code: 'internal_error',
          message: 'Une erreur est survenue. Réessayez dans un instant.',
        },
      },
      500,
    )
  })

  return app
}
