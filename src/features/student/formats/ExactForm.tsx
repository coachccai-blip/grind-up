import { useState, type FormEvent } from 'react'
import { splitPrompt } from '../../../../shared/rules/figures'
import { Button } from '../../../ui/Button'
import { Field } from '../../../ui/Field'
import { Figures } from '../../../ui/Figure'
import { Notice } from '../../../ui/Notice'
import { DetailedCorrection } from './DetailedCorrection'
import styles from './formats.module.css'
import { ItemResult } from './ItemResult'
import type { FormatProps } from './types'

/** Questions à réponse exacte : un nombre ou une réponse courte par question. */
export function ExactForm({ quest, busy, onSubmit, readOnly = false }: FormatProps) {
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
    const missing = quest.items.some((item) => (answers[item.id] ?? '').trim() === '')
    setIncomplete(missing)
    if (!missing) onSubmit({ answers })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <ol className={styles.questions}>
        {quest.items.map((item, index) => {
          const value = answers[item.id] ?? ''
          // Le verdict ne vaut que pour la réponse corrigée : il disparaît dès qu'elle change.
          const corrected = last !== null && value === lastAnswer(item.id)
          const expected = quest.corrections?.[item.id]
          const prompt = splitPrompt(item.prompt)
          return (
            <li key={item.id} className={styles.question}>
              <Field
                label={`${index + 1}. ${prompt.text}`}
                media={<Figures figures={prompt.figures} />}
                value={value}
                onChange={(event) => setAnswers({ ...answers, [item.id]: event.target.value })}
                disabled={readOnly}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
              />
              {corrected && <ItemResult right={last.results[item.id]} />}
              {expected && expected.length > 0 && (
                <p className={styles.correction}>
                  {expected.length > 1 ? 'Réponses acceptées' : 'Réponse attendue'}&nbsp;:{' '}
                  <strong>{expected.join(' ou ')}</strong>
                </p>
              )}
              <DetailedCorrection
                text={quest.explanations?.[item.id]}
                wrong={last?.results[item.id] === false}
              />
            </li>
          )
        })}
      </ol>
      {incomplete && <Notice tone="error">Réponds à toutes les questions avant de valider.</Notice>}
      {!readOnly && (
        <Button type="submit" variant="primary" fullWidth busy={busy} busyLabel="Correction…">
          Valider mes réponses
        </Button>
      )}
    </form>
  )
}
