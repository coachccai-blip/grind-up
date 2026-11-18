import type { ReactNode } from 'react'
import styles from './Chip.module.css'
import { classes } from './classes'
import { Emoji } from './Emoji'

/**
 * Étiquette : un mot ou deux sur un fond pastel. La couleur appuie le libellé,
 * elle ne le remplace jamais ; le texte reste en bleu nuit sur tous les fonds.
 */
export type ChipTone =
  'neutral' | 'success' | 'warning' | 'urgent' | 'maths' | 'memorisation' | 'sport' | 'other'

interface ChipProps {
  tone?: ChipTone
  /** Emoji décoratif, placé avant le libellé. */
  emoji?: string
  children: ReactNode
  className?: string
}

export function Chip({ tone = 'neutral', emoji, children, className }: ChipProps) {
  return (
    <span className={classes(styles.chip, styles[tone], className)}>
      {emoji && <Emoji symbol={emoji} />}
      <span>{children}</span>
    </span>
  )
}
