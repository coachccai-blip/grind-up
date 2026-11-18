import { randomUUID } from 'node:crypto'
import { levelFromXp } from '../../shared/rules/levels.js'
import {
  movements,
  periodStart,
  rankStandings,
  type LeaderboardPeriod,
  type LeaderboardSort,
  type RankedStanding,
  type Standing,
} from '../../shared/rules/leaderboard.js'
import { shiftDay } from '../../shared/rules/streak.js'
import type { LeaderboardEntry, LeaderboardResponse } from '../../shared/schemas/leaderboard.js'
import { mondayOf, parisDay, parisMidnight } from '../../shared/time.js'
import type { UserRow } from '../auth/users.js'
import type { SqlReader, SqlRow, SqlWriter } from '../db/sqlite.js'
import { totalsByUser } from '../progress/totals.js'
import { readGameSettings } from '../settings/service.js'

/**
 * Leaderboard : il se calcule à partir du journal d'XP, de la même façon pour
 * les élèves et pour les bots. Les admins et les comptes désactivés n'y
 * figurent pas.
 */
export interface Participant extends SqlRow {
  id: string
  role: 'student' | 'bot'
  pseudo: string
  pseudo_key: string
  avatar: string
}

/** Les participants : les élèves actifs et les bots (un bot en pause garde sa place). */
export function participants(tx: SqlReader): Participant[] {
  return tx.all<Participant>(
    `SELECT id, role, pseudo, pseudo_key, avatar FROM users
     WHERE (role = 'student' AND is_active = 1) OR role = 'bot'`,
  )
}

interface PeriodRow extends SqlRow {
  user_id: string
  xp: number
  missions: number
  last_mission_at: string | null
}

/**
 * Ce que chaque utilisateur a fait entre deux instants. Une mission compte si
 * sa validation tient toujours : une validation annulée depuis n'est plus comptée,
 * même dans la semaine où elle avait été gagnée.
 */
export function standingsBetween(
  tx: SqlReader,
  from: Date | null,
  until: Date | null,
): Map<string, Omit<Standing, 'id' | 'pseudoKey'>> {
  const rows = tx.all<PeriodRow>(
    `SELECT entry.user_id,
            SUM(entry.amount) AS xp,
            SUM(CASE
                  WHEN entry.assignment_id IS NULL THEN entry.mission_delta
                  WHEN entry.mission_delta = 1 AND NOT EXISTS (
                    SELECT 1 FROM xp_entries AS later
                    WHERE later.assignment_id = entry.assignment_id
                      AND later.mission_delta = -1 AND later.rowid > entry.rowid
                  ) THEN 1
                  ELSE 0
                END) AS missions,
            MAX(CASE WHEN entry.mission_delta = 1 THEN entry.created_at END) AS last_mission_at
     FROM xp_entries AS entry
     WHERE entry.created_at >= ? AND entry.created_at < ?
     GROUP BY entry.user_id`,
    [from?.toISOString() ?? '', until?.toISOString() ?? '9999'],
  )
  return new Map(
    rows.map((row) => [
      row.user_id,
      // Un bot ajusté à la baisse ne descend pas sous zéro mission sur une période.
      { missions: Math.max(0, row.missions), xp: row.xp, lastMissionAt: row.last_mission_at },
    ]),
  )
}

/** Classement des participants entre deux instants. */
export function rankBetween(
  tx: SqlReader,
  everyone: readonly Participant[],
  from: Date | null,
  until: Date | null,
  sort: LeaderboardSort = 'missions',
): RankedStanding[] {
  const done = standingsBetween(tx, from, until)
  return rankStandings(
    everyone.map((participant) => ({
      id: participant.id,
      pseudoKey: participant.pseudo_key,
      ...(done.get(participant.id) ?? { missions: 0, xp: 0, lastMissionAt: null }),
    })),
    sort,
  )
}

export interface LeaderboardRequest {
  period: LeaderboardPeriod
  sort: LeaderboardSort
  /** Celui qui regarde : sa ligne est mise en avant ; un admin voit quels participants sont des bots. */
  viewer: Pick<UserRow, 'id' | 'role'>
  now: Date
}

