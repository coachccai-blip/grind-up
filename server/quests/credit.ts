import { randomUUID } from 'node:crypto'
import { computeReward, type BonusKind, type RewardBreakdown } from '../../shared/rules/rewards.js'
import type { SqlReader, SqlWriter } from '../db/sqlite.js'
import type { AssignmentRow, QuestRow } from './store.js'

/**
 * Validation d'une quête et crédit de son XP.
 *
 * Le statut, la date et les lignes du journal d'XP sont écrits dans la même
 * transaction : la quête est validée et créditée, ou rien ne change. Une
 * assignation ne crédite l'XP qu'une seule fois, même en cas de double clic ou
 * de requête rejouée (section 10 du brief).
 */
export interface ValidationFacts {
  quest: QuestRow
  assignment: AssignmentRow
  /** Date qui fait foi : la soumission pour une validation manuelle, sinon l'instant présent. */
  completedAt: Date
  /** Format corrigé automatiquement, réussi à 100 % dès la première tentative. */
  flawlessFirstAttempt: boolean
  now: Date
  /** Commentaire de l'admin ; null pour garder celui qui existe. */
  comment?: string | null
}

/** Nombre net de missions déjà créditées pour cette assignation : 0 ou 1. */
function creditedMissions(tx: SqlReader, assignmentId: string): number {
  return (
    tx.get<{ missions: number }>(
      'SELECT COALESCE(SUM(mission_delta), 0) AS missions FROM xp_entries WHERE assignment_id = ?',
      [assignmentId],
    )?.missions ?? 0
  )
}

export function creditValidation(tx: SqlWriter, facts: ValidationFacts): RewardBreakdown {
  const { quest, assignment, now } = facts
  // Double garde-fou : le statut, puis le journal lui-même.
  if (assignment.status === 'validated' || creditedMissions(tx, assignment.id) !== 0) {
    throw new Error(`L’assignation ${assignment.id} est déjà créditée.`)
  }

  const reward = computeReward({
    reward: quest.reward_xp,
    deadlineAt: quest.deadline_at,
    completedAt: facts.completedAt,
    flawlessFirstAttempt: facts.flawlessFirstAttempt,
  })
  const at = now.toISOString()

  tx.run(
    `UPDATE assignments
     SET status = 'validated', validated_at = ?, xp_awarded = ?,
         admin_comment = COALESCE(?, admin_comment)
     WHERE id = ?`,
    [at, reward.total, facts.comment ?? null, assignment.id],
  )

  const addLine = (
    amount: number,
    reason: 'quest' | 'bonus',
    detail: string | null,
    mission: 0 | 1,
  ) =>
    tx.run(
      `INSERT INTO xp_entries (id, user_id, amount, reason, detail, assignment_id, mission_delta, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), assignment.student_id, amount, reason, detail, assignment.id, mission, at],
    )

  addLine(reward.base, 'quest', reward.late ? 'late' : null, 1)
  for (const bonus of reward.bonuses) addLine(bonus.amount, 'bonus', bonus.kind, 0)

  return reward
}

/** Détail de l'XP créditée à la validation d'une assignation, relu dans le journal. */
export function readReward(tx: SqlReader, assignment: AssignmentRow): RewardBreakdown | null {
  if (assignment.status !== 'validated' || !assignment.validated_at) return null
  const lines = tx.all<{ amount: number; reason: string; detail: string | null }>(
    `SELECT amount, reason, detail FROM xp_entries
     WHERE assignment_id = ? AND created_at = ? AND reason IN ('quest', 'bonus')
     ORDER BY reason DESC, rowid`,
    [assignment.id, assignment.validated_at],
  )
  const quest = lines.find((line) => line.reason === 'quest')
  if (!quest) return null
  const bonuses = lines
    .filter((line) => line.reason === 'bonus')
    .map((line) => ({ kind: line.detail as BonusKind, amount: line.amount }))
  return {
    base: quest.amount,
    late: quest.detail === 'late',
    bonuses,
    total: quest.amount + bonuses.reduce((sum, bonus) => sum + bonus.amount, 0),
  }
}
