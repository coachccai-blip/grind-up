import type { Migration } from '../migrate.js'
import { migration0001 } from './0001_create_health_pings.js'
import { migration0002 } from './0002_create_users.js'
import { migration0003 } from './0003_create_quests.js'
import { migration0004 } from './0004_create_badges.js'
import { migration0005 } from './0005_create_bots.js'
import { migration0006 } from './0006_add_game_settings.js'
import { migration0007 } from './0007_add_item_explanations.js'
import { migration0008 } from './0008_add_quest_lessons.js'

/** Toutes les migrations, dans leur ordre d'application. Ajouter les nouvelles à la fin. */
export const migrations: readonly Migration[] = [
  migration0001,
  migration0002,
  migration0003,
  migration0004,
  migration0005,
  migration0006,
  migration0007,
  migration0008,
]