export function readLeaderboard(tx: SqlReader, request: LeaderboardRequest): LeaderboardResponse {
  const { period, sort, viewer, now } = request
  const everyone = participants(tx)
  const from = periodStart(period, now)
  const current = rankBetween(tx, everyone, from, null, sort)

  // La veille : le même classement, arrêté à minuit (heure de Paris).
  const today = parisMidnight(parisDay(now))
  const hadYesterday = from === null || from.getTime() < today.getTime()
  const moves = hadYesterday
    ? movements(rankBetween(tx, everyone, from, today, sort), current)
    : new Map<string, number>()

  const byId = new Map(everyone.map((participant) => [participant.id, participant]))
  const totals = totalsByUser(tx)
  const showBots = viewer.role === 'admin' || readGameSettings(tx).showBotLabel

  const entries = current.map((standing): LeaderboardEntry => {
    const participant = byId.get(standing.id)!
    return {
      rank: standing.rank,
      pseudo: participant.pseudo,
      avatar: participant.avatar,
      level: levelFromXp(totals.get(standing.id)?.xp ?? 0),
      missions: standing.missions,
      xp: standing.xp,
      movement: moves.get(standing.id) ?? null,
      isYou: standing.id === viewer.id,
      // Un élève ne sait pas qui est un bot, sauf si l'admin a choisi de le montrer.
      isBot: showBots && participant.role === 'bot',
    }
  })
  return { period, sort, entries }
}

/**
 * Place de l'élève sur le podium de la semaine en cours, de 1 à 3 ; null s'il
 * n'y est pas. Les bots comptent : un élève quatrième derrière un bot n'y est pas.
 */
export function weeklyPodiumRank(tx: SqlReader, userId: string, now: Date): number | null {
  const standing = rankBetween(tx, participants(tx), periodStart('week', now), null).find(
    (entry) => entry.id === userId,
  )
  const rank = standing?.rank ?? null
  return rank !== null && rank <= 3 ? rank : null
}

// --- Badge Podium ------------------------------------------------------------------------------

/** Nombre de semaines passées reprises au plus, si personne n'a ouvert le classement depuis longtemps. */
const PODIUM_WEEKS_BACK = 8

/** Lundi de la dernière semaine terminée. */
const lastCompletedWeek = (now: Date) => shiftDay(mondayOf(parisDay(now)), -7)

/** Lundi de la dernière semaine dont le badge Podium a été attribué. */
function podiumAwardedWeek(tx: SqlReader): string | null {
  return (
    tx.get<{ week: string | null }>('SELECT podium_awarded_week AS week FROM settings WHERE id = 1')
      ?.week ?? null
  )
}

/** Vrai si une semaine terminée attend encore l'attribution de son podium. */
export function podiumIsDue(tx: SqlReader, now: Date): boolean {
  const awarded = podiumAwardedWeek(tx)
  return awarded === null || awarded < lastCompletedWeek(now)
}

/**
 * Attribue le badge Podium aux élèves qui ont terminé une semaine dans les trois
 * premiers du leaderboard, bots compris. Chaque semaine terminée n'est traitée
 * qu'une fois ; comme tout badge, le Podium ne s'obtient qu'une fois.
 */
export function awardPodiums(tx: SqlWriter, now: Date): void {
  const last = lastCompletedWeek(now)
  const awarded = podiumAwardedWeek(tx)
  const oldest = shiftDay(last, -7 * (PODIUM_WEEKS_BACK - 1))
  const first = awarded === null || awarded < shiftDay(oldest, -7) ? oldest : shiftDay(awarded, 7)
  const everyone = participants(tx)

  for (let week = first; week <= last; week = shiftDay(week, 7)) {
    const ranking = rankBetween(tx, everyone, parisMidnight(week), parisMidnight(shiftDay(week, 7)))
    for (const standing of ranking) {
      const isStudent = everyone.find((one) => one.id === standing.id)?.role === 'student'
      if (standing.rank === null || standing.rank > 3 || !isStudent) continue
      tx.run(
        `INSERT INTO badges (id, user_id, code, earned_at) VALUES (?, ?, 'podium', ?)
         ON CONFLICT (user_id, code) DO NOTHING`,
        [randomUUID(), standing.id, now.toISOString()],
      )
    }
  }
  tx.run('UPDATE settings SET podium_awarded_week = ? WHERE id = 1', [last])
}
