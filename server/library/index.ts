import type { LibraryExercise, LibraryExerciseSummary } from '../../shared/schemas/library.js'
import { identitesRemarquables } from './exercises/identites-remarquables.js'

/**
 * Bibliothèque d'exercices prêts à l'emploi. Son contenu fait partie du code du
 * serveur : il n'est servi qu'à l'admin, et les réponses comme les corrections
 * ne figurent jamais dans le code envoyé au navigateur.
 *
 * Pour ajouter un exercice : un fichier dans `exercises/`, ajouté à cette liste.
 */
const SOURCES = [...identitesRemarquables]

/**
 * Garde chaque parenthèse d'un calcul sur une seule ligne : à l'intérieur, les
 * espaces deviennent insécables. Sur un téléphone, « (x − 4) » ne se coupe pas.
 */
const keepGroupsTogether = (text: string) =>
  text.replace(/\([^()\n]{1,18}\)/g, (group) => group.replaceAll(' ', '\u00A0'))

const EXERCISES: readonly LibraryExercise[] = SOURCES.map((exercise) => ({
  ...exercise,
  instructions: keepGroupsTogether(exercise.instructions),
  items: exercise.items.map((item) => ({
    ...item,
    prompt: keepGroupsTogether(item.prompt),
    choices: item.choices.map(keepGroupsTogether),
    explanation: keepGroupsTogether(item.explanation),
  })),
  itemCount: exercise.items.length,
}))

/** Les exercices, sans leurs questions : de quoi les présenter dans une liste. */
export function listLibrary(): LibraryExerciseSummary[] {
  return EXERCISES.map(
    ({ id, title, level, description, category, format, difficulty, itemCount }) => ({
      id,
      title,
      level,
      description,
      category,
      format,
      difficulty,
      itemCount,
    }),
  )
}

/** Un exercice complet, réponses attendues et corrections comprises. */
export function findLibraryExercise(id: string): LibraryExercise | undefined {
  return EXERCISES.find((exercise) => exercise.id === id)
}
