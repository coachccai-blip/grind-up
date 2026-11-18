import type { ReactNode } from 'react'
import styles from './Notice.module.css'
import { classes } from './classes'

/**
 * Message mis en avant. La couleur n'est jamais le seul signal : le texte dit
 * toujours de quoi il s'agit. Les erreurs sont annoncées aux lecteurs d'écran.
 */
export type NoticeTone = 'info' | 'success' | 'warning' | 'error'

interface NoticeProps {
  tone?: NoticeTone
  title?: string
  children: ReactNode
  className?: string
}

export function Notice({ tone = 'info', title, children, className }: NoticeProps) {
  return (
    <div
      className={classes(styles.notice, styles[tone], className)}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {title && <p className={styles.title}>{title}</p>}
      <div>{children}</div>
    </div>
  )
}
