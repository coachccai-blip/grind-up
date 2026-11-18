import type { QuestCategory, QuestDifficulty, QuestFormat } from '../rules/quests.js'
import type { QuestItemInput } from './quests.js'

/**
 * Bibliothèque d'exercices prêts à l'emploi, réservée à l'admin. Un exercice est
 * le contenu d'une quête, corrections détaillées comprises : l'admin le reprend
 * dans une nouvelle quête, qu'il peut modifier avant de la donner à ses élèves.
 */
export interface LibraryExerciseSummary {
  /** Identifiant lisible, qui figure dans l'adresse de l'écran. */
  id: string
  title: string
  /** Classe visée, telle qu'elle s'affiche : « 3e ». */
  level: string
  /** Ce que l'exercice fait travailler, en une ou deux phrases. */
  description: string
  category: QuestCategory
  format: QuestFormat
  difficulty: QuestDifficulty
  itemCount: number
}

/** Un exercice complet, réponses attendues et corrections comprises. */
export interface LibraryExercise extends LibraryExerciseSummary {
  instructions: string
  items: QuestItemInput[]
}

export interface LibraryResponse {
  exercises: LibraryExerciseSummary[]
}

export interface LibraryExerciseResponse {
  exercise: LibraryExercise
}
