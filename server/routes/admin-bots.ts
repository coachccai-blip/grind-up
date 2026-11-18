import { Hono } from 'hono'
import {
  adjustBotRequestSchema,
  createBotRequestSchema,
  updateBotRequestSchema,
  updateSettingsRequestSchema,
  type AdminBotResponse,
  type AdminBotsResponse,
  type AdminSettingsResponse,
} from '../../shared/schemas/leaderboard.js'
import { adjustBot, createBot, deleteBot, listBots, readBot, updateBot } from '../bots/service.js'
import type { AppEnv } from '../context.js'
import { parseBody } from '../http.js'
import { readSettings } from '../leaderboard/service.js'

/** Bots côté admin. Monté sous /admin, donc réservé aux admins. */
export const adminBotRoutes = new Hono<AppEnv>()

adminBotRoutes.get('/', async (c) => {
  const now = c.var.now()
  const bots = await c.var.storage.database.read((tx) => listBots(tx, now))
  return c.json<AdminBotsResponse>({ bots })
})

adminBotRoutes.post('/', async (c) => {
  const request = await parseBody(c, createBotRequestSchema)
  const now = c.var.now()
  const bot = await c.var.storage.database.write((tx) =>
    readBot(tx, createBot(tx, request, now), now),
  )
  return c.json<AdminBotResponse>({ bot }, 201)
})

// Réglages d'un bot, mise en pause et reprise.
adminBotRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const changes = await parseBody(c, updateBotRequestSchema)
  const now = c.var.now()
  const bot = await c.var.storage.database.write((tx) => {
    updateBot(tx, id, changes, now)
    return readBot(tx, id, now)
  })
  return c.json<AdminBotResponse>({ bot })
})

// Ajustement manuel des missions et de l'XP d'un bot.
adminBotRoutes.post('/:id/adjust', async (c) => {
  const id = c.req.param('id')
  const change = await parseBody(c, adjustBotRequestSchema)
  const now = c.var.now()
  const bot = await c.var.storage.database.write((tx) => {
    adjustBot(tx, id, change, now)
    return readBot(tx, id, now)
  })
  return c.json<AdminBotResponse>({ bot })
})

// Suppression : le bot disparaît du leaderboard, passé compris.
adminBotRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await c.var.storage.database.write((tx) => deleteBot(tx, id))
  return c.body(null, 204)
})

/** Paramètres globaux. Monté sous /admin. */
export const adminSettingsRoutes = new Hono<AppEnv>()

adminSettingsRoutes.get('/', async (c) => {
  const settings = await c.var.storage.database.read(readSettings)
  return c.json<AdminSettingsResponse>({
    settings: { showBotLabel: settings.show_bot_label === 1 },
  })
})

adminSettingsRoutes.patch('/', async (c) => {
  const changes = await parseBody(c, updateSettingsRequestSchema)
  const settings = await c.var.storage.database.write((tx) => {
    if (changes.showBotLabel !== undefined) {
      tx.run('UPDATE settings SET show_bot_label = ? WHERE id = 1', [changes.showBotLabel ? 1 : 0])
    }
    return readSettings(tx)
  })
  return c.json<AdminSettingsResponse>({
    settings: { showBotLabel: settings.show_bot_label === 1 },
  })
})
