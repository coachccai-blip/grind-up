import { Hono } from 'hono'
import {
  changePasswordRequestSchema,
  loginRequestSchema,
  signupRequestSchema,
  type SessionResponse,
} from '../../shared/schemas/auth.js'
import { endSession, requireUser, signedInUser, startSession } from '../auth/middleware.js'
import { changePassword, logIn, signUp, type AuthDependencies } from '../auth/service.js'
import { toSessionUser } from '../auth/users.js'
import type { AppEnv } from '../context.js'
import { parseBody } from '../http.js'
import { avatarRequestSchema } from '../../shared/schemas/progress.js'
import { findUserById } from '../auth/users.js'

/** Inscription, connexion, session en cours et changement de mot de passe. */
export const authRoutes = new Hono<AppEnv>()

const dependencies = (c: { var: AppEnv['Variables'] }): AuthDependencies => ({
  database: c.var.storage.database,
  config: c.var.config,
  now: c.var.now,
})

authRoutes.post('/auth/signup', async (c) => {
  const input = await parseBody(c, signupRequestSchema)
  const user = await signUp(dependencies(c), input, c.env?.ip)
  await startSession(c, user)
  return c.json<SessionResponse>({ user: toSessionUser(user) }, 201)
})

authRoutes.post('/auth/login', async (c) => {
  const input = await parseBody(c, loginRequestSchema)
  const user = await logIn(dependencies(c), input, c.env?.ip)
  await startSession(c, user)
  return c.json<SessionResponse>({ user: toSessionUser(user) })
})

authRoutes.post('/auth/logout', (c) => {
  endSession(c)
  return c.body(null, 204)
})

// Session en cours : répond toujours 200, avec `user: null` pour un visiteur anonyme.
authRoutes.get('/session', (c) => {
  const user = c.var.user
  return c.json<SessionResponse>({ user: user ? toSessionUser(user) : null })
})

authRoutes.post(
  '/account/password',
  requireUser({ allowPendingPasswordChange: true }),
  async (c) => {
    const input = await parseBody(c, changePasswordRequestSchema)
    const updated = await changePassword(dependencies(c), signedInUser(c), input)
    // Les autres sessions du compte sont invalidées ; celle-ci continue.
    await startSession(c, updated)
    return c.json<SessionResponse>({ user: toSessionUser(updated) })
  },
)

// Choix d'un avatar dans la galerie fournie.
authRoutes.patch('/account/avatar', requireUser(), async (c) => {
  const { avatar } = await parseBody(c, avatarRequestSchema)
  const user = signedInUser(c)
  const updated = await c.var.storage.database.write((tx) => {
    tx.run('UPDATE users SET avatar = ? WHERE id = ?', [avatar, user.id])
    return findUserById(tx, user.id)!
  })
  return c.json<SessionResponse>({ user: toSessionUser(updated) })
})
