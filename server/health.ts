import { randomUUID } from 'node:crypto'
import type { HealthCheck, HealthReport } from '../shared/health.js'
import { APP_VERSION } from '../shared/version.js'
import type { BlobStore } from './db/blob-store.js'
import type { SqliteBlobDatabase } from './db/database.js'
import type { SqlReader, SqlWriter } from './db/sqlite.js'

/** Nombre de vérifications gardées en base : la table ne grossit pas avec les appels. */
const PINGS_KEPT = 20

/** Dossier des fichiers d'essai pour les écritures conditionnelles, distinct de la base. */
const PROBE_PREFIX = 'health/probe-'
/** Nombre d'écritures lancées en même temps sur la même version. */
const RACE_SIZE = 4

interface PingState {
  /** Nombre d'écritures depuis la création de la base. */
  total: number
  /** Nombre de lignes encore présentes. */
  kept: number
  lastPingedAt: string | null
}

function recordPing(tx: SqlWriter, at: Date): number {
  tx.run('INSERT INTO health_pings (pinged_at) VALUES (?)', [at.toISOString()])
  tx.run(
    `DELETE FROM health_pings
     WHERE id NOT IN (SELECT id FROM health_pings ORDER BY id DESC LIMIT ${PINGS_KEPT})`,
  )
  return readPings(tx).total
}

/** Vrai si l'écriture portant ce numéro figure dans la base. */
function hasPing(tx: SqlReader, id: number): boolean {
  return tx.get('SELECT id FROM health_pings WHERE id = ?', [id]) !== undefined
}

function readPings(tx: SqlReader): PingState {
  const row = tx.get<{ total: number | null; kept: number; last_pinged_at: string | null }>(
    'SELECT max(id) AS total, count(*) AS kept, max(pinged_at) AS last_pinged_at FROM health_pings',
  )
  return { total: row?.total ?? 0, kept: row?.kept ?? 0, lastPingedAt: row?.last_pinged_at ?? null }
}

const pause = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds))

/**
 * Vérifie que le stockage refuse bien une écriture fondée sur une version
 * dépassée : c'est ce qui garantit qu'une quête ne crédite jamais deux fois l'XP.
 *
 * `race` lance en plus plusieurs écritures en même temps sur la même version :
 * une seule au plus doit passer. L'émulateur local de Netlify ne le garantit
 * pas, donc cette partie est réservée aux déploiements réels.
 */
async function probeConditionalWrites(store: BlobStore, race: boolean): Promise<string> {
  // Un fichier d'essai par vérification : deux vérifications simultanées ne se gênent pas.
  const key = `${PROBE_PREFIX}${randomUUID()}`
  try {
    return await runConditionalWriteProbe(store, key, race)
  } finally {
    await store.delete(key).catch(() => undefined)
  }
}

async function runConditionalWriteProbe(
  store: BlobStore,
  key: string,
  race: boolean,
): Promise<string> {
  const content = (text: string) => new TextEncoder().encode(text)

  const first = await store.write(key, content('version 1'))
  if (!first.written) throw new Error('Une écriture sans condition a été refusée.')
  // Courte pause : l'émulateur local date ses versions à la milliseconde.
  await pause(3)

  const second = await store.write(key, content('version 2'), { ifMatch: first.etag })
  if (!second.written) {
    throw new Error('Une écriture fondée sur la version en place a été refusée.')
  }
  await pause(3)

  const stale = await store.write(key, content('en retard'), { ifMatch: first.etag })
  if (stale.written) {
    throw new Error('Une écriture fondée sur une version dépassée a été acceptée.')
  }

  const duplicate = await store.write(key, content('doublon'), { ifAbsent: true })
  if (duplicate.written) {
    throw new Error('Une écriture « seulement si absent » a écrasé un fichier existant.')
  }

  let summary = 'Version dépassée refusée, fichier existant protégé'
  if (race) {
    const outcomes = await Promise.all(
      Array.from({ length: RACE_SIZE }, (_, index) =>
        store.write(key, content(`course ${index}`), { ifMatch: second.etag }),
      ),
    )
    const accepted = outcomes.filter((outcome) => outcome.written).length
    if (accepted > 1) {
      throw new Error(
        `${accepted} écritures simultanées sur ${RACE_SIZE} ont été acceptées\u00A0: une seule au plus aurait dû passer.`,
      )
    }
    summary += `\u00A0; ${accepted} écriture acceptée sur ${RACE_SIZE} lancées en même temps`
  } else {
    summary += ' (écritures simultanées non testées en local)'
  }

  return summary
}

