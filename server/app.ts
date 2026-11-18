import { Hono, type Context } from 'hono'
import { authenticate, requireRole, sameOriginOnly } from './auth/middleware.js'
import { loadConfig, type AppConfig } from './config.js'
import type { AppEnv, Storage } from './context.js'
import { WriteConflictError } from './db/database.js'
import { ApiError, notFound } from './http.js'
import { adminQuestRoutes, adminValidationRoutes } from './routes/admin-quests.js'
import { adminStudentRoutes } from './routes/admin-students.js'
import { authRoutes } from './routes/auth.js'
import { healthRoutes } from './routes/health.js'
import { studentProgressRoutes } from './routes/student-progress.js'
import { studentQuestRoutes } from './routes/student-quests.js'

export type { RequestEnvironment, Storage } from './context.js'

export interface AppDependencies {
  storage: (deployContext: string | undefined) => Storage
  config?: AppConfig
  now?: () => Date
}

/**
 * En-têtes de toute réponse de l'API. Les réglages de netlify.toml ne valent que
 * pour les fichiers statiques : la fonction pose les siens.
 */
function setApiHeaders(c: Context<AppEnv>): void {
  // Une réponse de l'API n'est jamais mise en cache, ni par le navigateur ni par Netlify.
  // Seule exception : une route qui pose elle-même sa règle (l'image d'une quête, gardée
  // par le navigateur de l'utilisateur, jamais par un cache partagé).
  if (!c.res.headers.has('Cache-Control')) c.header('Cache-Control', 'no-store')
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Robots-Tag', 'noindex, nofollow')
}

/**
 * Toutes les routes de l'API, servies sous /api/.
 *
 * Les droits tiennent à l'endroit où une route est montée : tout ce qui est
 * sous /admin exige un admin, tout ce qui est sous /quests ou /progress exige un
 * élève, y compris les routes ajoutées plus tard.
 */
export function createApp(dependencies: AppDependencies) {
  const config = dependencies.config ?? loadConfig()
  const now = dependencies.now ?? (() => new Date())
  const app = new Hono<AppEnv>().basePath('/api')

  app.use('*', async (c, next) => {
    c.set('storage', dependencies.storage(c.env?.deployContext))
    c.set('config', config)
    c.set('now', now)
    c.set('user', null)
    await next()
    setApiHeaders(c)
  })
  app.use('*', sameOriginOnly)

  // Le test de déploiement reste public et ne dépend pas des sessions.
  app.route('/', healthRoutes)

  app.use('*', authenticate)
  app.route('/', authRoutes)

  const admin = new Hono<AppEnv>()
  admin.use('*', requireRole('admin'))
  admin.route('/students', adminStudentRoutes)
  admin.route('/quests', adminQuestRoutes)
  admin.route('/', adminValidationRoutes)
  app.route('/admin', admin)

  // Les quêtes et la progression d'un élève : réservées aux élèves, chacun n'y voit que les siennes.
  const quests = new Hono<AppEnv>()
  quests.use('*', requireRole('student'))
  quests.route('/', studentQuestRoutes)
  app.route('/quests', quests)

  const progress = new Hono<AppEnv>()
  progress.use('*', requireRole('student'))
  progress.route('/', studentProgressRoutes)
  app.route('/progress', progress)

  app.notFound((c) => c.json(notFound().toBody(), 404))

  app.onError((error, c) => {
    setApiHeaders(c)
    if (error instanceof ApiError) {
      if (error.details.retryAfterSeconds !== undefined) {
        c.header('Retry-After', String(error.details.retryAfterSeconds))
      }
      return c.json(error.toBody(), error.status)
    }
    if (error instanceof WriteConflictError) {
      return c.json(
        {
          error: {
            code: 'busy',
            message: 'Le serveur est très sollicité. Merci de réessayer dans un instant.',
          },
        },
        503,
      )
    }
    console.error('[grind-up] Erreur non gérée', error)
    return c.json(
      {
        error: {
          code: 'internal_error',
          message: 'Une erreur est survenue. Merci de réessayer dans un instant.',
        },
      },
      500,
    )
  })

  return app
}
