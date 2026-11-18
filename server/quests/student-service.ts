import { randomInt, randomUUID } from 'node:crypto'
import { answerKey } from '../../shared/rules/answers.js'
import { effectiveStatus } from '../../shared/rules/assignment-status.js'
import { isAutoCorrected, type AssignmentStatus } from '../../shared/rules/quests.js'
import type {
  AttemptRequest,
  AttemptResult,
  StudentQuestDetail,
  StudentQuestItem,
  StudentQuestSummary,
} from '../../shared/schemas/quests.js'
import type { SqlReader, SqlWriter } from '../db/sqlite.js'
import { ApiError, notFound } from '../http.js'
import { creditValidation, readReward } from './credit.js'
import { grade } from './grading.js'
import { imageUrl } from './images.js'
import {
  attemptsAllowed,
  findAssignmentOf,
  findQuest,
  isBlocked,
  listAttempts,
  listItems,
  type AssignmentRow,
  type AttemptRow,
  type QuestItem,
  type QuestRow,
} from './store.js'

/** Ce que l'élève fait de ses quêtes : les lire, les commencer, y répondre. */

/** Nombre de réponses proposées par question au test des cartes de mémorisation. */
const CARD_OPTIONS = 4

const questNotFound = () => notFound('Cette quête est introuvable.')
const conflict = (code: string, message: string) => new ApiError(409, code, message)

/** Ce qu'il faut d'une assignation pour la résumer. */
type AssignmentFacts = Pick<
  AssignmentRow,
  | 'status'
  | 'assigned_at'
  | 'submitted_at'
  | 'validated_at'
  | 'xp_awarded'
  | 'extra_attempts'
  | 'reopened_at'
>

interface MyQuestRow extends QuestRow, AssignmentFacts {
  attempts_used: number
}

function statusOf(quest: QuestRow, assignment: AssignmentFacts, now: Date): AssignmentStatus {
  return effectiveStatus(
    {
      status: assignment.status,
      deadlineAt: quest.deadline_at,
      reopenedAt: assignment.reopened_at,
    },
    now,
  )
}

function toSummary(
  quest: QuestRow,
  assignment: AssignmentFacts,
  attemptsUsed: number,
  now: Date,
): StudentQuestSummary {
  return {
    id: quest.id,
    title: quest.title,
    category: quest.category,
    format: quest.format,
    difficulty: quest.difficulty,
    rewardXp: quest.reward_xp,
    deadlineAt: quest.deadline_at,
    status: statusOf(quest, assignment, now),
    blocked: isBlocked(quest, assignment, attemptsUsed),
    assignedAt: assignment.assigned_at,
    submittedAt: assignment.submitted_at,
    validatedAt: assignment.validated_at,
    xpAwarded: assignment.xp_awarded,
  }
}

/**
 * Les quêtes de l'élève. Une quête archivée disparaît de ses listes, sauf s'il
 * l'a validée : elle reste alors dans ses quêtes terminées.
 */
export function listMyQuests(tx: SqlReader, studentId: string, now: Date): StudentQuestSummary[] {
  const rows = tx.all<MyQuestRow>(
    `SELECT quests.*,
            assignments.status, assignments.assigned_at, assignments.submitted_at,
            assignments.validated_at, assignments.xp_awarded, assignments.extra_attempts,
            assignments.reopened_at,
            (SELECT COUNT(*) FROM attempts WHERE attempts.assignment_id = assignments.id)
              AS attempts_used
     FROM assignments
     JOIN quests ON quests.id = assignments.quest_id
     WHERE assignments.student_id = ?
       AND (quests.state = 'published'
            OR (quests.state = 'archived' AND assignments.status = 'validated'))
     ORDER BY quests.deadline_at IS NULL, quests.deadline_at, assignments.assigned_at DESC`,
    [studentId],
  )
  return rows.map((row) => toSummary(row, row, row.attempts_used, now))
}

