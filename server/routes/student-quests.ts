import { Hono } from 'hono'
import {
  attemptRequestSchema,
  type StudentQuestResponse,
  type StudentQuestsResponse,
} from '../../shared/schemas/quests.js'
import { signedInUser } from '../auth/middleware.js'
import type { AppEnv } from '../context.js'
import { parseBody } from '../http.js'
import { serveQuestImage } from '../quests/images.js'
import {
  listMyQuests,
  readMyQuest,
  requireMyQuest,
  startMyQuest,
  submitAttempt,
} from '../quests/student-service.js'

/**
 * Quêtes côté élève. Monté sous /quests, réservé aux élèves. Chaque route ne
 * lit et ne modifie que les quêtes de l'élève connecté : l'identifiant de
 * l'élève vient toujours de la session, jamais de la requête.
 */
export const studentQuestRoutes = new Hono<AppEnv>()

studentQuestRoutes.get('/', async (c) => {
  const student = signedInUser(c)
  const now = c.var.now()
  const quests = await c.var.storage.database.read((tx) => listMyQuests(tx, student.id, now))
  return c.json<StudentQuestsResponse>({ quests })
})

studentQuestRoutes.get('/:questId', async (c) => {
  const student = signedInUser(c)
  const questId = c.req.param('questId')
  const now = c.var.now()
  const quest = await c.var.storage.database.read((tx) => readMyQuest(tx, student.id, questId, now))
  return c.json<StudentQuestResponse>({ quest })
})

// Image de la consigne : servie aux seuls élèves qui ont cette quête.
studentQuestRoutes.get('/:questId/image', (c) => {
  const student = signedInUser(c)
  const questId = c.req.param('questId')
  return serveQuestImage(c, (tx) => requireMyQuest(tx, student.id, questId).quest)
})

// L'élève ouvre la quête : elle passe de « À faire » à « En cours ».
studentQuestRoutes.post('/:questId/start', async (c) => {
  const student = signedInUser(c)
  const questId = c.req.param('questId')
  const now = c.var.now()
  const quest = await c.var.storage.database.write((tx) => {
    startMyQuest(tx, student.id, questId, now)
    return readMyQuest(tx, student.id, questId, now)
  })
  return c.json<StudentQuestResponse>({ quest })
})

// L'élève répond : correction immédiate ou soumission à l'admin, selon le format.
studentQuestRoutes.post('/:questId/attempts', async (c) => {
  const student = signedInUser(c)
  const questId = c.req.param('questId')
  const request = await parseBody(c, attemptRequestSchema)
  const now = c.var.now()
  const quest = await c.var.storage.database.write((tx) => {
    submitAttempt(tx, student.id, questId, request, now)
    return readMyQuest(tx, student.id, questId, now)
  })
  return c.json<StudentQuestResponse>({ quest })
})
