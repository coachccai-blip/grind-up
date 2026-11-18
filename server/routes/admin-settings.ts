import { Hono } from 'hono'
import {
  updateSettingsRequestSchema,
  type AdminSettingsResponse,
} from '../../shared/schemas/settings.js'
import type { AppEnv } from '../context.js'
import { parseBody } from '../http.js'
import { readGameSettings, updateGameSettings } from '../settings/service.js'

/** Paramètres de l'admin. Monté sous /admin, donc réservé aux admins. */
export const adminSettingsRoutes = new Hono<AppEnv>()

adminSettingsRoutes.get('/', async (c) => {
  const settings = await c.var.storage.database.read(readGameSettings)
  return c.json<AdminSettingsResponse>({ settings })
})

adminSettingsRoutes.patch('/', async (c) => {
  const changes = await parseBody(c, updateSettingsRequestSchema)
  const settings = await c.var.storage.database.write((tx) => updateGameSettings(tx, changes))
  return c.json<AdminSettingsResponse>({ settings })
})
