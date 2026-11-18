import { effectiveStatus, isLate, isPastDeadline } from '../../shared/rules/assignment-status.js'
import { isAutoCorrected } from '../../shared/rules/quests.js'
import {
  normalizeQuestInput,
  publishProblems,
  QUEST_TITLE_MAX,
  type AdminAssignment,
  type AdminQuestDetail,
  type AdminQuestSummary,
  type Assignees,
  type PendingValidation,
  type QuestInput,
  type RejectRequest,
  type SaveQuestRequest,
} from '../../shared/schemas/quests.js'
import type { SqlReader, SqlWriter } from '../db/sqlite.js'
import { ApiError, notFound } from '../http.js'
import { cancelValidation, creditValidation } from './credit.js'
import { imageUrl } from './images.js'
import {
  assignQuest,
  deleteQuest,
  draftAssignees,
  findAdminAssignment,
  findAssignment,
  findQuest,
  insertQuest,
  listAdminAssignments,
  listAttempts,
  listItems,
  listQuests,
  progressByQuest,
  questIsLocked,
  replaceQuest,
  setQuestState,
  toAdminQuestSummary,
  toQuestInput,
  updateOpenFields,
  type AssignmentRow,
  type QuestRow,
} from './store.js'

/** Ce que l'admin fait des quêtes : les créer, les publier, les assigner, valider les réalisations. */

const questNotFound = () => notFound('Cette quête est introuvable.')
const assignmentNotFound = () => notFound('Cette réalisation est introuvable.')

const conflict = (code: string, message: string) => new ApiError(409, code, message)

function requireQuest(tx: SqlReader, id: string): QuestRow {
  const quest = findQuest(tx, id)
  if (!quest) throw questNotFound()
  return quest
}

/** Refuse la publication d'une quête incomplète, en disant quoi corriger. */
function assertPublishable(quest: QuestInput, now: Date, options = { checkDeadline: true }): void {
  const problems = publishProblems(quest, now)
  if (!options.checkDeadline) delete problems.deadlineAt
  if (Object.keys(problems).length > 0) {
    throw new ApiError(400, 'quest_incomplete', 'La quête ne peut pas encore être publiée.', {
      fields: problems,
    })
  }
}

// --- Lecture -----------------------------------------------------------------------------------

export function listAdminQuests(tx: SqlReader): AdminQuestSummary[] {
  const progress = progressByQuest(tx)
  return listQuests(tx).map((row) => toAdminQuestSummary(row, progress.get(row.id)))
}

export function readAdminQuest(tx: SqlReader, id: string, now: Date): AdminQuestDetail {
  const quest = requireQuest(tx, id)
  return {
    ...toAdminQuestSummary(quest, progressByQuest(tx).get(id)),
    instructions: quest.instructions,
    manualValidation: quest.manual_validation === 1,
    passThreshold: quest.pass_threshold,
    maxAttempts: quest.max_attempts,
    imageUrl: imageUrl(quest, 'admin'),
    items: listItems(tx, id).map(
      ({ id: itemId, prompt, answers, choices, correct, explanation }) => ({
        id: itemId,
        prompt,
        answers,
        choices,
        correct,
        explanation,
      }),
    ),
    draftAssignees: draftAssignees(quest),
    locked: questIsLocked(tx, id),
    assignments: listAdminAssignments(tx, quest, now),
  }
}

// --- Création et modification ------------------------------------------------------------------

export function createQuest(
  tx: SqlWriter,
  request: SaveQuestRequest,
  authorId: string,
  now: Date,
): string {
  const { publish, ...input } = request
  const quest = normalizeQuestInput(input)
  if (publish) assertPublishable(quest, now)

  const id = insertQuest(tx, quest, { state: publish ? 'published' : 'draft', authorId, now })
  if (publish) assignQuest(tx, id, quest.assignees, now)
  return id
}

/** Champs figés dès qu'un élève a soumis : tout sauf le titre, la consigne et la deadline. */
function frozenPart(quest: QuestInput): string {
  return JSON.stringify([
    quest.category,
    quest.format,
    quest.difficulty,
    quest.rewardXp,
    quest.manualValidation,
    quest.passThreshold,
    quest.maxAttempts,
    quest.items,
  ])
}

export function updateQuest(tx: SqlWriter, id: string, request: SaveQuestRequest, now: Date): void {
  const stored = requireQuest(tx, id)
  const { publish, ...input } = request
  const quest = normalizeQuestInput(input)

  if (stored.state === 'archived') {
    throw conflict('quest_archived', 'Restaurez cette quête avant de la modifier.')
  }

  if (stored.state === 'draft') {
    if (publish) assertPublishable(quest, now)
    replaceQuest(tx, id, quest, { state: publish ? 'published' : 'draft', now })
    if (publish) assignQuest(tx, id, quest.assignees, now)
    return
  }

  // Quête publiée : elle doit rester réalisable ; la deadline n'est contrôlée que si elle change.
  const deadlineChanged = quest.deadlineAt !== stored.deadline_at
  assertPublishable(quest, now, { checkDeadline: deadlineChanged })

  if (questIsLocked(tx, id)) {
    const before = toQuestInput(stored, listItems(tx, id))
    if (frozenPart(before) !== frozenPart(quest)) {
      throw conflict(
        'quest_locked',
        'Un élève a déjà répondu à cette quête\u00A0: seuls le titre, la consigne et la deadline peuvent encore changer.',
      )
    }
    updateOpenFields(tx, id, quest, now)
  } else {
    replaceQuest(tx, id, quest, { state: 'published', now })
  }
  // Une quête publiée ne perd jamais d'élèves : la liste envoyée ne fait qu'en ajouter.
  assignQuest(tx, id, quest.assignees, now)
}

