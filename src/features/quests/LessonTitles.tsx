import { Emoji } from '../../ui/Emoji'

/**
 * Titres du rappel du cours et de l'exemple expliqué, chacun avec son
 * pictogramme, comme les catégories et les difficultés. Les mêmes chez l'élève
 * et sur la fiche de l'admin.
 */
export const LessonTitle = () => (
  <h2>
    <Emoji symbol="📘" /> Rappel du cours
  </h2>
)

export const ExampleTitle = () => (
  <h2>
    <Emoji symbol="💡" /> Exemple expliqué
  </h2>
)
