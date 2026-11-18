import { findDifficulty, findFormat } from '../../../../shared/rules/quests'
import type { LibraryExerciseSummary } from '../../../../shared/schemas/library'
import { errorMessage } from '../../../lib/api'
import { ButtonLink } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { Chip } from '../../../ui/Chip'
import { Notice } from '../../../ui/Notice'
import { TextLink } from '../../../ui/TextLink'
import { CategoryChip } from '../../quests/QuestChips'
import { newQuestFromExercise, useLibrary } from './library-api'
import styles from './LibraryPage.module.css'

/**
 * Bibliothèque : des exercices prêts à l'emploi. En choisir un ouvre une
 * nouvelle quête déjà remplie, que l'admin modifie s'il le veut, puis donne à
 * ses élèves.
 */
export function LibraryPage() {
  const library = useLibrary()

  return (
    <>
      <p>
        <TextLink to="/admin/quetes">Retour aux quêtes</TextLink>
      </p>
      <h1>Bibliothèque</h1>
      <p className={styles.intro}>
        Des exercices prêts à l’emploi, avec la correction détaillée de chaque question.
        Choisissez-en un&nbsp;: il s’ouvre comme une nouvelle quête, que vous pouvez modifier avant
        de la donner à vos élèves.
      </p>
      {library.isError && <Notice tone="error">{errorMessage(library.error)}</Notice>}
      {library.isPending && <p>Chargement de la bibliothèque…</p>}
      {library.data && (
        <ul className={styles.list}>
          {library.data.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </ul>
      )}
    </>
  )
}

function ExerciseCard({ exercise }: { exercise: LibraryExerciseSummary }) {
  const count = exercise.itemCount
  return (
    <Card as="li" className={styles.exercise}>
      <div className={styles.tags}>
        <CategoryChip category={exercise.category} withEmoji />
        <Chip>{exercise.level}</Chip>
        <Chip>{findDifficulty(exercise.difficulty).label}</Chip>
      </div>
      <h2>{exercise.title}</h2>
      <p>{exercise.description}</p>
      <p className={styles.meta}>
        {findFormat(exercise.format).label} · {count} question{count > 1 ? 's' : ''}
      </p>
      <ButtonLink
        to={newQuestFromExercise(exercise.id)}
        className={styles.use}
        // Le nom commence par le libellé visible, puis dit de quel exercice il s'agit.
        aria-label={`Utiliser cet exercice\u00A0: ${exercise.title}`}
      >
        Utiliser cet exercice
      </ButtonLink>
    </Card>
  )
}
