import { findAvatar, type AvatarTint } from '../../shared/rules/avatars'
import styles from './Avatar.module.css'
import { classes } from './classes'

const TINT_CLASSES: Record<AvatarTint, string | undefined> = {
  lavender: styles.lavender,
  mint: styles.mint,
  peach: styles.peach,
  yellow: styles.yellow,
  sky: styles.sky,
  green: styles.green,
  pink: styles.pink,
}

interface AvatarProps {
  /** Clé de l'avatar dans la galerie. */
  avatar: string
  size?: 'small' | 'medium' | 'large'
  /** Vrai quand le pseudo est affiché juste à côté : l'avatar est alors purement décoratif. */
  decorative?: boolean
}

/** Avatar emoji sur sa pastille pastel. */
export function Avatar({ avatar, size = 'medium', decorative = false }: AvatarProps) {
  const { emoji, label, tint } = findAvatar(avatar)
  return (
    <span
      className={classes(styles.avatar, styles[size], TINT_CLASSES[tint])}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : `Avatar\u00A0: ${label}`}
      aria-hidden={decorative || undefined}
    >
      {emoji}
    </span>
  )
}
