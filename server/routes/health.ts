import { Hono } from 'hono'
import type { AppEnv } from '../context.js'
import { runHealthCheck } from '../health.js'

/** Test de déploiement : /api/sante. Public, pour pouvoir vérifier une mise en ligne. */
export const healthRoutes = new Hono<AppEnv>()

healthRoutes.get('/sante', async (c) => {
  const deployContext = c.env?.deployContext
  const report = await runHealthCheck({
    ...c.var.storage,
    deployContext,
    local: c.env?.local === true,
    now: c.var.now,
  })
  return c.json(report, report.ok ? 200 : 503)
})
