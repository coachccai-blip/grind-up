import { useState, type FormEvent } from 'react'
import { Button } from '../../../ui/Button'
import { Radio } from '../../../ui/Choice'
import { Notice } from '../../../ui/Notice'
import styles from './formats.module.css'
import { ItemResult } from './ItemResult'
import type { FormatProps } from './types'

/**
 * Cartes de mémorisation : l'élève parcourt les cartes (question au recto,
 * réponse au verso), puis passe un test où il retrouve la réponse de chaque
 * carte parmi celles des autres.
 */
export function Flashcards(props: FormatProps) {
  const { quest, readOnly = false } = props
  const [phase, setPhase] = useState<'cards' | 'test'>('cards')

  if (readOnly) return <CardList quest={quest} />
  return phase === 'cards' ? (
    <CardDeck quest={quest} onTest={() => setPhase('test')} />
  ) : (
    <CardTest {...props} onReview={() => setPhase('cards')} />
  )
}

/** Toutes les cartes, question et réponse : pour relire une quête terminée. */
function CardList({ quest }: Pick<FormatProps, 'quest'>) {
  return (
    <dl className={styles.cardList}>
      {quest.items.map((item) => (
        <div key={item.id}>
          <dt>{item.prompt}</dt>
          <dd>{item.back}</dd>
        </div>
      ))}
    </dl>
  )
}

function CardDeck({ quest, onTest }: Pick<FormatProps, 'quest'> & { onTest: () => void }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const card = quest.items[index]
  const count = quest.items.length
  if (!card) return null
  const wrongLastTime = quest.lastAttempt?.results[card.id] === false

  const show = (next: number) => {
    setIndex(next)
    setFlipped(false)
  }

  return (
    <div className={styles.form}>
      <p className={styles.progress} aria-live="polite">
        Carte {index + 1} sur {count}
      </p>
      {/* Après un test manqué, les cartes à revoir sont signalées. */}
      {wrongLastTime && (
        <p className={styles.deckVerdict}>
          <ItemResult right={false} />
        </p>
      )}
      <button
        type="button"
        className={styles.flashcard}
        onClick={() => setFlipped((current) => !current)}
      >
        <span className={styles.side}>{flipped ? 'Réponse' : 'Question'}</span>
        <span className={styles.face}>{flipped ? card.back : card.prompt}</span>
        <span className={styles.flipHint}>
          {flipped
            ? 'Touche la carte pour revoir la question'
            : 'Touche la carte pour voir la réponse'}
        </span>
      </button>
      <div className={styles.deckNav}>
        <Button onClick={() => show(index - 1)} disabled={index === 0}>
          Précédente
        </Button>
        <Button onClick={() => show(index + 1)} disabled={index === count - 1}>
          Suivante
        </Button>
      </div>
      <Button variant="primary" fullWidth onClick={onTest}>
        Passer le test
      </Button>
    </div>
  )
}

function CardTest({ quest, busy, onSubmit, onReview }: FormatProps & { onReview: () => void }) {
  const last = quest.lastAttempt
  const lastAnswer = (itemId: string) => {
    const answer = last?.answers[itemId]
    return typeof answer === 'string' ? answer : ''
  }
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(quest.items.map((item) => [item.id, lastAnswer(item.id)])),
  )
  const [incomplete, setIncomplete] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const missing = quest.items.some((item) => (answers[item.id] ?? '') === '')
    setIncomplete(missing)
    if (!missing) onSubmit({ answers })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <ol className={styles.questions}>
        {quest.items.map((item, index) => {
          const chosen = answers[item.id] ?? ''
          const corrected = last !== null && chosen !== '' && chosen === lastAnswer(item.id)
          return (
            <li key={item.id}>
              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>
                  {index + 1}. {item.prompt}
                </legend>
                {(item.options ?? []).map((option) => (
                  <Radio
                    key={option.id}
                    name={item.id}
                    label={option.text}
                    checked={chosen === option.id}
                    onChange={() => setAnswers({ ...answers, [item.id]: option.id })}
                  />
                ))}
                {corrected && <ItemResult right={last.results[item.id]} />}
              </fieldset>
            </li>
          )
        })}
      </ol>
      {incomplete && <Notice tone="error">Choisis une réponse pour chaque carte.</Notice>}
      <Button type="submit" variant="primary" fullWidth busy={busy} busyLabel="Correction…">
        Valider mes réponses
      </Button>
      <Button fullWidth onClick={onReview}>
        Revoir les cartes
      </Button>
    </form>
  )
}
