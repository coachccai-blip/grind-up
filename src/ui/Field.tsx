import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import styles from './Field.module.css'
import { classes } from './classes'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Aide affichée sous le champ. */
  hint?: ReactNode
  /** Message d'erreur, sans emoji. */
  error?: string | null
  /** Élément placé à droite du champ (par exemple « Afficher »). */
  trailing?: ReactNode
}

/** Champ de saisie avec son libellé, son aide et son erreur. Texte en 16 px au minimum. */
export function Field({ label, hint, error, trailing, id, className, ...input }: FieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const hintId = `${fieldId}-hint`
  const errorId = `${fieldId}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={classes(styles.field, className)}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        <input
          id={fieldId}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...input}
        />
        {trailing}
      </div>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}

/** Champ de mot de passe, avec un bouton pour afficher ou masquer la saisie. */
export function PasswordField(props: Omit<FieldProps, 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false)
  return (
    <Field
      {...props}
      type={visible ? 'text' : 'password'}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      trailing={
        <button
          type="button"
          className={styles.toggle}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? 'Masquer' : 'Afficher'}
        </button>
      }
    />
  )
}
