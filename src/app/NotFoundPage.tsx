import { ButtonLink } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import styles from './NotFoundPage.module.css'

/** Adresse inconnue : un message clair et un retour vers l'accueil. */
export function NotFoundPage() {
  return (
    <main className={styles.page}>
      <EmptyState
        emoji="🧩"
        title="Page introuvable"
        pageTitle
        action={
          <ButtonLink to="/" variant="primary">
            Revenir à l’accueil
          </ButtonLink>
        }
      >
        <p>Cette adresse ne mène nulle part.</p>
      </EmptyState>
    </main>
  )
}
