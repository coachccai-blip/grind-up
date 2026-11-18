import type { AssignmentStatus, StoredAssignmentStatus } from './quests.js'

/**
 * Statut d'une quête assignée, tel qu'il doit être lu à un instant donné.
 *
 * « Expirée » n'est jamais enregistré : le serveur le déduit de la deadline à
 * chaque lecture, sans tâche planifiée (section 10 du brief). Une quête soumise
 * ou validée n'expire pas. Une quête rouverte par l'admin après sa deadline
 * redevient réalisable, jusqu'à une éventuelle nouvelle deadline.
 */
export interface StatusFacts {
  status: StoredAssignmentStatus
  /** Deadline de la quête (UTC, ISO 8601), ou null. */
  deadlineAt: string | null
  /** Date à laquelle l'admin a rouvert cette quête pour cet élève, ou null. */
  reopenedAt: string | null
}

const time = (iso: string) => new Date(iso).getTime()

/** Vrai si la deadline est passée et que l'admin n'a pas rouvert la quête depuis. */
export function isPastDeadline(
  facts: Pick<StatusFacts, 'deadlineAt' | 'reopenedAt'>,
  now: Date,
): boolean {
  if (!facts.deadlineAt) return false
  const deadline = time(facts.deadlineAt)
  if (now.getTime() <= deadline) return false
  return !(facts.reopenedAt && time(facts.reopenedAt) > deadline)
}

export function effectiveStatus(facts: StatusFacts, now: Date): AssignmentStatus {
  if (facts.status === 'submitted' || facts.status === 'validated') return facts.status
  return isPastDeadline(facts, now) ? 'expired' : facts.status
}

/** Vrai si la réalisation arrive après la deadline : possible seulement après une réouverture. */
export function isLate(deadlineAt: string | null, completedAt: Date): boolean {
  return deadlineAt !== null && completedAt.getTime() > time(deadlineAt)
}

/** Onglets de l'écran « Mes quêtes » de l'élève. */
export const QUEST_TABS = [
  { id: 'todo', label: 'À faire', shortLabel: 'À faire' },
  { id: 'pending', label: 'En attente de validation', shortLabel: 'En attente' },
  { id: 'done', label: 'Terminées', shortLabel: 'Terminées' },
  { id: 'expired', label: 'Expirées', shortLabel: 'Expirées' },
] as const
export type QuestTab = (typeof QUEST_TABS)[number]['id']

export function tabOfStatus(status: AssignmentStatus): QuestTab {
  switch (status) {
    case 'submitted':
      return 'pending'
    case 'validated':
      return 'done'
    case 'expired':
      return 'expired'
    default:
      return 'todo'
  }
}
