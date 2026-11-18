import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import styles from './Field.module.css'
import { classes } from './classes'

interface FieldLabels {
  label: string
  /** Illustration placée entre le libellé et le champ (énoncé illustré d'une question). */
  media?: ReactNode
  /** Aide affichée sous le champ. */
  hint?: ReactNode
  /** Message d'erreur, sans emoji. */
  error?: string | null
}

interface ShellProps extends FieldLabels {
  id?: string
  className?: string
  /** Élément placé à droite du champ (par exemple « Afficher »). */
  trailing?: ReactNode
  children: (control: {
    id: string
    'aria-invalid': true | undefined
    'aria-describedby': string | undefined
  }) => ReactNode
}

/** Habillage commun des champs : libellé, aide et erreur, reliés au champ pour les lecteurs d'écran. */
function FieldShell({ label, media, hint, error, id, className, trailing, children }: ShellProps) {
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
      {media}
      <div className={styles.control}>
        {children({
          id: fieldId,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': describedBy || undefined,
        })}
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

interface FieldProps extends InputHTMLAttributes<HTMLInputElement>, FieldLabels {
  trailing?: ReactNode
}

/** Champ de saisie avec son libellé, son aide et son erreur. Texte en 16 px au minimum. */
export function Field({
  label,
  media,
  hint,
  error,
  trailing,
  id,
  className,
  ...input
}: FieldProps) {
  return (
    <FieldShell
      label={label}
      media={media}
      hint={hint}
      error={error}
      id={id}
      className={className}
      trailing={trailing}
    >
      {(control) => <input className={styles.input} {...control} {...input} />}
    </FieldShell>
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldLabels {}

/** Zone de texte sur plusieurs lignes. */
export function TextArea({ label, hint, error, id, className, rows = 4, ...input }: TextAreaProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} id={id} className={className}>
      {(control) => (
        <textarea
          className={classes(styles.input, styles.textarea)}
          rows={rows}
          {...control}
          {...input}
        />
      )}
    </FieldShell>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldLabels {
  options: readonly { value: string; label: string }[]
}

/** Liste déroulante native : elle s'ouvre comme le prévoit chaque appareil. */
export function Select({ label, hint, error, id, className, options, ...input }: SelectProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} id={id} className={className}>
      {(control) => (
        <select className={classes(styles.input, styles.select)} {...control} {...input}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
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
