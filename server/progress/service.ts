import { randomUUID } from 'node:crypto'
import { effectiveStatus, isPastDeadline } from '../../shared/rules/assignment-status.js'
import { BADGES, earnedBadges, type BadgeStats } from '../../shared/rules/badges.js'
import { levelFromXp, levelProgress } from '../../shared/rules/levels.js'
import { isAutoCorrected, type QuestCategory } from '../../shared/rules/quests.js'
import { BONUS_LABELS, type BonusKind } from '../../shared/rules/rewards.js'
import { computeStreak, type Streak } from '../../shared/rules/streak.js'
import type {
  AdminStudentProgress,
  BadgeProgress,
  Celebration,
  StudentAssignment,
  StudentProgress,
  XpEntry,
} from '../../shared/schemas/progress.js'
import { mondayOf, parisDay } from '../../shared/time.js'
import type { SqlReader, SqlRow, SqlWriter } from '../db/sqlite.js'
import { weeklyPodiumRank } from '../leaderboard/service.js'
import type { AssignmentRow, QuestRow } from '../quests/store.js'
import { totalsOf } from './totals.js'

export { totalsByUser, totalsOf, type Totals } from './totals.js'

/**
 * Progression d'un élève : XP, niveau, missions, série, badges. Tout se calcule
 * à partir du journal d'XP et des assignations ; rien n'est stocké en double.
 */
const RECENT_REWARDS = 5
const JOURNAL_LIMIT = 300

// --- Journal -----------------------------------------------------------------------------------

interface EntryRow extends SqlRow {
  id: string
  amount: number
  reason: XpEntry['reason']
  detail: string | null
  created_at: string
  quest_title: string | null
}

function entryLabel(row: EntryRow): string {
  const quest = row.quest_title ?? 'Quête supprimée'
  switch (row.reason) {
    case 'quest':
      if (row.detail === 'cancelled') return `Validation annulée\u00A0: ${quest}`
      return row.detail === 'late' ? `${quest} (rendue en retard)` : quest
    case 'bonus':
      return `${BONUS_LABELS[row.detail as BonusKind] ?? 'Bonus'}\u00A0: ${quest}`
    case 'manual':
      return row.detail ?? 'Ajustement de ton accompagnant'
    case 'bot':
      return 'Mission'
  }
}

/** Le journal d'XP d'un utilisateur, de la ligne la plus récente à la plus ancienne. */
export function readJournal(tx: SqlReader, userId: string, limit = JOURNAL_LIMIT): XpEntry[] {
  const rows = tx.all<EntryRow>(
    `SELECT xp_entries.id, xp_entries.amount, xp_entries.reason, xp_entries.detail,
            xp_entries.created_at, quests.title AS quest_title
     FROM xp_entries
     LEFT JOIN assignments ON assignments.id = xp_entries.assignment_id
     LEFT JOIN quests ON quests.id = assignments.quest_id
     WHERE xp_entries.user_id = ?
     ORDER BY xp_entries.created_at DESC, xp_entries.rowid DESC
     LIMIT ?`,
    [userId, limit],
  )
  return rows.map((row) => ({
    id: row.id,
    amount: row.amount,
    reason: row.reason,
    label: entryLabel(row),
    questTitle: row.reason === 'manual' ? null : row.quest_title,
    createdAt: row.created_at,
  }))
}

// --- Série -------------------------------------------------------------------------------------

interface StreakRow extends SqlRow {
  status: AssignmentRow['status']
  assigned_at: string
  submitted_at: string | null
  validated_at: string | null
  reopened_at: string | null
  extra_attempts: number
  deadline_at: string | null
  state: QuestRow['state']
  format: QuestRow['format']
  max_attempts: number
  attempts_used: number
  last_attempt_at: string | null
}

const dayOf = (iso: string) => parisDay(new Date(iso))

/**
 * La série de l'élève. Un jour compte quand il y a validé une quête ; la date
 * qui fait foi est celle de sa soumission quand l'admin a validé plus tard. Un
 * jour où il n'avait rien à faire (aucune quête, ou seulement des quêtes
 * soumises, expirées ou sans tentative restante) ne casse pas la série.
 */
