import type { Migration } from '../migrate.js'
import { migration0001 } from './0001_create_health_pings.js'

/** Toutes les migrations, dans leur ordre d'application. Ajouter les nouvelles à la fin. */
export const migrations: readonly Migration[] = [migration0001]
