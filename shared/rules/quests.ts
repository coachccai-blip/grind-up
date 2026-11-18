import type { PaletteColor } from './palette.js'

/**
 * Vocabulaire des quêtes : catégories, formats, difficultés et statuts, avec
 * leurs libellés et leurs emojis (sections 3, 4 et 8 du brief). Le serveur et
 * l'interface lisent les mêmes listes.
 */
export const QUEST_CATEGORIES = [
  { id: 'maths', label: 'Maths', emoji: '🧮', color: 'maths' },
  { id: 'memorization', label: 'Mémorisation', emoji: '🧠', color: 'memorisation' },
  { id: 'sport', label: 'Sport', emoji: '🏃', color: 'sport' },
  { id: 'other', label: 'Autre', emoji: '🧩', color: 'other' },
] as const satisfies readonly { id: string; label: string; emoji: string; color: PaletteColor }[]

export type QuestCategory = (typeof QUEST_CATEGORIES)[number]['id']
export const QUEST_CATEGORY_IDS = QUEST_CATEGORIES.map((category) => category.id) as [
  QuestCategory,
  ...QuestCategory[],
]

/**
 * Formats de quête. `correction` dit qui valide : le serveur (« auto »), l'admin
 * (« manual »), ou l'un des deux au choix de l'admin pour chaque quête (« choice »).
 */
export const QUEST_FORMATS = [
  {
    id: 'exact',
    label: 'Questions à réponse exacte',
    hint: 'L’élève saisit un nombre ou une réponse courte par question.',
    correction: 'auto',
  },
  {
    id: 'qcm',
    label: 'QCM',
    hint: 'L’élève choisit une ou plusieurs réponses par question.',
    correction: 'auto',
  },
  {
    id: 'flashcards',
    label: 'Cartes de mémorisation',
    hint: 'L’élève parcourt des cartes question / réponse, puis passe un test.',
    correction: 'auto',
  },
  {
    id: 'declarative',
    label: 'Déclaratif',
    hint: 'L’élève coche « C’est fait » et peut ajouter un commentaire.',
    correction: 'choice',
  },
  {
    id: 'free_text',
    label: 'Réponse libre',
    hint: 'L’élève écrit un texte, que vous validez.',
    correction: 'manual',
  },
] as const satisfies readonly {
  id: string
  label: string
  hint: string
  correction: 'auto' | 'manual' | 'choice'
}[]

export type QuestFormat = (typeof QUEST_FORMATS)[number]['id']
export const QUEST_FORMAT_IDS = QUEST_FORMATS.map((format) => format.id) as [
  QuestFormat,
  ...QuestFormat[],
]

/** Formats corrigés par le serveur : tentatives comptées, seuil de réussite. */
export const AUTO_CORRECTED_FORMATS: readonly QuestFormat[] = ['exact', 'qcm', 'flashcards']
export const isAutoCorrected = (format: QuestFormat) => AUTO_CORRECTED_FORMATS.includes(format)

/** Format proposé d'emblée pour une catégorie ; l'admin reste libre d'en changer. */
export const SUGGESTED_FORMAT: Record<QuestCategory, QuestFormat> = {
  maths: 'exact',
  memorization: 'flashcards',
  sport: 'declarative',
  other: 'free_text',
}

/** Difficultés et récompense par défaut (section 4 du brief). */
export const QUEST_DIFFICULTIES = [
  { id: 'easy', label: 'Facile', emoji: '🌱', defaultReward: 50 },
  { id: 'medium', label: 'Moyen', emoji: '⚡', defaultReward: 100 },
  { id: 'hard', label: 'Difficile', emoji: '🌋', defaultReward: 200 },
  { id: 'epic', label: 'Épique', emoji: '🐉', defaultReward: 400 },
] as const satisfies readonly { id: string; label: string; emoji: string; defaultReward: number }[]

export type QuestDifficulty = (typeof QUEST_DIFFICULTIES)[number]['id']
export const QUEST_DIFFICULTY_IDS = QUEST_DIFFICULTIES.map((difficulty) => difficulty.id) as [
  QuestDifficulty,
  ...QuestDifficulty[],
]

/** États d'une quête, côté admin. */
export const QUEST_STATES = [
  { id: 'draft', label: 'Brouillon' },
  { id: 'published', label: 'Publiée' },
  { id: 'archived', label: 'Archivée' },
] as const
export type QuestState = (typeof QUEST_STATES)[number]['id']
export const QUEST_STATE_IDS = QUEST_STATES.map((state) => state.id) as [
  QuestState,
  ...QuestState[],
]

/** Statuts d'une quête assignée (un par couple quête / élève). */
export const ASSIGNMENT_STATUSES = [
  { id: 'todo', label: 'À faire', emoji: '📝' },
  { id: 'in_progress', label: 'En cours', emoji: '✍️' },
  { id: 'submitted', label: 'Soumise', emoji: '📨' },
  { id: 'validated', label: 'Validée', emoji: '✅' },
  { id: 'rejected', label: 'Refusée', emoji: '🔁' },
  { id: 'expired', label: 'Expirée', emoji: '💤' },
] as const

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number]['id']
/** Statuts enregistrés en base : « Expirée » se déduit de la deadline à chaque lecture. */
export type StoredAssignmentStatus = Exclude<AssignmentStatus, 'expired'>

export const DEFAULT_PASS_THRESHOLD = 80
export const DEFAULT_MAX_ATTEMPTS = 3

const byId = <T extends { id: string }>(list: readonly T[], id: string): T => {
  const found = list.find((entry) => entry.id === id)
  if (!found) throw new Error(`Valeur inconnue\u00A0: ${id}`)
  return found
}

export const findCategory = (id: QuestCategory) => byId(QUEST_CATEGORIES, id)
export const findFormat = (id: QuestFormat) => byId(QUEST_FORMATS, id)
export const findDifficulty = (id: QuestDifficulty) => byId(QUEST_DIFFICULTIES, id)
export const findQuestState = (id: QuestState) => byId(QUEST_STATES, id)
export const findAssignmentStatus = (id: AssignmentStatus) => byId(ASSIGNMENT_STATUSES, id)
