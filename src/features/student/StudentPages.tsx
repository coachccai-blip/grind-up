import { Link } from 'react-router'
import { tabOfStatus } from '../../../shared/rules/assignment-status'
import { useCurrentUser } from '../../app/session'
import { errorMessage } from '../../lib/api'
import { Avatar } from '../../ui/Avatar'
import { Card } from '../../ui/Card'
import { Emoji } from '../../ui/Emoji'
import { EmptyState } from '../../ui/EmptyState'
import { Leaderboard } from '../leaderboard/Leaderboard'
import { useLeaderboard } from '../leaderboard/leaderboard-api'
import { Notice } from '../../ui/Notice'
import { XpBar } from '../progress/XpBar'
import { XpJournal } from '../progress/XpJournal'
import { formatXp } from '../quests/QuestChips'
import styles from './DashboardPage.module.css'
import listStyles from './MyQuestsPage.module.css'
import { useProgress } from './progress-api'
import { QuestCard } from './QuestCard'
import { useMyQuests } from './quests-api'

/** Nombre de quêtes à faire montrées sur le tableau de bord. */
const DASHBOARD_QUESTS = 5

const days = (count: number) => `${count}\u00A0jour${count > 1 ? 's' : ''}`

/** « 1er », « 2e », « 3e »… */
const ordinal = (rank: number) => (rank === 1 ? '1er' : `${rank}e`)

/**
 * Tableau de bord : niveau, barre d'XP, série, quêtes à faire (la deadline la
 * plus proche d'abord) et dernières récompenses.
 */
export function DashboardPage() {
  const user = useCurrentUser()
  const quests = useMyQuests()
  const progress = useProgress()
  const board = useLeaderboard('week', 'missions')
  const todo = (quests.data ?? []).filter((quest) => tabOfStatus(quest.status) === 'todo')
  const stats = progress.data
  const mine = board.data?.find((entry) => entry.isYou)

  return (
    <>
      {/* En-tête du tableau de bord : l'un des cinq endroits où le dégradé « Ciel » est permis. */}
      <header className={styles.hero}>
        <Avatar avatar={user.avatar} size="large" decorative />
        <div>
          <h1>Bonjour, {user.pseudo}&nbsp;!</h1>
          {stats && (
            <p className={styles.summary}>
              Niveau {stats.level.level} · {formatXp(stats.xp)}
            </p>
          )}
        </div>
      </header>

      {progress.isError && <Notice tone="error">{errorMessage(progress.error)}</Notice>}
      {stats && (
        <>
          <Card className={styles.level}>
            <h2 className={styles.tileTitle}>
              <Emoji symbol="⭐" />
              <span>Niveau {stats.level.level}</span>
            </h2>
            <XpBar level={stats.level} />
          </Card>
          <div className={styles.tiles}>
            <Card className={styles.tile}>
              <h2 className={styles.tileTitle}>
                <Emoji symbol="🔥" />
                <span>Série</span>
              </h2>
              <p className={styles.figure}>{days(stats.streak.current)}</p>
              <p className={styles.caption}>
                {stats.streak.best > 0
                  ? `Record\u00A0: ${days(stats.streak.best)}`
                  : 'Valide une quête pour la lancer'}
              </p>
            </Card>
            <Card className={styles.tile}>
              <h2 className={styles.tileTitle}>
                <Emoji symbol="✅" />
                <span>Missions</span>
              </h2>
              <p className={styles.figure}>{stats.missions}</p>
              <p className={styles.caption}>
                {stats.missions > 1 ? 'quêtes validées' : 'quête validée'}
              </p>
            </Card>
            <Card className={styles.tile}>
              <h2 className={styles.tileTitle}>
                <Emoji symbol="🏆" />
                <span>Rang</span>
              </h2>
              <p className={styles.figure}>{mine?.rank ? ordinal(mine.rank) : '–'}</p>
              <p className={styles.caption}>
                {mine?.rank
                  ? `sur ${board.data?.length ?? 0} cette semaine`
                  : 'pas encore classé cette semaine'}
              </p>
            </Card>
          </div>
        </>
      )}

      {quests.isError && <Notice tone="error">{errorMessage(quests.error)}</Notice>}
      {quests.isPending && <p>Chargement des quêtes…</p>}

      {quests.isSuccess && todo.length === 0 && (
        <EmptyState emoji="🎯" title="Aucune quête pour l’instant">
          <p>
            {quests.data.length === 0
              ? 'Ton accompagnant ne t’a pas encore donné de quête. Reviens bientôt\u00A0!'
              : 'Tu es à jour. Reviens bientôt, ton accompagnant t’en préparera d’autres.'}
          </p>
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

      {stats && stats.recentRewards.length > 0 && (
        <Card>
          <h2 className={styles.sectionTitle}>Dernières récompenses</h2>
          <XpJournal entries={stats.recentRewards} />
        </Card>
      )}
    </>
  )
}

/** Leaderboard : le classement des élèves par missions accomplies, puis par XP. */
export function LeaderboardPage() {
  return (
    <>
      <h1>Leaderboard</h1>
      <Leaderboard />
    </>
  )
}
