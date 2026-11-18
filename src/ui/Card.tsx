import type { HTMLAttributes } from 'react'
import styles from './Card.module.css'
import { classes } from './classes'

/** Carte blanche aux coins arrondis de 16 px, ombre très légère. */
export type CardTone = 'plain' | 'success' | 'warning' | 'urgent'

interface CardProps extends HTMLAttributes<HTMLElement> {
  tone?: CardTone
  as?: 'section' | 'div' | 'article' | 'li'
}

export function Card({ tone = 'plain', as: Element = 'section', className, ...rest }: CardProps) {
  return <Element className={classes(styles.card, styles[tone], className)} {...rest} />
}
