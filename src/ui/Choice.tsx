import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './Choice.module.css'
import { classes } from './classes'

interface ChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  /** Précision affichée sous le libellé. */
  hint?: ReactNode
}

function Choice({
  type,
  label,
  hint,
  className,
  ...input
}: ChoiceProps & { type: 'checkbox' | 'radio' }) {
  return (
    <label className={classes(styles.choice, input.disabled && styles.disabled, className)}>
      <input type={type} className={styles.input} {...input} />
      <span className={styles.text}>
        <span>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
    </label>
  )
}

/** Case à cocher avec son libellé ; toute la ligne est une zone tactile d'au moins 44 px. */
export const Checkbox = (props: ChoiceProps) => <Choice type="checkbox" {...props} />

/** Bouton radio avec son libellé ; toute la ligne est une zone tactile d'au moins 44 px. */
export const Radio = (props: ChoiceProps) => <Choice type="radio" {...props} />
