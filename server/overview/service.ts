import { effectiveStatus } from '../../shared/rules/assignment-status.js'
import type { QuestCategory, StoredAssignmentStatus } from '../../shared/rules/quests.js'
import {
  EXPIRING_WINDOW_HOURS,
  INACTIVITY_DAYS,
  type AdminOverview,
} from '../../shared/schemas/admin.js'
import type { SqlReader, SqlRow } from '../db/sqlite.js'

/**
 * Vue d'ensemble de l'espace admin (section 7 du brief) : ce qui demande
 * l'attention de l'accompagnant, calculé à chaque lecture.
 */
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

interface OpenAssignmentRow extends SqlRow {
  status: StoredAssignmentStatus
  reopened_at: string | null
  quest_id: string
  title: string
  category: QuestCategory
  deadline_at: string | null
}

export function readOverview(tx: SqlReader, now: Date): AdminOverview {
  const students = tx.get<{ total: number; active: number }>(
    `SELECT COUNT(*) AS total, COALESCE(SUM(is_active), 0) AS active
     FROM users WHERE role = 'student'`,
  )

  // Les réalisations non validées des quêtes publiées, pour les élèves qui peuvent se connecter.
  const open = tx.all<OpenAssignmentRow>(
    `SELECT assignments.status, assignments.reopened_at,
            quests.id AS quest_id, quests.title, quests.category, quests.deadline_at
     FROM assignments
     JOIN quests ON quests.id = assignments.quest_id
     JOIN users ON users.id = assignments.student_id
     WHERE quests.state = 'published' AND users.is_active = 1
       AND assignments.status != 'validated'`,
  )

  const inProgress = new Set<string>()
  const expiring = new Map<string, AdminOverview['expiringSoon'][number]>()
  const horizon = now.getTime() + EXPIRING_WINDOW_HOURS * HOUR_MS

  for (const row of open) {
    const status = effectiveStatus(
      { status: row.status, deadlineAt: row.deadline_at, reopenedAt: row.reopened_at },
      now,
    )
    if (status === 'expired') continue
    // Un élève au moins a encore à faire, ou attend une validation : la quête est en cours.
    inProgress.add(row.quest_id)

    // Une réalisation soumise n'expire plus : seules celles qui restent à faire sont comptées.
    if (status === 'submitted' || row.deadline_at === null) continue
    const deadline = new Date(row.deadline_at).getTime()
    if (deadline <= now.getTime() || deadline > horizon) continue
    const entry = expiring.get(row.quest_id) ?? {
      id: row.quest_id,
      title: row.title,
      category: row.category,
      deadlineAt: row.deadline_at,
      remaining: 0,
    }
    entry.remaining += 1
    expiring.set(row.quest_id, entry)
  }

  const pending = tx.get<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM assignments JOIN quests ON quests.id = assignments.quest_id
     WHERE assignments.status = 'submitted' AND quests.state = 'published'`,
  )

  const inactiveSince = new Date(now.getTime() - INACTIVITY_DAYS * DAY_MS).toISOString()
  const inactive = tx.all<{
    id: string
    pseudo: string
    avatar: string
    last_active_at: string | null
  }>(
    `SELECT id, pseudo, avatar, last_active_at FROM users
     WHERE role = 'student' AND is_active = 1
       AND (last_active_at IS NULL OR last_active_at <= ?)
     ORDER BY last_active_at IS NOT NULL, last_active_at, pseudo_key`,
    [inactiveSince],
  )

  return {
    totalStudents: students?.total ?? 0,
    activeStudents: students?.active ?? 0,
    questsInProgress: inProgress.size,
    pendingValidations: pending?.count ?? 0,
    expiringSoon: [...expiring.values()].sort(
      (first, second) =>
        first.deadlineAt.localeCompare(second.deadlineAt) ||
        first.title.localeCompare(second.title, 'fr'),
    ),
    inactiveStudents: inactive.map((row) => ({
      id: row.id,
      pseudo: row.pseudo,
      avatar: row.avatar,
      lastActiveAt: row.last_active_at,
    })),
  }
}
