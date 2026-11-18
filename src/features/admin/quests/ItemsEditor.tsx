import type { QuestFormat } from '../../../../shared/rules/quests'
import {
  ANSWER_MAX,
  ITEM_PROMPT_MAX,
  MAX_CHOICES,
  MAX_ITEMS,
} from '../../../../shared/schemas/quests'
import { Button } from '../../../ui/Button'
import { Field } from '../../../ui/Field'
import styles from './ItemsEditor.module.css'
import { newItem, type FormItem } from './quest-form'

interface ItemsEditorProps {
  format: QuestFormat
  items: FormItem[]
  onChange: (items: FormItem[]) => void
  /** Erreurs du formulaire, par champ : « items.2.prompt », « items »… */
  errors: Record<string, string>
  disabled: boolean
}

const WORDING: Partial<
  Record<QuestFormat, { one: string; add: string; prompt: string; remove: string }>
> = {
  exact: {
    one: 'Question',
    add: 'Ajouter une question',
    prompt: 'Énoncé',
    remove: 'Supprimer la question',
  },
  qcm: {
    one: 'Question',
    add: 'Ajouter une question',
    prompt: 'Énoncé',
    remove: 'Supprimer la question',
  },
  flashcards: {
    one: 'Carte',
    add: 'Ajouter une carte',
    prompt: 'Question (recto)',
    remove: 'Supprimer la carte',
  },
}

/** Contenu propre au format : questions et réponses attendues, questions de QCM, ou cartes. */
export function ItemsEditor({ format, items, onChange, errors, disabled }: ItemsEditorProps) {
  const wording = WORDING[format]
  if (!wording) return null

  const update = (index: number, changes: Partial<FormItem>) =>
    onChange(items.map((item, position) => (position === index ? { ...item, ...changes } : item)))
  const remove = (index: number) => onChange(items.filter((_, position) => position !== index))

  return (
    <div className={styles.editor}>
      <ol className={styles.items}>
        {items.map((item, index) => {
          const error = (field: string) => errors[`items.${index}.${field}`]
          return (
            <li key={item.key} className={styles.item}>
              <div className={styles.itemHeader}>
                <h3>
                  {wording.one} {index + 1}
                </h3>
                {!disabled && (
                  <Button
                    variant="quiet"
                    onClick={() => remove(index)}
                    aria-label={`${wording.remove} ${index + 1}`}
                  >
                    Supprimer
                  </Button>
                )}
              </div>
              <Field
                label={wording.prompt}
                value={item.prompt}
                maxLength={ITEM_PROMPT_MAX}
                onChange={(event) => update(index, { prompt: event.target.value })}
                error={error('prompt')}
                disabled={disabled}
              />
              {format === 'exact' && (
                <Field
                  label="Réponses acceptées"
                  hint={
                    'Plusieurs réponses possibles, séparées par un point-virgule\u00A0: 3,5\u00A0; 7/2. Les espaces, les majuscules et le choix de la virgule ou du point ne comptent pas.'
                  }
                  value={item.answersText}
                  onChange={(event) => update(index, { answersText: event.target.value })}
                  error={error('answers')}
                  disabled={disabled}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              )}
              {format === 'flashcards' && (
                <Field
                  label="Réponse (verso)"
                  value={item.answersText}
                  maxLength={ANSWER_MAX}
                  onChange={(event) => update(index, { answersText: event.target.value })}
                  error={error('answers')}
                  disabled={disabled}
                />
              )}
              {format === 'qcm' && (
                <ChoicesEditor
                  item={item}
                  number={index + 1}
                  onChange={(changes) => update(index, changes)}
                  error={error('choices')}
                  disabled={disabled}
                />
              )}
            </li>
          )
        })}
      </ol>
      {errors.items && (
        <p className={styles.error} data-invalid tabIndex={-1}>
          {errors.items}
        </p>
      )}
      {!disabled && items.length < MAX_ITEMS && (
        <Button onClick={() => onChange([...items, newItem(format)])}>{wording.add}</Button>
      )}
    </div>
  )
}

interface ChoicesEditorProps {
  item: FormItem
  /** Numéro de la question, pour nommer ses cases. */
  number: number
  onChange: (changes: Partial<FormItem>) => void
  error: string | undefined
  disabled: boolean
}

/** Choix d'une question de QCM : un texte par choix, et une case pour chaque bonne réponse. */
function ChoicesEditor({ item, number, onChange, error, disabled }: ChoicesEditorProps) {
  const setChoice = (position: number, text: string) =>
    onChange({ choices: item.choices.map((choice, other) => (other === position ? text : choice)) })
  const toggleCorrect = (position: number) =>
    onChange({
      correct: item.correct.includes(position)
        ? item.correct.filter((other) => other !== position)
        : [...item.correct, position].sort((a, b) => a - b),
    })

  return (
    <fieldset className={styles.choices} disabled={disabled}>
      <legend className={styles.legend}>Choix proposés</legend>
      <p className={styles.hint}>Cochez la ou les bonnes réponses.</p>
      {item.choices.map((choice, position) => (
        <div key={position} className={styles.choice}>
          <label className={styles.correctZone}>
            <input
              type="checkbox"
              className={styles.correct}
              checked={item.correct.includes(position)}
              onChange={() => toggleCorrect(position)}
              aria-label={`Question ${number}, le choix ${position + 1} est une bonne réponse`}
            />
          </label>
          <input
            type="text"
            className={styles.choiceText}
            value={choice}
            maxLength={ANSWER_MAX}
            onChange={(event) => setChoice(position, event.target.value)}
            placeholder={`Choix ${position + 1}`}
            aria-label={`Question ${number}, texte du choix ${position + 1}`}
          />
        </div>
      ))}
      {error && (
        <p className={styles.error} data-invalid tabIndex={-1}>
          {error}
        </p>
      )}
      {!disabled && item.choices.length < MAX_CHOICES && (
        <Button variant="quiet" onClick={() => onChange({ choices: [...item.choices, ''] })}>
          Ajouter un choix
        </Button>
      )}
    </fieldset>
  )
}
