import { Hono } from 'hono'
import {
  updateStudentRequestSchema,
  type AdminStudentResponse,
  type AdminStudentsResponse,
  type TemporaryPasswordResponse,
} from '../../shared/schemas/admin.js'
import { pseudoKey } from '../../shared/rules/pseudo.js'
import {
  xpAdjustmentRequestSchema,
  type AdminStudentProgressResponse,
} from '../../shared/schemas/progress.js'
import { generateTemporaryPassword, hashPassword } from '../auth/passwords.js'
import { pseudoTaken } from '../auth/service.js'
import { findStudentById, isPseudoTaken, listStudents, toAdminStudent } from '../auth/users.js'
import type { AppEnv } from '../context.js'
import { notFound, parseBody } from '../http.js'
import { adjustXp, readAdminStudentProgress, totalsByUser, totalsOf } from '../progress/service.js'

/** Gestion des comptes élèves par l'admin. Monté sous /admin, donc réservé aux admins. */
export const adminStudentRoutes = new Hono<AppEnv>()

const studentNotFound = () => notFound('Cet élève est introuvable.')

adminStudentRoutes.get('/', async (c) => {
  const students = await c.var.storage.database.read((tx) => {
    const totals = totalsByUser(tx)
    return listStudents(tx).map((row) => toAdminStudent(row, totals.get(row.id)))
  })
  return c.json<AdminStudentsResponse>({ students })
})

adminStudentRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const student = await c.var.storage.database.read((tx) => {
    const row = findStudentById(tx, id)
    return row && toAdminStudent(row, totalsOf(tx, id))
  })
  if (!student) throw studentNotFound()
  return c.json<AdminStudentResponse>({ student })
})

// Progression de l'élève : ses quêtes et leurs statuts, son journal d'XP, sa série, ses badges.
adminStudentRoutes.get('/:id/progress', async (c) => {
  const id = c.req.param('id')
  const now = c.var.now()
  const progress = await c.var.storage.database.read((tx) => {
    if (!findStudentById(tx, id)) throw studentNotFound()
    return readAdminStudentProgress(tx, id, now)
  })
  return c.json<AdminStudentProgressResponse>({ progress })
})

// Ajustement manuel d'XP : une ligne de plus au journal, positive ou négative, avec son motif.
adminStudentRoutes.post('/:id/xp', async (c) => {
  const id = c.req.param('id')
  const { amount, reason } = await parseBody(c, xpAdjustmentRequestSchema)
  const now = c.var.now()
  const progress = await c.var.storage.database.write((tx) => {
    if (!findStudentById(tx, id)) throw studentNotFound()
    adjustXp(tx, id, amount, reason, now)
    return readAdminStudentProgress(tx, id, now)
  })
  return c.json<AdminStudentProgressResponse>({ progress })
})

// Renommer un élève, désactiver ou réactiver son compte.
adminStudentRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const changes = await parseBody(c, updateStudentRequestSchema)

  const outcome = await c.var.storage.database.write((tx) => {
    const student = findStudentById(tx, id)
    if (!student) return 'not_found' as const

    if (changes.pseudo !== undefined) {
      if (isPseudoTaken(tx, changes.pseudo, id)) return 'pseudo_taken' as const
      tx.run('UPDATE users SET pseudo = ?, pseudo_key = ? WHERE id = ?', [
        changes.pseudo,
        pseudoKey(changes.pseudo),
        id,
      ])
    }
    if (changes.isActive !== undefined && (student.is_active === 1) !== changes.isActive) {
      // Changer la version de session déconnecte aussitôt un compte désactivé.
      tx.run('UPDATE users SET is_active = ?, session_version = session_version + 1 WHERE id = ?', [
        changes.isActive ? 1 : 0,
        id,
      ])
    }
    return findStudentById(tx, id)!
  })

  if (outcome === 'not_found') throw studentNotFound()
  if (outcome === 'pseudo_taken') throw pseudoTaken()
  const totals = await c.var.storage.database.read((tx) => totalsOf(tx, id))
  return c.json<AdminStudentResponse>({ student: toAdminStudent(outcome, totals) })
})

// Mot de passe oublié : l'admin génère un mot de passe temporaire, affiché une seule fois.
adminStudentRoutes.post('/:id/temporary-password', async (c) => {
  const id = c.req.param('id')
  const temporaryPassword = generateTemporaryPassword()
  const passwordHash = await hashPassword(temporaryPassword, c.var.config.scrypt)

  const found = await c.var.storage.database.write((tx) => {
    if (!findStudentById(tx, id)) return false
    tx.run(
      `UPDATE users
       SET password_hash = ?, must_change_password = 1, session_version = session_version + 1
       WHERE id = ?`,
      [passwordHash, id],
    )
    return true
  })

  if (!found) throw studentNotFound()
  return c.json<TemporaryPasswordResponse>({ temporaryPassword })
})

// Suppression définitive du compte et de toutes ses données.
adminStudentRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const found = await c.var.storage.database.write((tx) => {
    if (!findStudentById(tx, id)) return false
    tx.run(`DELETE FROM users WHERE id = ? AND role = 'student'`, [id])
    return true
  })
  if (!found) throw studentNotFound()
  return c.body(null, 204)
})