function describeError(error: unknown): string {
  const text = error instanceof Error ? `${error.name}\u00A0: ${error.message}` : String(error)
  return text.length > 600 ? `${text.slice(0, 600)}…` : text
}

export interface HealthCheckOptions {
  database: SqliteBlobDatabase
  store: BlobStore
  /** Contexte de déploiement annoncé par Netlify (production, dev…), s'il est connu. */
  deployContext: string | undefined
  /** Vrai en local : l'émulateur de Netlify ne garantit pas les écritures simultanées. */
  local: boolean
  now?: () => Date
}

/**
 * Test de déploiement (étape 1). Vérifie que la fonction s'exécute, qu'elle écrit
 * dans la base, que ce qui est écrit se relit depuis le stockage, que le stockage
 * refuse les écritures concurrentes, et que la copie quotidienne existe.
 */
export async function runHealthCheck(options: HealthCheckOptions): Promise<HealthReport> {
  const { database, store, deployContext, local } = options
  const now = options.now ?? (() => new Date())
  const checks: HealthCheck[] = []

  const check = async (
    id: HealthCheck['id'],
    label: string,
    action: () => Promise<string>,
  ): Promise<boolean> => {
    const startedAt = performance.now()
    let ok = true
    let detail: string
    try {
      detail = await action()
    } catch (error) {
      ok = false
      detail = describeError(error)
    }
    checks.push({ id, label, ok, detail, durationMs: Math.round(performance.now() - startedAt) })
    return ok
  }

  await check('function', 'Fonction serveur', async () => {
    return `Node ${process.version}, contexte « ${deployContext ?? 'inconnu'} »`
  })

  let written = 0
  const writeSucceeded = await check('database_write', 'Écriture dans la base', async () => {
    written = await database.write((tx) => recordPing(tx, now()))
    return `Écriture n° ${written} enregistrée`
  })

  if (writeSucceeded) {
    await check('database_read', 'Relecture depuis le stockage', async () => {
      // On oublie la copie en mémoire pour relire réellement le fichier enregistré.
      await database.reload()
      const { state, found } = await database.read((tx) => ({
        state: readPings(tx),
        found: hasPing(tx, written),
      }))
      // D'autres vérifications ont pu écrire entre-temps : on cherche sa propre écriture, pas
      // un total exact. Elle n'a pu disparaître que si la table a été purgée depuis.
      const purgedSince = state.total - written >= PINGS_KEPT
      if (!found && !purgedSince) {
        throw new Error(
          `Relecture incohérente\u00A0: l’écriture n° ${written} est absente du stockage (dernière écriture lue\u00A0: n° ${state.total}).`,
        )
      }
      return (
        `${state.kept} ligne(s) relue(s), dernière écriture à ${state.lastPingedAt} (UTC). ` +
        `Stockage\u00A0: ${database.describeStorage()}`
      )
    })
  }

  await check('conditional_write', 'Protection contre les écritures concurrentes', () =>
    probeConditionalWrites(store, !local),
  )

  if (writeSucceeded) {
    await check('backup', 'Copie quotidienne de la base', async () => {
      const copies = await database.listBackups()
      const latest = copies.at(-1)
      if (!latest) throw new Error('Aucune copie quotidienne trouvée dans le stockage.')
      return `${copies.length} copie(s) conservée(s), la plus récente\u00A0: ${latest}`
    })
  }

  const ok = checks.every((entry) => entry.ok)
  return {
    ok,
    message: ok
      ? 'Tout fonctionne\u00A0: la fonction lit et écrit dans la base.'
      : 'Le test a échoué\u00A0: voir le détail des vérifications.',
    version: APP_VERSION,
    checkedAt: now().toISOString(),
    checks,
  }
}