/** La quête et l'assignation de l'élève, s'il a le droit de la voir. */
export function requireMyQuest(
  tx: SqlReader,
  studentId: string,
  questId: string,
): { quest: QuestRow; assignment: AssignmentRow } {
  const quest = findQuest(tx, questId)
  const assignment = quest && findAssignmentOf(tx, questId, studentId)
  // Même réponse que la quête n'existe pas ou qu'elle soit celle d'un autre : rien ne fuit.
  if (!quest || !assignment) throw questNotFound()
  const visible =
    quest.state === 'published' || (quest.state === 'archived' && assignment.status === 'validated')
  if (!visible) throw questNotFound()
  return { quest, assignment }
}

function shuffled<Value>(values: readonly Value[]): Value[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = randomInt(index + 1)
    ;[result[index], result[other]] = [result[other]!, result[index]!]
  }
  return result
}

/**
 * Réponses proposées pour une carte au test : son verso et jusqu'à trois versos
 * d'autres cartes, mélangés. Chaque réponse est désignée par une carte qui la porte.
 */
function cardOptions(card: QuestItem, cards: readonly QuestItem[]): { id: string; text: string }[] {
  const ownKey = answerKey(card.answers[0] ?? '')
  const others = new Map<string, QuestItem>()
  for (const other of shuffled(cards)) {
    const key = answerKey(other.answers[0] ?? '')
    if (key !== '' && key !== ownKey && !others.has(key)) others.set(key, other)
  }
  const distractors = [...others.values()].slice(0, CARD_OPTIONS - 1)
  return shuffled([card, ...distractors]).map((option) => ({
    id: option.id,
    text: option.answers[0] ?? '',
  }))
}

/** Les éléments tels que l'élève les reçoit : jamais les réponses attendues. */
function toStudentItems(quest: QuestRow, items: readonly QuestItem[]): StudentQuestItem[] {
  return items.map((item): StudentQuestItem => {
    switch (quest.format) {
      case 'qcm':
        return {
          id: item.id,
          prompt: item.prompt,
          choices: item.choices,
          multiple: item.correct.length > 1,
        }
      case 'flashcards':
        // Le verso d'une carte est fait pour être lu : il fait partie de la quête.
        return {
          id: item.id,
          prompt: item.prompt,
          back: item.answers[0] ?? '',
          options: cardOptions(item, items),
        }
      default:
        return { id: item.id, prompt: item.prompt }
    }
  })
}

function toAttemptResult(row: AttemptRow): AttemptResult {
  let stored: Partial<AttemptRequest> = {}
  let results: Record<string, boolean> = {}
  try {
    stored = JSON.parse(row.answers) as Partial<AttemptRequest>
    results = JSON.parse(row.results) as Record<string, boolean>
  } catch {
    // Une tentative illisible s'affiche comme une tentative vide.
  }
  return {
    number: row.number,
    score: row.score,
    results,
    answers: stored.answers ?? {},
    comment: stored.comment ?? '',
    text: stored.text ?? '',
    createdAt: row.created_at,
  }
}

/** Corrigé d'une quête validée : les réponses attendues, ou les bons choix d'un QCM. */
function corrections(
  quest: QuestRow,
  items: readonly QuestItem[],
): Record<string, string[]> | null {
  if (quest.format === 'exact') {
    return Object.fromEntries(items.map((item) => [item.id, item.answers]))
  }
  if (quest.format === 'qcm') {
    return Object.fromEntries(
      items.map((item) => [
        item.id,
        item.correct.map((position) => item.choices[position] ?? '').filter(Boolean),
      ]),
    )
  }
  return null
}

export function readMyQuest(
  tx: SqlReader,
  studentId: string,
  questId: string,
  now: Date,
): StudentQuestDetail {
  const { quest, assignment } = requireMyQuest(tx, studentId, questId)
  const items = listItems(tx, questId)
  const attempts = listAttempts(tx, assignment.id)
  const last = attempts.at(-1)
  const validated = assignment.status === 'validated'

  return {
    ...toSummary(quest, assignment, attempts.length, now),
    instructions: quest.instructions,
    imageUrl: imageUrl(quest, 'student'),
    manualValidation: quest.manual_validation === 1,
    passThreshold: quest.pass_threshold,
    attemptsUsed: attempts.length,
    attemptsAllowed: attemptsAllowed(quest, assignment),
    items: toStudentItems(quest, items),
    lastAttempt: last ? toAttemptResult(last) : null,
    adminComment: assignment.admin_comment,
    reward: readReward(tx, assignment),
    corrections: validated ? corrections(quest, items) : null,
  }
}

