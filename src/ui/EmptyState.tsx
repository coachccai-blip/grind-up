import type { ReactNode } from 'react'
import { Card } from './Card'
import { Emoji } from './Emoji'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  emoji: string
  title: string
  /** Vrai quand l'état vide est toute la page : son titre devient le titre principal. */
  pageTitle?: boolean
  children?: ReactNode
  action?: ReactNode
}

/** État vide accueillant : quand il n'y a encore rien à montrer. */
export function EmptyState({ emoji, title, pageTitle = false, children, action }: EmptyStateProps) {
  const Heading = pageTitle ? 'h1' : 'h2'
  return (
    <Card className={styles.empty}>
      <Emoji symbol={emoji} className={styles.emoji} />
      <Heading className={styles.title}>{title}</Heading>
      {children && <div className={styles.text}>{children}</div>}
      {action}
    </Card>
  )
}
