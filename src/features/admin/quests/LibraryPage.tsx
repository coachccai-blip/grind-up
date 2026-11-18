import { useState } from 'react'
import { findDifficulty, findFormat } from '../../../../shared/rules/quests'
import type { LibraryExerciseSummary } from '../../../../shared/schemas/library'
import { errorMessage } from '../../../lib/api'
import { ButtonLink } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { Chip } from '../../../ui/Chip'
import { Field, Select } from '../../../ui/Field'
import { Notice } from '../../../ui/Notice'
import { TextLink } from '../../../ui/TextLink'
import { newQuestFromExercise, useLibrary } from './library-api'
import styles from './LibraryPage.module.css'

/** Texte comparable d'une recherche : sans majuscules ni accents, espaces insécables comprises. */
const searchable = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, ' ').toLowerCase()

/**
 * Bibliothèque : des exercices prêts à l'emploi, rangés par thème du programme.
 * En choisir un ouvre une nouvelle quête déjà remplie, que l'admin modifie s'il
 * le veut, puis donne à ses élèves.
 */
export function LibraryPage() {
  const library = useLibrary()
  const [theme, setTheme] = useState('')
  const [search, setSearch] = useState('')

  const themes = library.data?.themes ?? []
  const exercises = library.data?.exercises ?? []
  const wanted = searchable(search.trim())
  const shown = exercises.filter(
    (exercise) =>
      (theme === '' || exercise.theme === theme) &&
      (wanted === '' || searchable(`${exercise.title} ${exercise.description}`).includes(wanted)),
  )

  return (
    <>
      <p>
        <TextLink to="/admin/quetes">Retour aux quêtes</TextLink>
      </p>
      <h1>Bibliothèque</h1>
      <p className={styles.intro}>
        Des exercices prêts à l’emploi. Chacun commence par un rappel du cours et un exemple
        expliqué, puis fait pratiquer l’élève, avec la correction détaillée de chaque question.
        Choisissez-en un&nbsp;: il s’ouvre comme une nouvelle quête, que vous pouvez modifier avant
        de la donner à vos élèves.
      </p>
      {library.isError && <Notice tone="error">{errorMessage(library.error)}</Notice>}
      {library.isPending && <p>Chargement de la bibliothèque…</p>}

      {library.data && (
        <>
          <div className={styles.filters}>
            <Select
              label="Thème"
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              options={[
                { value: '', label: 'Tous les thèmes' },
                ...themes.map(({ id, label }) => ({ value: id, label })),
              ]}
            />
            <Field
              label="Rechercher un exercice"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Titre ou notion"
              autoComplete="off"
              enterKeyHint="search"
            />
          </div>
          <p className={styles.count} role="status">
            {shown.length === exercises.length
              ? `${exercises.length} exercice${exercises.length > 1 ? 's' : ''}`
              : `${shown.length} sur ${exercises.length} exercices`}
          </p>
          {themes
            .map((entry) => ({
              ...entry,
              exercises: shown.filter((exercise) => exercise.theme === entry.id),
            }))
            .filter((entry) => entry.exercises.length > 0)
            .map((entry) => (
              <section key={entry.id} className={styles.theme}>
                <h2>{entry.label}</h2>
                <ul className={styles.list}>
                  {entry.exercises.map((exercise) => (
                    <ExerciseCard key={exercise.id} exercise={exercise} />
                  ))}
                </ul>
              </section>
            ))}
          {shown.length === 0 && <p>Aucun exercice ne correspond à cette recherche.</p>}
        </>
      )}
    </>
  )
}

function ExerciseCard({ exercise }: { exercise: LibraryExerciseSummary }) {
  const count = exercise.itemCount
  return (
    <Card as="li" className={styles.exercise}>
      <div className={styles.tags}>
        <Chip>{exercise.level}</Chip>
        <Chip>{findDifficulty(exercise.difficulty).label}</Chip>
      </div>
      <h3>{exercise.title}</h3>
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