/** L'élève ouvre la quête : elle passe de « À faire » à « En cours ». */
export function startMyQuest(tx: SqlWriter, studentId: string, questId: string, now: Date): void {
  const { quest, assignment } = requireMyQuest(tx, studentId, questId)
  if (assignment.status !== 'todo' || statusOf(quest, assignment, now) === 'expired') return
  tx.run(`UPDATE assignments SET status = 'in_progress', started_at = ? WHERE id = ?`, [
    now.toISOString(),
    assignment.id,
  ])
}

/**
 * L'élève répond à une quête. Selon le format, la réponse est corrigée aussitôt
 * (et la quête validée si le seuil est atteint) ou soumise à l'admin.
 */
export function submitAttempt(
  tx: SqlWriter,
  studentId: string,
  questId: string,
  request: AttemptRequest,
  now: Date,
): void {
  const { quest, assignment } = requireMyQuest(tx, studentId, questId)

  if (quest.state !== 'published') {
    throw conflict('quest_archived', 'Cette quête n’est plus disponible.')
  }
  if (assignment.status === 'validated') {
    throw conflict('already_validated', 'Cette quête est déjà validée.')
  }
  if (assignment.status === 'submitted') {
    throw conflict('already_submitted', 'Ta réponse est déjà en attente de validation.')
  }
  // Toute soumission tardive est refusée : le serveur, pas le navigateur, juge de la deadline.
  if (statusOf(quest, assignment, now) === 'expired') {
    throw conflict('expired', 'La deadline est passée\u00A0: cette quête est expirée.')
  }

  const used = listAttempts(tx, assignment.id).length
  const number = used + 1
  const at = now.toISOString()
  const record = (score: number | null, results: Record<string, boolean>) =>
    tx.run(
      `INSERT INTO attempts (id, assignment_id, number, answers, score, results, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        assignment.id,
        number,
        JSON.stringify(request),
        score,
        JSON.stringify(results),
        at,
      ],
    )
  // Répondre, c'est avoir commencé : la date de début est posée si elle ne l'était pas.
  tx.run('UPDATE assignments SET started_at = COALESCE(started_at, ?) WHERE id = ?', [
    at,
    assignment.id,
  ])

  if (isAutoCorrected(quest.format)) {
    if (used >= attemptsAllowed(quest, assignment)) {
      throw conflict(
        'no_attempts_left',
        'Tu as utilisé toutes tes tentatives. Demande à ton accompagnant de t’en redonner.',
      )
    }
    const { score, results } = grade(quest.format, listItems(tx, questId), request.answers)
    record(score, results)

    if (score >= quest.pass_threshold) {
      creditValidation(tx, {
        quest,
        assignment,
        completedAt: now,
        flawlessFirstAttempt: number === 1 && score === 100,
        now,
      })
    } else {
      // Seuil non atteint : la quête reste en cours, avec une tentative de moins.
      tx.run(`UPDATE assignments SET status = 'in_progress' WHERE id = ?`, [assignment.id])
    }
    return
  }

  if (quest.format === 'free_text' && request.text === '') {
    throw new ApiError(400, 'invalid_input', 'Certaines informations sont incorrectes.', {
      fields: { text: 'Écris ta réponse avant de l’envoyer.' },
    })
  }
  record(null, {})

  // Une nouvelle soumission répond au commentaire d'un refus précédent : il est retiré.
  tx.run('UPDATE assignments SET submitted_at = ?, admin_comment = NULL WHERE id = ?', [
    at,
    assignment.id,
  ])
  if (quest.manual_validation === 1) {
    tx.run(`UPDATE assignments SET status = 'submitted' WHERE id = ?`, [assignment.id])
  } else {
    // Déclaratif à validation immédiate : « C'est fait » suffit.
    creditValidation(tx, {
      quest,
      assignment,
      completedAt: now,
      flawlessFirstAttempt: false,
      now,
    })
  }
}
