import { Hono } from 'hono'
import {
  leaderboardQuerySchema,
  type LeaderboardResponse,
} from '../../shared/schemas/leaderboard.js'
import { requireUser, signedInUser } from '../auth/middleware.js'
import { advanceBots, botsAreDue } from '../bots/service.js'
import type { AppEnv } from '../context.js'
import { ApiError } from '../http.js'
import { awardPodiums, podiumIsDue, readLeaderboard } from '../leaderboard/service.js'

/** Leaderboard : ouvert à tout utilisateur connecté, élève ou admin. */
export const leaderboardRoutes = new Hono<AppEnv>()

leaderboardRoutes.get('/leaderboard', requireUser(), async (c) => {
  const query = leaderboardQuerySchema.safeParse({
    period: c.req.query('period'),
    sort: c.req.query('sort'),
  })
  if (!query.success) {
    throw new ApiError(400, 'invalid_input', 'Ce classement n’existe pas.')
  }
  const viewer = signedInUser(c)
  const now = c.var.now()
  const random = c.var.random
  const { database } = c.var.storage

  // Aucune tâche planifiée : la progression des bots et le podium de la semaine écoulée
  // sont calculés ici, quand un classement est demandé, et seulement s'il y a à faire.
  const due = await database.read((tx) => botsAreDue(tx, now) || podiumIsDue(tx, now))
  if (due) {
    await database.write((tx) => {
      advanceBots(tx, now, random)
      if (podiumIsDue(tx, now)) awardPodiums(tx, now)
    })
  }

  const leaderboard = await database.read((tx) =>
    readLeaderboard(tx, { ...query.data, viewer, now }),
  )
  return c.json<LeaderboardResponse>(leaderboard)
})
