import type { Migration } from '../migrate.js'
import { migration0001 } from './0001_create_health_pings.js'
import { migration0002 } from './0002_create_users.js'
import { migration0003 } from './0003_create_quests.js'
import { migration0004 } from './0004_create_badges.js'

/** Toutes les migrations, dans leur ordre d'application. Ajouter les nouvelles à la fin. */
export const migrations: readonly Migration[] = [
  migration0001,
  migration0002,
  migration0003,
  migration0004,
]