export function streakOf(tx: SqlReader, userId: string, now: Date): Streak {
  const rows = tx.all<StreakRow>(
    `SELECT assignments.status, assignments.assigned_at, assignments.submitted_at,
            assignments.validated_at, assignments.reopened_at, assignments.extra_attempts,
            quests.deadline_at, quests.state, quests.format, quests.max_attempts,
            (SELECT COUNT(*) FROM attempts WHERE attempts.assignment_id = assignments.id)
              AS attempts_used,
            (SELECT MAX(created_at) FROM attempts WHERE attempts.assignment_id = assignments.id)
              AS last_attempt_at
     FROM assignments
     JOIN quests ON quests.id = assignments.quest_id
     WHERE assignments.student_id = ? AND quests.state != 'draft'`,
    [userId],
  )
  const today = parisDay(now)
  const validationDays: string[] = []
  const openPeriods: { from: string; to: string }[] = []

  for (const row of rows) {
    const from = dayOf(row.assigned_at)
    if (row.status === 'validated') {
      const completed = dayOf(row.submitted_at ?? row.validated_at ?? row.assigned_at)
      validationDays.push(completed)
      openPeriods.push({ from, to: completed })
      continue
    }
    // Une quête archivée a quitté les listes de l'élève : elle ne lui demande plus rien.
    if (row.state !== 'published') continue

    const blocked =
      isAutoCorrected(row.format) && row.attempts_used >= row.max_attempts + row.extra_attempts
    const expired = isPastDeadline(
      { deadlineAt: row.deadline_at, reopenedAt: row.reopened_at },
      now,
    )
    const until =
      row.status === 'submitted' && row.submitted_at
        ? dayOf(row.submitted_at)
        : blocked && row.last_attempt_at
          ? dayOf(row.last_attempt_at)
          : expired && row.deadline_at
            ? dayOf(row.deadline_at)
            : today
    openPeriods.push({ from, to: until })
  }

  return computeStreak({ validationDays, openPeriods, today })
}

// --- Badges ------------------------------------------------------------------------------------

/** Ce que les conditions des badges ont besoin de savoir sur un élève. */
export function badgeStatsOf(tx: SqlReader, userId: string, now: Date): BadgeStats {
  const byCategory = tx.all<{ category: QuestCategory; validated: number }>(
    `SELECT quests.category, COUNT(*) AS validated
     FROM assignments JOIN quests ON quests.id = assignments.quest_id
     WHERE assignments.student_id = ? AND assignments.status = 'validated'
     GROUP BY quests.category`,
    [userId],
  )
  // Les bonus comptés sont ceux des validations en place, pas ceux d'une validation annulée.
  const bonuses = tx.all<{ detail: string; count: number }>(
    `SELECT xp_entries.detail, COUNT(*) AS count
     FROM xp_entries
     JOIN assignments ON assignments.id = xp_entries.assignment_id
     WHERE xp_entries.user_id = ? AND xp_entries.reason = 'bonus'
       AND assignments.status = 'validated' AND xp_entries.created_at = assignments.validated_at
     GROUP BY xp_entries.detail`,
    [userId],
  )
  const bonusCount = (kind: BonusKind) => bonuses.find((row) => row.detail === kind)?.count ?? 0
  return {
    validated: byCategory.reduce((sum, row) => sum + row.validated, 0),
    validatedByCategory: Object.fromEntries(byCategory.map((row) => [row.category, row.validated])),
    bestStreak: streakOf(tx, userId, now).best,
    earlyBonuses: bonusCount('early'),
    flawlessBonuses: bonusCount('flawless'),
    // Le Podium est attribué par le leaderboard, à la fin d'une semaine : ici, on sait
    // seulement s'il a déjà été obtenu.
    podiumWeeks: earnedCodes(tx, userId).has('podium') ? 1 : 0,
  }
}

function earnedCodes(tx: SqlReader, userId: string): Map<string, string> {
  const rows = tx.all<{ code: string; earned_at: string }>(
    'SELECT code, earned_at FROM badges WHERE user_id = ?',
    [userId],
  )
  return new Map(rows.map((row) => [row.code, row.earned_at]))
}

