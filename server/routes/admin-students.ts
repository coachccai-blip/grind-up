import { Hono } from 'hono'
import {
  updateStudentRequestSchema,
  type AdminStudentResponse,
  type AdminStudentsResponse,
  type TemporaryPasswordResponse,
} from '../../shared/schemas/admin.js'
import { pseudoKey } from '../../shared/rules/pseudo.js'
import { generateTemporaryPassword, hashPassword } from '../auth/passwords.js'
import { pseudoTaken } from '../auth/service.js'
import { findStudentById, isPseudoTaken, listStudents, toAdminStudent } from '../auth/users.js'
import type { AppEnv } from '../context.js'
import { notFound, parseBody } from '../http.js'

/** Gestion des comptes élèves par l'admin. Monté sous /admin, donc réservé aux admins. */
export const adminStudentRoutes = new Hono<AppEnv>()

const studentNotFound = () => notFound('Cet élève est introuvable.')

adminStudentRoutes.get('/', async (c) => {
  const rows = await c.var.storage.database.read(listStudents)
  return c.json<AdminStudentsResponse>({ students: rows.map(toAdminStudent) })
})

adminStudentRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const row = await c.var.storage.database.read((tx) => findStudentById(tx, id))
  if (!row) throw studentNotFound()
  return c.json<AdminStudentResponse>({ student: toAdminStudent(row) })
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
  return c.json<AdminStudentResponse>({ student: toAdminStudent(outcome) })
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
