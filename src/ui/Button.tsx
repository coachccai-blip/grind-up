import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'
import styles from './Button.module.css'
import { classes } from './classes'

/**
 * Boutons. Une seule action principale par écran (dégradé « Océan ») ; les autres
 * actions sont secondaires, discrètes, ou « danger » pour une action destructrice.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger'

interface ButtonStyleProps {
  variant?: ButtonVariant
  fullWidth?: boolean
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleProps {
  /** Action en cours : le bouton est désactivé et affiche `busyLabel`. */
  busy?: boolean
  busyLabel?: string
}

function buttonClasses({ variant = 'secondary', fullWidth }: ButtonStyleProps, extra?: string) {
  return classes(styles.button, styles[variant], fullWidth && styles.fullWidth, extra)
}

export function Button({
  variant,
  fullWidth,
  busy = false,
  busyLabel,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, fullWidth }, className)}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...rest}
    >
      {busy && busyLabel ? busyLabel : children}
    </button>
  )
}

/** Lien qui a l'apparence d'un bouton, pour une action qui change de page. */
export function ButtonLink({
  variant,
  fullWidth,
  className,
  ...rest
}: LinkProps & ButtonStyleProps) {
  return <Link className={buttonClasses({ variant, fullWidth }, className)} {...rest} />
}
