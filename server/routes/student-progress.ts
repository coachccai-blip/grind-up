import { Hono } from 'hono'
import type { JournalResponse, ProgressResponse } from '../../shared/schemas/progress.js'
import { signedInUser } from '../auth/middleware.js'
import type { AppEnv } from '../context.js'
import {
  awardBadges,
  hasUnawardedBadge,
  markCelebrated,
  readJournal,
  readProgress,
} from '../progress/service.js'

/**
 * Progression de l'élève connecté : XP, niveau, série, badges, journal.
 * Monté sous /progress, réservé aux élèves ; l'identifiant de l'élève vient
 * toujours de la session.
 */
export const studentProgressRoutes = new Hono<AppEnv>()

studentProgressRoutes.get('/', async (c) => {
  const student = signedInUser(c)
  const now = c.var.now()
  const { database } = c.var.storage
  let progress = await database.read((tx) => readProgress(tx, student.id, now))
  // Une condition remplie sans son badge (quêtes validées avant l'arrivée des badges) :
  // le badge est attribué maintenant.
  if (hasUnawardedBadge(progress)) {
    progress = await database.write((tx) => {
      awardBadges(tx, student.id, now)
      return readProgress(tx, student.id, now)
    })
  }
  return c.json<ProgressResponse>({ progress })
})

studentProgressRoutes.get('/journal', async (c) => {
  const student = signedInUser(c)
  const entries = await c.var.storage.database.read((tx) => readJournal(tx, student.id))
  return c.json<JournalResponse>({ entries })
})

// L'élève a vu l'annonce de ses validations et de ses nouveaux badges.
studentProgressRoutes.post('/celebration/seen', async (c) => {
  const student = signedInUser(c)
  const now = c.var.now()
  const progress = await c.var.storage.database.write((tx) => {
    markCelebrated(tx, student.id, now)
    return readProgress(tx, student.id, now)
  })
  return c.json<ProgressResponse>({ progress })
})
