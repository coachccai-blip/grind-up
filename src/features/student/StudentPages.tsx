import { useCurrentUser } from '../../app/session'
import { EmptyState } from '../../ui/EmptyState'

/**
 * Écrans de l'élève qui se rempliront aux étapes suivantes. Leur état vide est
 * déjà celui que verra un élève sans quête.
 */
export function DashboardPage() {
  const user = useCurrentUser()
  return (
    <>
      <h1>Bonjour, {user.pseudo}&nbsp;!</h1>
      <EmptyState emoji="🎯" title="Aucune quête pour l’instant">
        <p>Ton accompagnant ne t’a pas encore donné de quête. Reviens bientôt&nbsp;!</p>
      </EmptyState>
    </>
  )
}

export function QuestsPage() {
  return (
    <>
      <h1>Mes quêtes</h1>
      <EmptyState emoji="🎯" title="Aucune quête pour l’instant">
        <p>Tes quêtes apparaîtront ici dès que ton accompagnant t’en donnera.</p>
      </EmptyState>
    </>
  )
}

export function LeaderboardPage() {
  return (
    <>
      <h1>Leaderboard</h1>
      <EmptyState emoji="🏆" title="Le classement arrive bientôt">
        <p>Tu y verras tes missions accomplies et ton rang parmi les autres élèves.</p>
      </EmptyState>
    </>
  )
}