export function publishQuest(tx: SqlWriter, id: string, now: Date): void {
  const stored = requireQuest(tx, id)
  if (stored.state !== 'draft') {
    throw conflict('not_a_draft', 'Cette quête est déjà publiée.')
  }
  const quest = toQuestInput(stored, listItems(tx, id))
  assertPublishable(quest, now)
  setQuestState(tx, id, 'published', now)
  assignQuest(tx, id, quest.assignees, now)
}

/** Copie une quête en brouillon, sans ses élèves : pour la réassigner ou la décliner. */
export function duplicateQuest(tx: SqlWriter, id: string, authorId: string, now: Date): string {
  const stored = requireQuest(tx, id)
  const suffix = ' (copie)'
  const copy: QuestInput = {
    ...toQuestInput(stored, listItems(tx, id)),
    title: `${stored.title.slice(0, QUEST_TITLE_MAX - suffix.length)}${suffix}`,
    assignees: [],
  }
  return insertQuest(tx, copy, { state: 'draft', authorId, now })
}

export function archiveQuest(tx: SqlWriter, id: string, now: Date): void {
  const stored = requireQuest(tx, id)
  if (stored.state === 'draft') {
    throw conflict('quest_is_draft', 'Un brouillon ne s’archive pas\u00A0: supprimez-le.')
  }
  if (stored.state === 'published') setQuestState(tx, id, 'archived', now)
}

export function restoreQuest(tx: SqlWriter, id: string, now: Date): void {
  const stored = requireQuest(tx, id)
  if (stored.state === 'archived') setQuestState(tx, id, 'published', now)
}

/**
 * Seul un brouillon se supprime : une quête publiée s'archive, pour garder l'XP gagnée.
 * Renvoie l'emplacement de son image, à effacer du stockage.
 */
export function removeDraft(tx: SqlWriter, id: string): string | null {
  const stored = requireQuest(tx, id)
  if (stored.state !== 'draft') {
    throw conflict('not_a_draft', 'Une quête publiée ne se supprime pas\u00A0: archivez-la.')
  }
  deleteQuest(tx, id)
  return stored.image_key
}

/** Ajoute des élèves à une quête publiée. Renvoie le nombre d'élèves ajoutés. */
export function addAssignees(tx: SqlWriter, id: string, assignees: Assignees, now: Date): number {
  const stored = requireQuest(tx, id)
  if (stored.state !== 'published') {
    throw conflict(
      'not_published',
      'Les élèves d’un brouillon se choisissent dans le formulaire de la quête.',
    )
  }
  return assignQuest(tx, id, assignees, now)
}

// --- Validations -------------------------------------------------------------------------------

interface PendingRow extends AssignmentRow {
  quest_title: string
  quest_category: QuestRow['category']
  quest_format: QuestRow['format']
  quest_reward: number
  quest_deadline: string | null
  pseudo: string
  public_id: string | null
  avatar: string
  is_active: number
}

/** Texte de la dernière soumission : la réponse libre, ou le commentaire d'une quête déclarative. */
function submittedAnswer(tx: SqlReader, assignmentId: string): { answer: string; number: number } {
  const last = listAttempts(tx, assignmentId).at(-1)
  if (!last) return { answer: '', number: 0 }
  let stored: { text?: string; comment?: string } = {}
  try {
    stored = JSON.parse(last.answers) as typeof stored
  } catch {
    // Une tentative illisible s'affiche comme une réponse vide.
  }
  return { answer: stored.text || stored.comment || '', number: last.number }
}

/** File de validation : les réalisations soumises, de la plus ancienne à la plus récente. */
export function listPendingValidations(tx: SqlReader): PendingValidation[] {
  const rows = tx.all<PendingRow>(
    `SELECT assignments.*,
            quests.title AS quest_title, quests.category AS quest_category,
            quests.format AS quest_format, quests.reward_xp AS quest_reward,
            quests.deadline_at AS quest_deadline,
            users.pseudo, users.public_id, users.avatar, users.is_active
     FROM assignments
     JOIN quests ON quests.id = assignments.quest_id
     JOIN users ON users.id = assignments.student_id
     WHERE assignments.status = 'submitted' AND quests.state = 'published'
     ORDER BY assignments.submitted_at, assignments.id`,
  )
  return rows.map((row) => {
    const { answer, number } = submittedAnswer(tx, row.id)
    const submittedAt = row.submitted_at ?? row.assigned_at
    return {
      assignmentId: row.id,
      quest: {
        id: row.quest_id,
        title: row.quest_title,
        category: row.quest_category,
        format: row.quest_format,
        rewardXp: row.quest_reward,
        deadlineAt: row.quest_deadline,
      },
      student: {
        id: row.student_id,
        pseudo: row.pseudo,
        publicId: row.public_id ?? '',
        avatar: row.avatar,
        isActive: row.is_active === 1,
      },
      submittedAt,
      late: isLate(row.quest_deadline, new Date(submittedAt)),
      answer,
      attemptNumber: number,
    }
  })
}

