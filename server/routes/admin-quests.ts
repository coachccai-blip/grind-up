import { Hono } from 'hono'
import {
  addAssigneesRequestSchema,
  grantAttemptsRequestSchema,
  rejectRequestSchema,
  saveQuestRequestSchema,
  validateRequestSchema,
  type AdminQuestResponse,
  type AdminQuestsResponse,
  type AssignmentResponse,
  type ValidationsResponse,
} from '../../shared/schemas/quests.js'
import { signedInUser } from '../auth/middleware.js'
import type { AppEnv } from '../context.js'
import { parseBody } from '../http.js'
import {
  addAssignees,
  archiveQuest,
  createQuest,
  duplicateQuest,
  grantAttempts,
  listAdminQuests,
  listPendingValidations,
  publishQuest,
  readAdminQuest,
  rejectSubmission,
  removeDraft,
  reopenAssignment,
  restoreQuest,
  updateQuest,
  validateSubmission,
} from '../quests/admin-service.js'

/** Quêtes côté admin. Monté sous /admin, donc réservé aux admins. */
export const adminQuestRoutes = new Hono<AppEnv>()

adminQuestRoutes.get('/', async (c) => {
  const quests = await c.var.storage.database.read(listAdminQuests)
  return c.json<AdminQuestsResponse>({ quests })
})

adminQuestRoutes.post('/', async (c) => {
  const request = await parseBody(c, saveQuestRequestSchema)
  const author = signedInUser(c)
  const now = c.var.now()
  const quest = await c.var.storage.database.write((tx) =>
    readAdminQuest(tx, createQuest(tx, request, author.id, now), now),
  )
  return c.json<AdminQuestResponse>({ quest }, 201)
})

adminQuestRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const now = c.var.now()
  const quest = await c.var.storage.database.read((tx) => readAdminQuest(tx, id, now))
  return c.json<AdminQuestResponse>({ quest })
})

adminQuestRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const request = await parseBody(c, saveQuestRequestSchema)
  const now = c.var.now()
  const quest = await c.var.storage.database.write((tx) => {
    updateQuest(tx, id, request, now)
    return readAdminQuest(tx, id, now)
  })
  return c.json<AdminQuestResponse>({ quest })
})

adminQuestRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await c.var.storage.database.write((tx) => removeDraft(tx, id))
  return c.body(null, 204)
})

adminQuestRoutes.post('/:id/publish', async (c) => {
  const id = c.req.param('id')
  const now = c.var.now()
  const quest = await c.var.storage.database.write((tx) => {
    publishQuest(tx, id, now)
    return readAdminQuest(tx, id, now)
  })
  return c.json<AdminQuestResponse>({ quest })
})

adminQuestRoutes.post('/:id/duplicate', async (c) => {
  const id = c.req.param('id')
  const author = signedInUser(c)
  const now = c.var.now()
  const quest = await c.var.storage.database.write((tx) =>
    readAdminQuest(tx, duplicateQuest(tx, id, author.id, now), now),
  )
  return c.json<AdminQuestResponse>({ quest }, 201)
})

adminQuestRoutes.post('/:id/archive', async (c) => {
  const id = c.req.param('id')
  const now = c.var.now()
  const quest = await c.var.storage.database.write((tx) => {
    archiveQuest(tx, id, now)
    return readAdminQuest(tx, id, now)
  })
  return c.json<AdminQuestResponse>({ quest })
})

adminQuestRoutes.post('/:id/restore', async (c) => {
  const id = c.req.param('id')
  const now = c.var.now()
  const quest = await c.var.storage.database.write((tx) => {
    restoreQuest(tx, id, now)
    return readAdminQuest(tx, id, now)
  })
  return c.json<AdminQuestResponse>({ quest })
})

// Ajoute des élèves à une quête déjà publiée.
adminQuestRoutes.post('/:id/assignees', async (c) => {
  const id = c.req.param('id')
  const { assignees } = await parseBody(c, addAssigneesRequestSchema)
  const now = c.var.now()
  const quest = await c.var.storage.database.write((tx) => {
    addAssignees(tx, id, assignees, now)
    return readAdminQuest(tx, id, now)
  })
  return c.json<AdminQuestResponse>({ quest })
})

/** File de validation et actions sur la réalisation d'un élève. Monté sous /admin. */
export const adminValidationRoutes = new Hono<AppEnv>()

adminValidationRoutes.get('/validations', async (c) => {
  const validations = await c.var.storage.database.read(listPendingValidations)
  return c.json<ValidationsResponse>({ validations })
})

adminValidationRoutes.post('/assignments/:id/validate', async (c) => {
  const id = c.req.param('id')
  const { comment } = await parseBody(c, validateRequestSchema)
  const now = c.var.now()
  const assignment = await c.var.storage.database.write((tx) =>
    validateSubmission(tx, id, comment, now),
  )
  return c.json<AssignmentResponse>({ assignment })
})

adminValidationRoutes.post('/assignments/:id/reject', async (c) => {
  const id = c.req.param('id')
  const request = await parseBody(c, rejectRequestSchema)
  const now = c.var.now()
  const assignment = await c.var.storage.database.write((tx) =>
    rejectSubmission(tx, id, request, now),
  )
  return c.json<AssignmentResponse>({ assignment })
})

// Rouvre une quête expirée pour cet élève.
adminValidationRoutes.post('/assignments/:id/reopen', async (c) => {
  const id = c.req.param('id')
  const now = c.var.now()
  const assignment = await c.var.storage.database.write((tx) => reopenAssignment(tx, id, now))
  return c.json<AssignmentResponse>({ assignment })
})

// Redonne des tentatives à cet élève.
adminValidationRoutes.post('/assignments/:id/attempts', async (c) => {
  const id = c.req.param('id')
  const { count } = await parseBody(c, grantAttemptsRequestSchema)
  const now = c.var.now()
  const assignment = await c.var.storage.database.write((tx) => grantAttempts(tx, id, count, now))
  return c.json<AssignmentResponse>({ assignment })
})
