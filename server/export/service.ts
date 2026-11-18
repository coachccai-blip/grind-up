import { effectiveStatus } from '../../shared/rules/assignment-status.js'
import { findBadge } from '../../shared/rules/badges.js'
import { levelFromXp } from '../../shared/rules/levels.js'
import {
  findAssignmentStatus,
  findCategory,
  findDifficulty,
  findFormat,
  findQuestState,
  isAutoCorrected,
  type StoredAssignmentStatus,
} from '../../shared/rules/quests.js'
import { BONUS_LABELS, type BonusKind } from '../../shared/rules/rewards.js'
import { listStudents } from '../auth/users.js'
import type { SqlReader, SqlRow } from '../db/sqlite.js'
import { streakOf } from '../progress/service.js'
import { totalsByUser } from '../progress/totals.js'
import { listQuests, progressByQuest } from '../quests/store.js'
import { csvDate, type CsvTable } from './csv.js'

/**
 * Export des données au format CSV (section 7 du brief). Quatre fichiers : les
 * élèves, les quêtes, les réalisations et le journal d'XP. Les identifiants
 * internes et les mots de passe n'y figurent jamais.
 */
export const EXPORTS = {
  students: { fileName: 'eleves', build: exportStudents },
  quests: { fileName: 'quetes', build: exportQuests },
  assignments: { fileName: 'realisations', build: exportAssignments },
  'xp-journal': { fileName: 'journal-xp', build: exportXpJournal },
} as const satisfies Record<
  string,
  { fileName: string; build: (tx: SqlReader, now: Date) => CsvTable }
>

export type ExportId = keyof typeof EXPORTS

export const isExportId = (id: string): id is ExportId => Object.hasOwn(EXPORTS, id)

function exportStudents(tx: SqlReader, now: Date): CsvTable {
  const totals = totalsByUser(tx)
  const badges = tx.all<{ user_id: string; code: string }>(
    'SELECT user_id, code FROM badges ORDER BY earned_at, rowid',
  )
  return {
    header: [
      'Pseudo',
      'Identifiant',
      'Compte',
      'Niveau',
      'XP',
      'Missions',
      'Série en cours (jours)',
      'Record de série (jours)',
      'Badges',
      'Inscription',
      'Dernière activité',
    ],
    rows: listStudents(tx).map((student) => {
      const { xp, missions } = totals.get(student.id) ?? { xp: 0, missions: 0 }
      const streak = streakOf(tx, student.id, now)
      const earned = badges
        .filter((badge) => badge.user_id === student.id)
        .map((badge) => findBadge(badge.code)?.label ?? badge.code)
      return [
        student.pseudo,
        student.public_id ?? '',
        student.is_active === 1 ? 'Actif' : 'Désactivé',
        levelFromXp(xp),
        xp,
        missions,
        streak.current,
        streak.best,
        earned.join(', '),
        csvDate(student.created_at),
        csvDate(student.last_active_at),
      ]
    }),
  }
}

function exportQuests(tx: SqlReader): CsvTable {
  const progress = progressByQuest(tx)
  return {
    header: [
      'Titre',
      'Catégorie',
      'Format',
      'Difficulté',
      'Récompense (XP)',
      'Deadline',
      'État',
      'Validation',
      'Seuil de réussite (%)',
      'Tentatives',
      'Élèves',
      'Validées',
      'À valider',
      'Création',
    ],
    rows: listQuests(tx)
      .sort((first, second) => first.created_at.localeCompare(second.created_at))
      .map((quest) => {
        const auto = isAutoCorrected(quest.format)
        const done = progress.get(quest.id) ?? { assigned: 0, validated: 0, submitted: 0 }
        return [
          quest.title,
          findCategory(quest.category).label,
          findFormat(quest.format).label,
          findDifficulty(quest.difficulty).label,
          quest.reward_xp,
          csvDate(quest.deadline_at),
          findQuestState(quest.state).label,
          auto ? 'Automatique' : quest.manual_validation === 1 ? 'Par l’admin' : 'Immédiate',
          auto ? quest.pass_threshold : null,
          auto ? quest.max_attempts : null,
          done.assigned,
          done.validated,
          done.submitted,
          csvDate(quest.created_at),
        ]
      }),
  }
}