/**
 * Attribue les badges dont la condition vient d'être remplie. Un badge ne
 * s'obtient qu'une fois et n'est jamais retiré. Renvoie les nouveaux badges.
 */
export function awardBadges(tx: SqlWriter, userId: string, now: Date): string[] {
  const already = earnedCodes(tx, userId)
  const fresh = earnedBadges(badgeStatsOf(tx, userId, now)).filter((code) => !already.has(code))
  for (const code of fresh) {
    tx.run('INSERT INTO badges (id, user_id, code, earned_at) VALUES (?, ?, ?, ?)', [
      randomUUID(),
      userId,
      code,
      now.toISOString(),
    ])
  }
  return fresh
}

function badgeProgress(tx: SqlReader, userId: string, now: Date): BadgeProgress[] {
  const stats = badgeStatsOf(tx, userId, now)
  const earned = earnedCodes(tx, userId)
  return BADGES.map((badge) => {
    const { done, goal } = badge.progress(stats)
    return { code: badge.code, earnedAt: earned.get(badge.code) ?? null, done, goal }
  })
}

// --- Annonces à fêter --------------------------------------------------------------------------

/**
 * Entrée sur le podium de la semaine, à annoncer à l'élève : sa place, de 1 à 3.
 * Elle n'est annoncée qu'une fois par semaine ; null s'il n'y a rien à annoncer.
 */
function podiumToAnnounce(tx: SqlReader, userId: string, now: Date): { rank: number } | null {
  const rank = weeklyPodiumRank(tx, userId, now)
  if (rank === null) return null
  const seen = tx.get<{ week: string | null }>(
    'SELECT podium_seen_week AS week FROM users WHERE id = ?',
    [userId],
  )
  return seen?.week === mondayOf(parisDay(now)) ? null : { rank }
}

function pendingCelebration(
  tx: SqlReader,
  userId: string,
  xp: number,
  now: Date,
): Celebration | null {
  const validations = tx.all<{ quest_id: string; title: string; xp_awarded: number | null }>(
    `SELECT assignments.quest_id, quests.title, assignments.xp_awarded
     FROM assignments JOIN quests ON quests.id = assignments.quest_id
     WHERE assignments.student_id = ? AND assignments.status = 'validated'
       AND assignments.celebrated_at IS NULL
     ORDER BY assignments.validated_at`,
    [userId],
  )
  const badges = tx.all<{ code: string }>(
    'SELECT code FROM badges WHERE user_id = ? AND seen_at IS NULL ORDER BY earned_at, rowid',
    [userId],
  )
  if (validations.length === 0 && badges.length === 0) return null

  const xpGained = validations.reduce((sum, row) => sum + (row.xp_awarded ?? 0), 0)
  const before = levelFromXp(xp - xpGained)
  const after = levelFromXp(xp)
  return {
    validations: validations.map((row) => ({
      questId: row.quest_id,
      title: row.title,
      xp: row.xp_awarded ?? 0,
    })),
    xpGained,
    levelUp: after > before ? { from: before, to: after } : null,
    // Le podium s'annonce avec la quête qui y a mené l'élève, jamais seul.
    podium: validations.length > 0 ? podiumToAnnounce(tx, userId, now) : null,
    badges: badges.map((row) => row.code),
  }
}

/** L'élève a vu ses annonces : elles ne lui seront plus montrées. */
export function markCelebrated(tx: SqlWriter, userId: string, now: Date): void {
  const at = now.toISOString()
  const announced = tx.get(
    `SELECT 1 AS pending FROM assignments
     WHERE student_id = ? AND status = 'validated' AND celebrated_at IS NULL LIMIT 1`,
    [userId],
  )
  // L'entrée sur le podium vient d'être annoncée : elle ne le sera plus cette semaine.
  if (announced && podiumToAnnounce(tx, userId, now)) {
    tx.run('UPDATE users SET podium_seen_week = ? WHERE id = ?', [mondayOf(parisDay(now)), userId])
  }
  tx.run(
    `UPDATE assignments SET celebrated_at = ?
     WHERE student_id = ? AND status = 'validated' AND celebrated_at IS NULL`,
    [at, userId],
  )
  tx.run('UPDATE badges SET seen_at = ? WHERE user_id = ? AND seen_at IS NULL', [at, userId])
}

