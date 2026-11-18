import type {
  LibraryExercise,
  LibraryExerciseSummary,
  LibraryTheme,
} from '../../shared/schemas/library.js'
import { algorithmique } from './exercises/algorithmique.js'
import { calculLitteral } from './exercises/calcul-litteral.js'
import { donnees } from './exercises/donnees.js'
import { equations } from './exercises/equations.js'
import { espace } from './exercises/espace.js'
import { fonctions } from './exercises/fonctions.js'
import { geometrie } from './exercises/geometrie.js'
import { identitesRemarquables } from './exercises/identites-remarquables.js'
import { nombres } from './exercises/nombres.js'
import { proportionnalite } from './exercises/proportionnalite.js'
import { LIBRARY_THEMES } from './themes.js'

/**
 * Bibliothèque d'exercices prêts à l'emploi. Son contenu fait partie du code du
 * serveur : il n'est servi qu'à l'admin, et les réponses comme les corrections
 * ne figurent jamais dans le code envoyé au navigateur.
 *
 * Pour ajouter un exercice : le rédiger dans le fichier de son thème, sous
 * `exercises/`, avec les outils de `authoring.ts`. Le guide de rédaction est
 * dans docs/bibliotheque.md.
 */
const SOURCES = [
  ...nombres,
  ...calculLitteral,
  ...identitesRemarquables,
  ...equations,
  ...fonctions,
  ...proportionnalite,
  ...donnees,
  ...geometrie,
  ...espace,
  ...algorithmique,
]

const themeOrder = new Map<string, number>(LIBRARY_THEMES.map((theme, index) => [theme.id, index]))

/** Les exercices, rangés par thème ; dans un thème, l'ordre est celui de la rédaction. */
const EXERCISES: readonly LibraryExercise[] = SOURCES.map((exercise, index) => ({
  exercise: { ...exercise, itemCount: exercise.items.length },
  index,
}))
  .sort(
    (a, b) =>
      (themeOrder.get(a.exercise.theme) ?? 0) - (themeOrder.get(b.exercise.theme) ?? 0) ||
      a.index - b.index,
  )
  .map(({ exercise }) => exercise)

/** Les thèmes qui ont au moins un exercice, dans l'ordre du programme. */
export function listLibraryThemes(): LibraryTheme[] {
  const used = new Set(EXERCISES.map((exercise) => exercise.theme))
  return LIBRARY_THEMES.filter((theme) => used.has(theme.id)).map(({ id, label }) => ({
    id,
    label,
  }))
}

/** Les exercices, sans leur contenu : de quoi les présenter dans une liste. */
export function listLibrary(): LibraryExerciseSummary[] {
  return EXERCISES.map(
    ({ id, title, theme, level, description, category, format, difficulty, itemCount }) => ({
      id,
      title,
      theme,
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
