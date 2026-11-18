import { Hono } from 'hono'
import type { LibraryExerciseResponse, LibraryResponse } from '../../shared/schemas/library.js'
import type { AppEnv } from '../context.js'
import { notFound } from '../http.js'
import { findLibraryExercise, listLibrary } from '../library/index.js'

/**
 * Bibliothèque d'exercices. Monté sous /admin, donc réservé aux admins : un
 * exercice contient ses réponses attendues et ses corrections.
 */
export const adminLibraryRoutes = new Hono<AppEnv>()

adminLibraryRoutes.get('/', (c) => c.json<LibraryResponse>({ exercises: listLibrary() }))

adminLibraryRoutes.get('/:id', (c) => {
  const exercise = findLibraryExercise(c.req.param('id'))
  if (!exercise) throw notFound('Cet exercice est introuvable.')
  return c.json<LibraryExerciseResponse>({ exercise })
})
