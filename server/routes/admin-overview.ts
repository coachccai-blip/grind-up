import { Hono } from 'hono'
import type { AdminOverviewResponse } from '../../shared/schemas/admin.js'
import type { AppEnv } from '../context.js'
import { readOverview } from '../overview/service.js'

/** Vue d'ensemble de l'admin. Monté sous /admin, donc réservé aux admins. */
export const adminOverviewRoutes = new Hono<AppEnv>()

adminOverviewRoutes.get('/', async (c) => {
  const now = c.var.now()
  const overview = await c.var.storage.database.read((tx) => readOverview(tx, now))
  return c.json<AdminOverviewResponse>({ overview })
})