function requireAssignment(
  tx: SqlReader,
  id: string,
): { assignment: AssignmentRow; quest: QuestRow } {
  const assignment = findAssignment(tx, id)
  const quest = assignment && findQuest(tx, assignment.quest_id)
  if (!assignment || !quest) throw assignmentNotFound()
  return { assignment, quest }
}

const readBack = (tx: SqlReader, id: string, quest: QuestRow, now: Date): AdminAssignment => {
  const assignment = findAdminAssignment(tx, id, quest, now)
  if (!assignment) throw assignmentNotFound()
  return assignment
}

/**
 * Valide une réalisation soumise et crédite son XP. Rejouée sur une réalisation
 * déjà validée, elle ne crédite rien et renvoie l'état en place.
 */
export function validateSubmission(
  tx: SqlWriter,
  assignmentId: string,
  comment: string,
  now: Date,
): AdminAssignment {
  const { assignment, quest } = requireAssignment(tx, assignmentId)
  if (assignment.status === 'validated') return readBack(tx, assignmentId, quest, now)
  if (assignment.status !== 'submitted') {
    throw conflict('not_submitted', 'Cette réalisation n’est pas en attente de validation.')
  }

  creditValidation(tx, {
    quest,
    assignment,
    // La date de soumission fait foi, pas celle de la validation.
    completedAt: new Date(assignment.submitted_at ?? now.toISOString()),
    flawlessFirstAttempt: false,
    now,
    comment: comment === '' ? null : comment,
  })
  return readBack(tx, assignmentId, quest, now)
}

/** Refuse une réalisation soumise : l'élève lit le commentaire et peut recommencer. */
export function rejectSubmission(
  tx: SqlWriter,
  assignmentId: string,
  request: RejectRequest,
  now: Date,
): AdminAssignment {
  const { assignment, quest } = requireAssignment(tx, assignmentId)
  if (assignment.status !== 'submitted') {
    throw conflict('not_submitted', 'Cette réalisation n’est pas en attente de validation.')
  }
  const reopen =
    request.reopen &&
    isPastDeadline({ deadlineAt: quest.deadline_at, reopenedAt: assignment.reopened_at }, now)
  tx.run(
    `UPDATE assignments
     SET status = 'rejected', admin_comment = ?, reopened_at = COALESCE(?, reopened_at)
     WHERE id = ?`,
    [request.comment, reopen ? now.toISOString() : null, assignmentId],
  )
  return readBack(tx, assignmentId, quest, now)
}

/** Rouvre une quête expirée pour un élève : il peut la réaliser, pour la moitié de la récompense. */
export function reopenAssignment(tx: SqlWriter, assignmentId: string, now: Date): AdminAssignment {
  const { assignment, quest } = requireAssignment(tx, assignmentId)
  const status = effectiveStatus(
    {
      status: assignment.status,
      deadlineAt: quest.deadline_at,
      reopenedAt: assignment.reopened_at,
    },
    now,
  )
  if (status !== 'expired') {
    throw conflict('not_expired', 'Seule une quête expirée peut être rouverte.')
  }
  tx.run('UPDATE assignments SET reopened_at = ? WHERE id = ?', [now.toISOString(), assignmentId])
  return readBack(tx, assignmentId, quest, now)
}

/** Redonne des tentatives à un élève sur une quête corrigée automatiquement. */
export function grantAttempts(
  tx: SqlWriter,
  assignmentId: string,
  count: number,
  now: Date,
): AdminAssignment {
  const { assignment, quest } = requireAssignment(tx, assignmentId)
  if (!isAutoCorrected(quest.format)) {
    throw conflict('no_attempt_limit', 'Cette quête ne limite pas le nombre de tentatives.')
  }
  if (assignment.status === 'validated') {
    throw conflict('already_validated', 'Cette quête est déjà validée.')
  }
  tx.run('UPDATE assignments SET extra_attempts = extra_attempts + ? WHERE id = ?', [
    count,
    assignmentId,
  ])
  return readBack(tx, assignmentId, quest, now)
}

/** Annule une validation : l'XP est retirée, l'élève peut recommencer. */
export function cancelSubmissionValidation(
  tx: SqlWriter,
  assignmentId: string,
  comment: string,
  now: Date,
): AdminAssignment {
  const { assignment, quest } = requireAssignment(tx, assignmentId)
  if (assignment.status !== 'validated') {
    throw conflict('not_validated', 'Cette quête n’est pas validée.')
  }
  cancelValidation(tx, assignment, comment === '' ? null : comment, now)
  return readBack(tx, assignmentId, quest, now)
}
