import type { AppConfig } from './config.js'
import type { BlobStore } from './db/blob-store.js'
import type { SqliteBlobDatabase } from './db/database.js'
import type { UserRow } from './auth/users.js'

/** Informations fournies par Netlify à chaque requête. */
export interface RequestEnvironment {
  /** Adresse IP du visiteur. */
  ip?: string
  /** Contexte de déploiement : production, deploy-preview, branch-deploy ou dev. */
  deployContext?: string
  /** Vrai quand le site tourne en local, sur l'émulateur de Netlify. */
  local?: boolean
}

/** Stockage et base à utiliser pour un contexte de déploiement. */
export interface Storage {
  store: BlobStore
  database: SqliteBlobDatabase
}

/** Ce que chaque route trouve dans son contexte. */
export interface AppEnv {
  Bindings: RequestEnvironment
  Variables: {
    storage: Storage
    config: AppConfig
    now: () => Date
    /** Hasard des tirages (planning et XP des bots) : remplaçable dans les tests. */
    random: () => number
    /** Utilisateur connecté, ou null. Posé par le middleware d'authentification. */
    user: UserRow | null
  }
}
