import { Link } from 'react-router'
import { tabOfStatus } from '../../../shared/rules/assignment-status'
import { useCurrentUser } from '../../app/session'
import { errorMessage } from '../../lib/api'
import { EmptyState } from '../../ui/EmptyState'
import { Notice } from '../../ui/Notice'
import listStyles from './MyQuestsPage.module.css'
import { QuestCard } from './QuestCard'
import { useMyQuests } from './quests-api'

/** Nombre de quêtes à faire montrées sur le tableau de bord. */
const DASHBOARD_QUESTS = 5

/** Tableau de bord : les quêtes à faire, la deadline la plus proche d'abord. */
export function DashboardPage() {
  const user = useCurrentUser()
  const quests = useMyQuests()
  const todo = (quests.data ?? []).filter((quest) => tabOfStatus(quest.status) === 'todo')

  return (
    <>
      <h1>Bonjour, {user.pseudo}&nbsp;!</h1>
      {quests.isError && <Notice tone="error">{errorMessage(quests.error)}</Notice>}
      {quests.isPending && <p>Chargement des quêtes…</p>}

      {quests.isSuccess && todo.length === 0 && (
        <EmptyState emoji="🎯" title="Aucune quête pour l’instant">
          <p>Ton accompagnant ne t’a pas encore donné de quête. Reviens bientôt&nbsp;!</p>
        </EmptyState>
      )}

      {todo.length > 0 && (
        <section className={listStyles.section} aria-labelledby="dashboard-quests">
          <h2 id="dashboard-quests">Quêtes à faire</h2>
          <ul className={listStyles.list}>
            {todo.slice(0, DASHBOARD_QUESTS).map((quest) => (
              <li key={quest.id}>
                <QuestCard quest={quest} />
              </li>
            ))}
          </ul>
          {todo.length > DASHBOARD_QUESTS && (
            <p>
              <Link to="/quetes">Voir mes {todo.length} quêtes à faire</Link>
            </p>
          )}
        </section>
      )}
    </>
  )
}

/** Écran de l'élève qui se remplira à l'étape suivante. */
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
