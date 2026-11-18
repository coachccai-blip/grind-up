import { useId, type ReactNode } from 'react'
import styles from './OptionGroup.module.css'
import { classes } from './classes'
import { Emoji } from './Emoji'

export interface Option<Value extends string> {
  value: Value
  label: string
  emoji?: string
  /** Précision affichée sous le libellé. */
  hint?: ReactNode
}

interface OptionGroupProps<Value extends string> {
  legend: string
  options: readonly Option<Value>[]
  value: Value
  onChange: (value: Value) => void
  /** « pills » : des pastilles côte à côte ; « list » : une option par ligne, avec sa précision. */
  layout?: 'pills' | 'list'
  disabled?: boolean
  hint?: ReactNode
}

/**
 * Choix d'une option parmi quelques-unes, toutes visibles. Ce sont des boutons
 * radio natifs : le clavier et les lecteurs d'écran les connaissent déjà.
 */
export function OptionGroup<Value extends string>({
  legend,
  options,
  value,
  onChange,
  layout = 'pills',
  disabled = false,
  hint,
}: OptionGroupProps<Value>) {
  const name = useId()
  return (
    <fieldset className={styles.group} disabled={disabled}>
      <legend className={styles.legend}>{legend}</legend>
      {hint && <p className={styles.groupHint}>{hint}</p>}
      <div className={layout === 'pills' ? styles.pills : styles.list}>
        {options.map((option) => (
          <label
            key={option.value}
            className={classes(styles.option, option.value === value && styles.selected)}
          >
            <input
              type="radio"
              className={styles.input}
              name={name}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            {option.emoji && <Emoji symbol={option.emoji} />}
            <span className={styles.text}>
              <span className={styles.label}>{option.label}</span>
              {option.hint && <span className={styles.hint}>{option.hint}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
