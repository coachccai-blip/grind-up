import { useState, type FormEvent } from 'react'
import { splitPrompt } from '../../../../shared/rules/figures'
import { Button } from '../../../ui/Button'
import { Checkbox, Radio } from '../../../ui/Choice'
import { Figures } from '../../../ui/Figure'
import { Notice } from '../../../ui/Notice'
import { DetailedCorrection } from './DetailedCorrection'
import styles from './formats.module.css'
import { ItemResult } from './ItemResult'
import type { FormatProps } from './types'

const sameChoices = (first: readonly number[], second: readonly number[]) =>
  first.length === second.length && first.every((position) => second.includes(position))

/** QCM : une ou plusieurs réponses à choisir par question. */
export function QcmForm({ quest, busy, onSubmit, readOnly = false }: FormatProps) {
  const last = quest.lastAttempt
  const lastAnswer = (itemId: string): number[] => {
    const answer = last?.answers[itemId]
    return Array.isArray(answer) ? answer : []
  }
  const [answers, setAnswers] = useState<Record<string, number[]>>(() =>
    Object.fromEntries(quest.items.map((item) => [item.id, lastAnswer(item.id)])),
  )
  const [incomplete, setIncomplete] = useState(false)

  const toggle = (itemId: string, position: number, multiple: boolean) => {
    const chosen = answers[itemId] ?? []
    const next = !multiple
      ? [position]
      : chosen.includes(position)
        ? chosen.filter((other) => other !== position)
        : [...chosen, position]
    setAnswers({ ...answers, [itemId]: next })
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const missing = quest.items.some((item) => (answers[item.id] ?? []).length === 0)
    setIncomplete(missing)
    if (!missing) onSubmit({ answers })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <ol className={styles.questions}>
        {quest.items.map((item, index) => {
          const chosen = answers[item.id] ?? []
          const corrected = last !== null && sameChoices(chosen, lastAnswer(item.id))
          const expected = quest.corrections?.[item.id]
          const Option = item.multiple ? Checkbox : Radio
          const prompt = splitPrompt(item.prompt)
          return (
            <li key={item.id}>
              <fieldset className={styles.fieldset} disabled={readOnly}>
                <legend className={styles.legend}>
                  {index + 1}. {prompt.text}
                </legend>
                <Figures figures={prompt.figures} />
                {item.multiple && <p className={styles.hint}>Plusieurs réponses possibles.</p>}
                {(item.choices ?? []).map((choice, position) => (
                  <Option
                    key={position}
                    name={item.id}
                    label={choice}
                    checked={chosen.includes(position)}
                    onChange={() => toggle(item.id, position, item.multiple === true)}
                    disabled={readOnly}
                  />
                ))}
                {corrected && <ItemResult right={last.results[item.id]} />}
                {expected && expected.length > 0 && (
                  <p className={styles.correction}>
                    {expected.length > 1 ? 'Bonnes réponses' : 'Bonne réponse'}&nbsp;:{' '}
                    <strong>{expected.join(', ')}</strong>
                  </p>
                )}
                <DetailedCorrection
                  text={quest.explanations?.[item.id]}
                  wrong={last?.results[item.id] === false}
                />
              </fieldset>
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
