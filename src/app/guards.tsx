import { Navigate, Outlet, useLocation } from 'react-router'
import type { UserRole } from '../../shared/schemas/auth'
import { isWelcomePending } from '../features/auth/welcome-pending'
import { errorMessage } from '../lib/api'
import { Button } from '../ui/Button'
import { Notice } from '../ui/Notice'
import styles from './guards.module.css'
import { CurrentUserContext, homePathFor, useSession } from './session'

/**
 * Protection des pages par rôle. C'est un confort de navigation : la vraie
 * protection est côté serveur, où chaque route vérifie le rôle.
 */

const NEW_PASSWORD_PATH = '/nouveau-mot-de-passe'
const WELCOME_PATH = '/bienvenue'

/** Attend de savoir qui est connecté avant d'afficher quoi que ce soit. */
export function SessionGate() {
  const session = useSession()

  if (session.isPending) {
    return (
      <p className={styles.loading} role="status">
        Chargement…
      </p>
    )
  }
  if (session.isError) {
    return (
      <div className={styles.failure}>
        <Notice tone="error">{errorMessage(session.error)}</Notice>
        <Button variant="primary" onClick={() => void session.refetch()}>
          Réessayer
        </Button>
      </div>
    )
  }
  return <Outlet />
}

/** Pages réservées aux visiteurs non connectés : connexion et inscription. */
export function AnonymousOnly() {
  const user = useSession().data?.user
  if (user) return <Navigate to={homePathFor(user)} replace />
  return <Outlet />
}

/** Pages réservées à un utilisateur connecté, éventuellement d'un rôle donné. */
export function RequireUser({ role }: { role?: UserRole }) {
  const user = useSession().data?.user
  const location = useLocation()

  if (!user) return <Navigate to="/connexion" replace />
  // Après un mot de passe temporaire, rien d'autre n'est accessible tant qu'il n'est pas remplacé.
  if (user.mustChangePassword && location.pathname !== NEW_PASSWORD_PATH) {
    return <Navigate to={NEW_PASSWORD_PATH} replace />
  }
  if (!user.mustChangePassword && location.pathname === NEW_PASSWORD_PATH) {
    return <Navigate to={homePathFor(user)} replace />
  }
  if (role && user.role !== role) return <Navigate to={homePathFor(user)} replace />
  // Un élève tout juste inscrit voit d'abord son identifiant.
  if (user.role === 'student' && isWelcomePending() && location.pathname !== WELCOME_PATH) {
    return <Navigate to={WELCOME_PATH} replace />
  }
  return (
    <CurrentUserContext value={user}>
      <Outlet />
    </CurrentUserContext>
  )
}
