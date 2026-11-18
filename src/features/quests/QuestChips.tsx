import {
  findAssignmentStatus,
  findCategory,
  findDifficulty,
  findQuestState,
  type AssignmentStatus,
  type QuestCategory,
  type QuestDifficulty,
  type QuestState,
} from '../../../shared/rules/quests'
import { Chip, type ChipTone } from '../../ui/Chip'

/** Étiquettes des quêtes, communes à l'espace élève et à l'espace admin. */

const CATEGORY_TONES: Record<QuestCategory, ChipTone> = {
  maths: 'maths',
  memorization: 'memorisation',
  sport: 'sport',
  other: 'other',
}

export const categoryTone = (category: QuestCategory): ChipTone => CATEGORY_TONES[category]

/** Catégorie d'une quête, sur sa couleur pastel. `withEmoji` quand l'étiquette est le seul emoji de la ligne. */
export function CategoryChip({
  category,
  withEmoji = false,
}: {
  category: QuestCategory
  withEmoji?: boolean
}) {
  const { label, emoji } = findCategory(category)
  return (
    <Chip tone={CATEGORY_TONES[category]} emoji={withEmoji ? emoji : undefined}>
      {label}
    </Chip>
  )
}

/** Vert pour une quête validée, rose pour un refus ; les autres statuts restent neutres. */
const STATUS_TONES: Record<AssignmentStatus, ChipTone> = {
  todo: 'neutral',
  in_progress: 'neutral',
  submitted: 'neutral',
  validated: 'success',
  rejected: 'urgent',
  expired: 'neutral',
}

export function StatusChip({
  status,
  blocked = false,
}: {
  status: AssignmentStatus
  /** Tentatives épuisées : l'élève attend que l'admin lui en redonne. */
  blocked?: boolean
}) {
  if (blocked && status === 'in_progress') return <Chip tone="warning">Tentatives épuisées</Chip>
  return <Chip tone={STATUS_TONES[status]}>{findAssignmentStatus(status).label}</Chip>
}

const STATE_TONES: Record<QuestState, ChipTone> = {
  draft: 'warning',
  published: 'success',
  archived: 'neutral',
}

export function QuestStateChip({ state }: { state: QuestState }) {
  return <Chip tone={STATE_TONES[state]}>{findQuestState(state).label}</Chip>
}

export const difficultyLabel = (difficulty: QuestDifficulty) => findDifficulty(difficulty).label

/** « 100 XP » : l'espace entre le nombre et l'unité ne se coupe pas. */
export const formatXp = (amount: number) => `${amount.toLocaleString('fr-FR')}\u00A0XP`
