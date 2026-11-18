import { answerKey, isAnswerAccepted, scorePercent } from '../../shared/rules/answers.js'
import type { QuestFormat } from '../../shared/rules/quests.js'
import type { AttemptAnswers } from '../../shared/schemas/quests.js'

/**
 * Correction automatique. Elle ne s'exécute que sur le serveur : les réponses
 * attendues ne sont jamais envoyées au navigateur avant la correction.
 */
export interface GradableItem {
  id: string
  /** Réponse exacte : réponses acceptées. Cartes : le verso. */
  answers: readonly string[]
  /** QCM : positions des bons choix. */
  correct: readonly number[]
}

export interface Grade {
  /** Pourcentage de bonnes réponses, arrondi à l'entier le plus proche. */
  score: number
  /** Par élément : vrai si la réponse était juste. Une question sans réponse est fausse. */
  results: Record<string, boolean>
}

function sameSet(given: readonly number[], expected: readonly number[]): boolean {
  const chosen = new Set(given)
  return chosen.size === expected.length && expected.every((position) => chosen.has(position))
}

function isItemRight(
  format: QuestFormat,
  item: GradableItem,
  given: AttemptAnswers[string] | undefined,
  backOf: (itemId: string) => string | undefined,
): boolean {
  switch (format) {
    case 'exact':
      return typeof given === 'string' && isAnswerAccepted(given, item.answers)
    case 'qcm':
      // Tout ou rien : il faut cocher tous les bons choix, et eux seuls.
      return Array.isArray(given) && item.correct.length > 0 && sameSet(given, item.correct)
    case 'flashcards': {
      // L'élève désigne la carte dont le verso répond à la question.
      if (typeof given !== 'string') return false
      const chosenBack = backOf(given)
      const expectedKey = answerKey(item.answers[0] ?? '')
      return chosenBack !== undefined && expectedKey !== '' && answerKey(chosenBack) === expectedKey
    }
    default:
      return false
  }
}

export function grade(
  format: QuestFormat,
  items: readonly GradableItem[],
  answers: AttemptAnswers,
): Grade {
  const backs = new Map(items.map((item) => [item.id, item.answers[0]]))
  const results: Record<string, boolean> = {}
  let right = 0
  for (const item of items) {
    const isRight = isItemRight(format, item, answers[item.id], (id) => backs.get(id))
    results[item.id] = isRight
    if (isRight) right += 1
  }
  return { score: scorePercent(right, items.length), results }
}