// --- Vues --------------------------------------------------------------------------------------

export function readProgress(tx: SqlReader, userId: string, now: Date): StudentProgress {
  const { xp, missions } = totalsOf(tx, userId)
  return {
    xp,
    level: levelProgress(xp),
    missions,
    streak: streakOf(tx, userId, now),
    badges: badgeProgress(tx, userId, now),
    recentRewards: readJournal(tx, userId, RECENT_REWARDS),
    celebration: pendingCelebration(tx, userId, xp, now),
  }
}

/** Vrai si une condition de badge est remplie sans que le badge ait encore été attribué. */
export function hasUnawardedBadge(progress: Pick<StudentProgress, 'badges'>): boolean {
  return progress.badges.some((badge) => badge.earnedAt === null && badge.done >= badge.goal)
}

interface StudentAssignmentRow extends SqlRow {
  id: string
  status: AssignmentRow['status']
  reopened_at: string | null
  extra_attempts: number
  xp_awarded: number | null
  validated_at: string | null
  quest_id: string
  title: string
  category: QuestRow['category']
  format: QuestRow['format']
  reward_xp: number
  deadline_at: string | null
  state: QuestRow['state']
  max_attempts: number
  attempts_used: number
}

/** Les quêtes d'un élève, des plus récemment assignées aux plus anciennes. */
function assignmentsOf(tx: SqlReader, userId: string, now: Date): StudentAssignment[] {
  const rows = tx.all<StudentAssignmentRow>(
    `SELECT assignments.id, assignments.status, assignments.reopened_at,
            assignments.extra_attempts, assignments.xp_awarded, assignments.validated_at,
            quests.id AS quest_id, quests.title, quests.category, quests.format,
            quests.reward_xp, quests.deadline_at, quests.state, quests.max_attempts,
            (SELECT COUNT(*) FROM attempts WHERE attempts.assignment_id = assignments.id)
              AS attempts_used
     FROM assignments JOIN quests ON quests.id = assignments.quest_id
     WHERE assignments.student_id = ? AND quests.state != 'draft'
     ORDER BY assignments.assigned_at DESC, assignments.rowid DESC`,
    [userId],
  )
  return rows.map((row) => {
    const attemptsAllowed = row.max_attempts + row.extra_attempts
    return {
      assignmentId: row.id,
      quest: {
        id: row.quest_id,
        title: row.title,
        category: row.category,
        format: row.format,
        rewardXp: row.reward_xp,
        deadlineAt: row.deadline_at,
        state: row.state,
      },
      status: effectiveStatus(
        { status: row.status, deadlineAt: row.deadline_at, reopenedAt: row.reopened_at },
        now,
      ),
      blocked:
        isAutoCorrected(row.format) &&
        row.status !== 'validated' &&
        row.attempts_used >= attemptsAllowed,
      attemptsUsed: row.attempts_used,
      attemptsAllowed,
      xpAwarded: row.xp_awarded,
      validatedAt: row.validated_at,
    }
  })
}

export function readAdminStudentProgress(
  tx: SqlReader,
  userId: string,
  now: Date,
): AdminStudentProgress {
  const { xp, missions } = totalsOf(tx, userId)
  return {
    xp,
    level: levelProgress(xp),
    missions,
    streak: streakOf(tx, userId, now),
    badges: badgeProgress(tx, userId, now),
    assignments: assignmentsOf(tx, userId, now),
    journal: readJournal(tx, userId),
  }
}

/** Ajustement manuel d'XP par l'admin : une ligne de plus au journal, avec son motif. */
export function adjustXp(
  tx: SqlWriter,
  userId: string,
  amount: number,
  reason: string,
  now: Date,
): void {
  tx.run(
    `INSERT INTO xp_entries (id, user_id, amount, reason, detail, mission_delta, created_at)
     VALUES (?, ?, ?, 'manual', ?, 0, ?)`,
    [randomUUID(), userId, amount, reason, now.toISOString()],
  )
}