interface AssignmentExportRow extends SqlRow {
  status: StoredAssignmentStatus
  assigned_at: string
  started_at: string | null
  submitted_at: string | null
  validated_at: string | null
  reopened_at: string | null
  xp_awarded: number | null
  admin_comment: string | null
  title: string
  deadline_at: string | null
  pseudo: string
  public_id: string | null
  attempts_used: number
  best_score: number | null
}

function exportAssignments(tx: SqlReader, now: Date): CsvTable {
  const rows = tx.all<AssignmentExportRow>(
    `SELECT assignments.status, assignments.assigned_at, assignments.started_at,
            assignments.submitted_at, assignments.validated_at, assignments.reopened_at,
            assignments.xp_awarded, assignments.admin_comment,
            quests.title, quests.deadline_at, users.pseudo, users.public_id,
            (SELECT COUNT(*) FROM attempts WHERE attempts.assignment_id = assignments.id)
              AS attempts_used,
            (SELECT MAX(score) FROM attempts WHERE attempts.assignment_id = assignments.id)
              AS best_score
     FROM assignments
     JOIN quests ON quests.id = assignments.quest_id
     JOIN users ON users.id = assignments.student_id
     ORDER BY quests.created_at, quests.id, users.pseudo_key`,
  )
  return {
    header: [
      'Quête',
      'Élève',
      'Identifiant',
      'Statut',
      'Deadline',
      'Assignée le',
      'Commencée le',
      'Soumise le',
      'Validée le',
      'XP attribuée',
      'Tentatives',
      'Meilleur score (%)',
      'Commentaire de l’admin',
    ],
    rows: rows.map((row) => [
      row.title,
      row.pseudo,
      row.public_id ?? '',
      findAssignmentStatus(
        effectiveStatus(
          { status: row.status, deadlineAt: row.deadline_at, reopenedAt: row.reopened_at },
          now,
        ),
      ).label,
      csvDate(row.deadline_at),
      csvDate(row.assigned_at),
      csvDate(row.started_at),
      csvDate(row.submitted_at),
      csvDate(row.validated_at),
      row.xp_awarded,
      row.attempts_used,
      row.best_score,
      row.admin_comment ?? '',
    ]),
  }
}

interface JournalExportRow extends SqlRow {
  amount: number
  reason: 'quest' | 'bonus' | 'manual' | 'bot'
  detail: string | null
  mission_delta: number
  created_at: string
  pseudo: string
  public_id: string | null
  role: 'student' | 'bot'
  quest_title: string | null
}

const REASON_LABELS: Record<JournalExportRow['reason'], string> = {
  quest: 'Quête',
  bonus: 'Bonus',
  manual: 'Ajustement manuel',
  bot: 'Bot',
}

/** Ce qui précise une ligne du journal : le bonus, le retard, l'annulation, le motif saisi. */
function journalDetail(row: JournalExportRow): string {
  switch (row.reason) {
    case 'quest':
      if (row.detail === 'cancelled') return 'Validation annulée'
      return row.detail === 'late' ? 'Rendue en retard' : ''
    case 'bonus':
      return BONUS_LABELS[row.detail as BonusKind] ?? ''
    case 'manual':
      return row.detail ?? ''
    case 'bot':
      return ''
  }
}

function exportXpJournal(tx: SqlReader): CsvTable {
  const rows = tx.all<JournalExportRow>(
    `SELECT xp_entries.amount, xp_entries.reason, xp_entries.detail, xp_entries.mission_delta,
            xp_entries.created_at, users.pseudo, users.public_id, users.role,
            quests.title AS quest_title
     FROM xp_entries
     JOIN users ON users.id = xp_entries.user_id
     LEFT JOIN assignments ON assignments.id = xp_entries.assignment_id
     LEFT JOIN quests ON quests.id = assignments.quest_id
     ORDER BY xp_entries.created_at, xp_entries.rowid`,
  )
  return {
    header: [
      'Date',
      'Participant',
      'Identifiant',
      'Rôle',
      'Montant (XP)',
      'Motif',
      'Détail',
      'Quête',
      'Mission',
    ],
    rows: rows.map((row) => [
      csvDate(row.created_at),
      row.pseudo,
      row.public_id ?? '',
      row.role === 'bot' ? 'Bot' : 'Élève',
      row.amount,
      REASON_LABELS[row.reason],
      journalDetail(row),
      row.quest_title ?? '',
      row.mission_delta,
    ]),
  }
}
