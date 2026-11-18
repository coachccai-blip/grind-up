import type { ReactNode } from 'react'
import styles from './AuthLayout.module.css'

/** Cadre commun aux écrans hors espace : connexion, inscription, premier accueil. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <p className={styles.wordmark}>Grind up</p>
        <p className={styles.tagline}>Des quêtes à relever, de l’XP à gagner.</p>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
