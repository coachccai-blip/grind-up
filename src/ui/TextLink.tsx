import { Link, type LinkProps } from 'react-router'
import styles from './TextLink.module.css'
import { classes } from './classes'

/**
 * Lien de texte : « Retour aux quêtes », le titre d'une quête dans une liste…
 * Il garde la place d'une ligne de texte, mais sa zone tactile fait 44 px de haut.
 */
export function TextLink({ className, ...rest }: LinkProps) {
  return <Link className={classes(styles.link, className)} {...rest} />
}
