import { randomUUID } from 'node:crypto'
import { effectiveStatus } from '../../shared/rules/assignment-status.js'
import {
  isAutoCorrected,
  type QuestCategory,
  type QuestDifficulty,
  type QuestFormat,
  type QuestState,
  type StoredAssignmentStatus,
} from '../../shared/rules/quests.js'
import type {
  AdminAssignment,
  AdminQuestItem,
  AdminQuestSummary,
  Assignees,
  QuestInput,
  QuestProgress,
} from '../../shared/schemas/quests.js'
import type { SqlReader, SqlRow, SqlWriter } from '../db/sqlite.js'

/** Accès aux quêtes, aux assignations et aux tentatives en base. */
export interface QuestRow extends SqlRow {
  id: string
  title: string
  instructions: string
  image_key: string | null
  category: QuestCategory
  format: QuestFormat
  difficulty: QuestDifficulty
  reward_xp: number
  deadline_at: string | null
  manual_validation: number
  pass_threshold: number
  max_attempts: number
  state: QuestState
  draft_assignees: string
  author_id: string | null
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface QuestItemRow extends SqlRow {
  id: string
  quest_id: string
  position: number
  kind: 'question' | 'choice' | 'card'
  prompt: string
  expected_answers: string
  choices: string
  explanation: string
}

export interface AssignmentRow extends SqlRow {
  id: string
  quest_id: string
  student_id: string
  status: StoredAssignmentStatus
  assigned_at: string
  started_at: string | null
  submitted_at: string | null
  validated_at: string | null
  xp_awarded: number | null
  admin_comment: string | null
  extra_attempts: number
  reopened_at: string | null
}

export interface AttemptRow extends SqlRow {
  id: string
  assignment_id: string
  number: number
  answers: string
  score: number | null
  results: string
  created_at: string
}

/** Élément d'une quête, réponses attendues comprises. */
export interface QuestItem extends AdminQuestItem {
  position: number
}

const ITEM_KIND: Partial<Record<QuestFormat, QuestItemRow['kind']>> = {
  exact: 'question',
  qcm: 'choice',
  flashcards: 'card',
}

function parseJson<Value>(text: string, fallback: Value): Value {
  try {
    return JSON.parse(text) as Value
  } catch {
    return fallback
  }
}

// --- Quêtes ----------------------------------------------------------------------------------

export function findQuest(tx: SqlReader, id: string): QuestRow | undefined {
  return tx.get<QuestRow>('SELECT * FROM quests WHERE id = ?', [id])
}

/** Toutes les quêtes, des plus récemment modifiées aux plus anciennes. */
export function listQuests(tx: SqlReader): QuestRow[] {
  return tx.all<QuestRow>('SELECT * FROM quests ORDER BY updated_at DESC, id')
}

export function listItems(tx: SqlReader, questId: string): QuestItem[] {
  const rows = tx.all<QuestItemRow>(
    'SELECT * FROM quest_items WHERE quest_id = ? ORDER BY position',
    [questId],
  )
  return rows.map((row) => {
    const expected = parseJson<(string | number)[]>(row.expected_answers, [])
    return {
      id: row.id,
      position: row.position,
      prompt: row.prompt,
      answers: row.kind === 'choice' ? [] : expected.map(String),
      choices: parseJson<string[]>(row.choices, []),
      correct: row.kind === 'choice' ? expected.map(Number) : [],
      explanation: row.explanation,
    }
  })
}

function replaceItems(tx: SqlWriter, questId: string, quest: QuestInput): void {
  tx.run('DELETE FROM quest_items WHERE quest_id = ?', [questId])
  const kind = ITEM_KIND[quest.format]
  if (!kind) return
  quest.items.forEach((item, position) => {
    tx.run(
      `INSERT INTO quest_items
         (id, quest_id, position, kind, prompt, expected_answers, choices, explanation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        questId,
        position,
        kind,
        item.prompt,
        JSON.stringify(kind === 'choice' ? item.correct : item.answers),
        JSON.stringify(item.choices),
        item.explanation,
      ],
    )
  })
}

export interface SaveOptions {
  state: QuestState
  now: Date
}

/** Crée une quête à partir d'une saisie déjà mise en forme (voir normalizeQuestInput). */
export function insertQuest(
  tx: SqlWriter,
  quest: QuestInput,
  options: SaveOptions & { authorId: string | null },
): string {
  const id = randomUUID()
  const at = options.now.toISOString()
  tx.run(
    `INSERT INTO quests (
       id, title, instructions, category, format, difficulty, reward_xp, deadline_at,
       manual_validation, pass_threshold, max_attempts, state, draft_assignees, author_id,
       created_at, updated_at, published_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      quest.title,
      quest.instructions,
      quest.category,
      quest.format,
      quest.difficulty,
      quest.rewardXp,
      quest.deadlineAt,
      quest.manualValidation ? 1 : 0,
      quest.passThreshold,
      quest.maxAttempts,
      options.state,
      JSON.stringify(options.state === 'draft' ? quest.assignees : []),
      options.authorId,
      at,
      at,
      options.state === 'published' ? at : null,
    ],
  )
  replaceItems(tx, id, quest)
  return id
}

/** Remplace tout le contenu d'une quête : réglages et éléments. */
export function replaceQuest(
  tx: SqlWriter,
  id: string,
  quest: QuestInput,
  options: SaveOptions,
): void {
  const at = options.now.toISOString()
  tx.run(
    `UPDATE quests SET
       title = ?, instructions = ?, category = ?, format = ?, difficulty = ?, reward_xp = ?,
       deadline_at = ?, manual_validation = ?, pass_threshold = ?, max_attempts = ?, state = ?,
       draft_assignees = ?, updated_at = ?,
       published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, ?) ELSE published_at END
     WHERE id = ?`,
    [
      quest.title,
      quest.instructions,
      quest.category,
      quest.format,
      quest.difficulty,
      quest.rewardXp,
      quest.deadlineAt,
      quest.manualValidation ? 1 : 0,
      quest.passThreshold,
      quest.maxAttempts,
      options.state,
      JSON.stringify(options.state === 'draft' ? quest.assignees : []),
      at,
      options.state,
      at,
      id,
    ],
  )
  replaceItems(tx, id, quest)
}

/** Ne change que ce qui reste modifiable une fois qu'un élève a soumis. */
export function updateOpenFields(
  tx: SqlWriter,
  id: string,
  fields: Pick<QuestInput, 'title' | 'instructions' | 'deadlineAt'>,
  now: Date,
): void {
  tx.run(
    'UPDATE quests SET title = ?, instructions = ?, deadline_at = ?, updated_at = ? WHERE id = ?',
    [fields.title, fields.instructions, fields.deadlineAt, now.toISOString(), id],
  )
}

export function setQuestState(tx: SqlWriter, id: string, state: QuestState, now: Date): void {
  const at = now.toISOString()
  tx.run(
    `UPDATE quests SET state = ?, updated_at = ?,
       draft_assignees = CASE WHEN ? = 'draft' THEN draft_assignees ELSE '[]' END,
       published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, ?) ELSE published_at END
     WHERE id = ?`,
    [state, at, state, state, at, id],
  )
}

export function deleteQuest(tx: SqlWriter, id: string): void {
  tx.run('DELETE FROM quests WHERE id = ?', [id])
}

/** La saisie telle qu'elle est enregistrée, pour comparer ou dupliquer une quête. */
export function toQuestInput(row: QuestRow, items: readonly QuestItem[]): QuestInput {
  return {
    title: row.title,
    instructions: row.instructions,
    category: row.category,
    format: row.format,
    difficulty: row.difficulty,
    rewardXp: row.reward_xp,
    deadlineAt: row.deadline_at,
    manualValidation: row.manual_validation === 1,
    passThreshold: row.pass_threshold,
    maxAttempts: row.max_attempts,
    items: items.map(({ prompt, answers, choices, correct, explanation }) => ({
      prompt,
      answers,
      choices,
      correct,
      explanation,
    })),
    assignees: draftAssignees(row),
  }
}

export function draftAssignees(row: QuestRow): Assignees {
  const stored = parseJson<unknown>(row.draft_assignees, [])
  if (stored === 'all') return 'all'
  return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : []
}

/** Vrai dès qu'un élève a soumis : les questions et la récompense sont alors figées. */
export function questIsLocked(tx: SqlReader, questId: string): boolean {
  return (
    tx.get(
      `SELECT 1 AS locked FROM attempts
       JOIN assignments ON assignments.id = attempts.assignment_id
       WHERE assignments.quest_id = ? LIMIT 1`,
      [questId],
    ) !== undefined
  )
}

// --- Assignations ----------------------------------------------------------------------------

/**
 * Donne la quête aux élèves désignés : tous les élèves actifs, ou ceux de la
 * liste qui existent et sont actifs. Un élève qui l'a déjà la garde telle quelle.
 * Renvoie le nombre d'élèves ajoutés.
 */
export function assignQuest(
  tx: SqlWriter,
  questId: string,
  assignees: Assignees,
  now: Date,
): number {
  const active = tx.all<{ id: string }>(
    `SELECT id FROM users WHERE role = 'student' AND is_active = 1 ORDER BY pseudo_key`,
  )
  const wanted = assignees === 'all' ? null : new Set(assignees)
  const already = new Set(
    tx
      .all<{ student_id: string }>('SELECT student_id FROM assignments WHERE quest_id = ?', [
        questId,
      ])
      .map((row) => row.student_id),
  )

  let added = 0
  for (const { id } of active) {
    if ((wanted && !wanted.has(id)) || already.has(id)) continue
    tx.run(
      `INSERT INTO assignments (id, quest_id, student_id, status, assigned_at)
       VALUES (?, ?, ?, 'todo', ?)`,
      [randomUUID(), questId, id, now.toISOString()],
    )
    added += 1
  }
  return added
}

export function findAssignment(tx: SqlReader, id: string): AssignmentRow | undefined {
  return tx.get<AssignmentRow>('SELECT * FROM assignments WHERE id = ?', [id])
}

export function findAssignmentOf(
  tx: SqlReader,
  questId: string,
  studentId: string,
): AssignmentRow | undefined {
  return tx.get<AssignmentRow>('SELECT * FROM assignments WHERE quest_id = ? AND student_id = ?', [
    questId,
    studentId,
  ])
}

export function listAttempts(tx: SqlReader, assignmentId: string): AttemptRow[] {
  return tx.all<AttemptRow>('SELECT * FROM attempts WHERE assignment_id = ? ORDER BY number', [
    assignmentId,
  ])
}

export function attemptsAllowed(
  quest: QuestRow,
  assignment: Pick<AssignmentRow, 'extra_attempts'>,
): number {
  return quest.max_attempts + assignment.extra_attempts
}

/**
 * Tentatives épuisées sans atteindre le seuil : la quête reste en cours, mais
 * l'élève ne peut plus répondre tant que l'admin ne lui redonne pas de tentatives.
 */
export function isBlocked(
  quest: QuestRow,
  assignment: Pick<AssignmentRow, 'status' | 'extra_attempts'>,
  attemptsUsed: number,
): boolean {
  return (
    isAutoCorrected(quest.format) &&
    assignment.status !== 'validated' &&
    attemptsUsed >= attemptsAllowed(quest, assignment)
  )
}

interface AssignmentWithStudentRow extends AssignmentRow {
  pseudo: string
  public_id: string | null
  avatar: string
  is_active: number
  attempts_used: number
  best_score: number | null
}

const ASSIGNMENT_WITH_STUDENT = `
  SELECT assignments.*, users.pseudo, users.public_id, users.avatar, users.is_active,
         (SELECT COUNT(*) FROM attempts WHERE attempts.assignment_id = assignments.id)
           AS attempts_used,
         (SELECT MAX(score) FROM attempts WHERE attempts.assignment_id = assignments.id)
           AS best_score
  FROM assignments
  JOIN users ON users.id = assignments.student_id
`

function toAdminAssignment(
  row: AssignmentWithStudentRow,
  quest: QuestRow,
  now: Date,
): AdminAssignment {
  return {
    id: row.id,
    student: {
      id: row.student_id,
      pseudo: row.pseudo,
      publicId: row.public_id ?? '',
      avatar: row.avatar,
      isActive: row.is_active === 1,
    },
    status: effectiveStatus(
      { status: row.status, deadlineAt: quest.deadline_at, reopenedAt: row.reopened_at },
      now,
    ),
    blocked: isBlocked(quest, row, row.attempts_used),
    attemptsUsed: row.attempts_used,
    attemptsAllowed: attemptsAllowed(quest, row),
    bestScore: row.best_score,
    assignedAt: row.assigned_at,
    submittedAt: row.submitted_at,
    validatedAt: row.validated_at,
    xpAwarded: row.xp_awarded,
    adminComment: row.admin_comment,
  }
}

/** L'avancement de chaque élève sur une quête, par ordre alphabétique des pseudos. */
export function listAdminAssignments(tx: SqlReader, quest: QuestRow, now: Date): AdminAssignment[] {
  const rows = tx.all<AssignmentWithStudentRow>(
    `${ASSIGNMENT_WITH_STUDENT} WHERE assignments.quest_id = ? ORDER BY users.pseudo_key`,
    [quest.id],
  )
  return rows.map((row) => toAdminAssignment(row, quest, now))
}

export function findAdminAssignment(
  tx: SqlReader,
  assignmentId: string,
  quest: QuestRow,
  now: Date,
): AdminAssignment | undefined {
  const row = tx.get<AssignmentWithStudentRow>(
    `${ASSIGNMENT_WITH_STUDENT} WHERE assignments.id = ?`,
    [assignmentId],
  )
  return row && toAdminAssignment(row, quest, now)
}

/** Avancement de chaque quête : élèves assignés, validations, soumissions en attente. */
export function progressByQuest(tx: SqlReader): Map<string, QuestProgress> {
  const rows = tx.all<{ quest_id: string; assigned: number; validated: number; submitted: number }>(
    `SELECT quest_id,
            COUNT(*) AS assigned,
            SUM(status = 'validated') AS validated,
            SUM(status = 'submitted') AS submitted
     FROM assignments GROUP BY quest_id`,
  )
  return new Map(
    rows.map((row) => [
      row.quest_id,
      { assigned: row.assigned, validated: row.validated, submitted: row.submitted },
    ]),
  )
}

export function toAdminQuestSummary(
  row: QuestRow,
  progress: QuestProgress | undefined,
): AdminQuestSummary {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    format: row.format,
    difficulty: row.difficulty,
    rewardXp: row.reward_xp,
    deadlineAt: row.deadline_at,
    state: row.state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    progress: progress ?? { assigned: 0, validated: 0, submitted: 0 },
  }
}
