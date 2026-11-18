import type { SqlReader } from '../db/sqlite.js'

/**
 * XP totale et missions accomplies : les sommes du journal d'XP. Rien n'est
 * stocké à part, ni pour les élèves ni pour les bots.
 */
export interface Totals {
  xp: number
  missions: number
}

export function totalsOf(tx: SqlReader, userId: string): Totals {
  const row = tx.get<{ xp: number; missions: number }>(
    `SELECT COALESCE(SUM(amount), 0) AS xp, COALESCE(SUM(mission_delta), 0) AS missions
     FROM xp_entries WHERE user_id = ?`,
    [userId],
  )
  return { xp: row?.xp ?? 0, missions: row?.missions ?? 0 }
}

/** Les mêmes sommes pour tous les utilisateurs, en une seule requête. */
export function totalsByUser(tx: SqlReader): Map<string, Totals> {
  const rows = tx.all<{ user_id: string; xp: number; missions: number }>(
    `SELECT user_id, SUM(amount) AS xp, SUM(mission_delta) AS missions
     FROM xp_entries GROUP BY user_id`,
  )
  return new Map(rows.map((row) => [row.user_id, { xp: row.xp, missions: row.missions }]))
}
