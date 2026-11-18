import { Hono } from 'hono'
import { parisDay } from '../../shared/time.js'
import type { AppEnv } from '../context.js'
import { toCsv } from '../export/csv.js'
import { EXPORTS, isExportId } from '../export/service.js'
import { notFound } from '../http.js'

/** Export des données au format CSV. Monté sous /admin, donc réservé aux admins. */
export const adminExportRoutes = new Hono<AppEnv>()

adminExportRoutes.get('/:file', async (c) => {
  const file = c.req.param('file')
  const id = file.endsWith('.csv') ? file.slice(0, -'.csv'.length) : ''
  if (!isExportId(id)) throw notFound('Ce fichier n’existe pas.')

  const now = c.var.now()
  const { fileName, build } = EXPORTS[id]
  const table = await c.var.storage.database.read((tx) => build(tx, now))

  // Le navigateur enregistre le fichier sous un nom daté, au lieu de l'afficher.
  c.header('Content-Type', 'text/csv; charset=utf-8')
  c.header(
    'Content-Disposition',
    `attachment; filename="grind-up-${fileName}-${parisDay(now)}.csv"`,
  )
  return c.body(toCsv(table))
})
