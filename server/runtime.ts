import { createApp } from './app.js'
import type { Storage } from './context.js'
import { NetlifyBlobStore } from './db/blob-store.js'
import { SqliteBlobDatabase } from './db/database.js'
import { migrations } from './db/migrations/index.js'

/**
 * Assemblage de l'application pour Netlify : stockage Netlify Blobs, base SQLite,
 * routes. Tout est créé à la première requête puis réutilisé tant que
 * l'instance de fonction reste en vie.
 */
const STORE_NAME = 'grind-up'
const BACKUPS_KEPT = 7

/**
 * Emplacement du fichier de base selon le contexte de déploiement.
 * Seule la production utilise la vraie base : un aperçu ou un essai local
 * ne doit jamais pouvoir la modifier.
 */
export function databaseLocation(deployContext: string | undefined): {
  key: string
  backupPrefix: string
} {
  if (deployContext === undefined || deployContext === 'production') {
    return { key: 'db/main.sqlite', backupPrefix: 'backups/main/' }
  }
  const slug = deployContext.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
  return { key: `db/${slug}.sqlite`, backupPrefix: `backups/${slug}/` }
}

const storages = new Map<string, Storage>()

function getStorage(deployContext: string | undefined): Storage {
  const { key, backupPrefix } = databaseLocation(deployContext)
  let storage = storages.get(key)
  if (!storage) {
    const store = new NetlifyBlobStore(STORE_NAME)
    storage = {
      store,
      database: new SqliteBlobDatabase({
        store,
        key,
        migrations,
        backups: { prefix: backupPrefix, keep: BACKUPS_KEPT },
      }),
    }
    storages.set(key, storage)
  }
  return storage
}

let app: ReturnType<typeof createApp> | undefined

export function getApp(): ReturnType<typeof createApp> {
  app ??= createApp({ storage: getStorage })
  return app
}
