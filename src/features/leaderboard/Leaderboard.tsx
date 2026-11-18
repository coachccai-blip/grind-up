import { Link, useLocation, useSearchParams } from 'react-router'
import {
  LEADERBOARD_PERIODS,
  type LeaderboardPeriod,
  type LeaderboardSort,
} from '../../../shared/rules/leaderboard'
import type { LeaderboardEntry } from '../../../shared/schemas/leaderboard'
import { errorMessage } from '../../lib/api'
import { Avatar } from '../../ui/Avatar'
import { Chip } from '../../ui/Chip'
import { classes } from '../../ui/classes'
import { Emoji } from '../../ui/Emoji'
import { EmptyState } from '../../ui/EmptyState'
import { LinkTabs } from '../../ui/LinkTabs'
import { Notice } from '../../ui/Notice'
import { formatXp } from '../quests/QuestChips'
import styles from './Leaderboard.module.css'
import { useLeaderboard } from './leaderboard-api'

const MEDALS = ['🥇', '🥈', '🥉']
/** Ordre d'affichage du podium : le deuxième à gauche, le premier au centre, le troisième à droite. */
const PODIUM_ORDER = [1, 0, 2]

const missionsLabel = (count: number) => `${count}\u00A0mission${count > 1 ? 's' : ''}`

const EMPTY_PERIOD: Record<LeaderboardPeriod, string> = {
  week: 'Personne n’a encore validé de quête cette semaine.',
  month: 'Personne n’a encore validé de quête ce mois-ci.',
  all: 'Personne n’a encore validé de quête.',
}

/** Flèche de mouvement : la forme et le nombre disent le sens, la couleur ne fait que l'appuyer. */
function Movement({ places }: { places: number | null }) {
  if (places === null || places === 0) return null
  const count = Math.abs(places)
  const text = `${count} place${count > 1 ? 's' : ''} ${places > 0 ? 'gagnée' : 'perdue'}${count > 1 ? 's' : ''} depuis hier`
  return (
    <span className={classes(styles.movement, places > 0 ? styles.up : styles.down)} title={text}>
      <span aria-hidden="true">
        {places > 0 ? '▲' : '▼'}&nbsp;{count}
      </span>
      <span className="visually-hidden">{text}</span>
    </span>
  )
}

function Tags({ entry }: { entry: LeaderboardEntry }) {
  return (
    <>
      {entry.isYou && <Chip tone="success">Toi</Chip>}
      {entry.isBot && <Chip>Bot</Chip>}
    </>
  )
}

/**
 * Leaderboard : périodes, tri, podium des trois premiers, puis la liste. La
 * ligne de l'utilisateur connecté est mise en avant et reste à l'écran quand la
 * liste défile.
 */
export function Leaderboard() {
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  const period =
    LEADERBOARD_PERIODS.find((candidate) => candidate.id === params.get('periode'))?.id ?? 'week'
  const sort: LeaderboardSort = params.get('tri') === 'xp' ? 'xp' : 'missions'
  const query = useLeaderboard(period, sort)

  const address = (nextPeriod: LeaderboardPeriod, nextSort: LeaderboardSort) => {
    const search = new URLSearchParams()
    if (nextPeriod !== 'week') search.set('periode', nextPeriod)
    if (nextSort !== 'missions') search.set('tri', nextSort)
    const text = search.toString()
    return text ? `${pathname}?${text}` : pathname
  }

  const entries = query.data ?? []
  const ranked = entries.filter((entry) => entry.rank !== null)
  const podium = ranked.slice(0, 3)
  const rest = entries.slice(podium.length)

  return (
    <div className={styles.leaderboard}>
      <LinkTabs
        label="Période du classement"
        columns={3}
        tabs={LEADERBOARD_PERIODS.map((candidate) => ({
          to: address(candidate.id, sort),
          label: candidate.label,
          shortLabel: candidate.shortLabel,
          active: candidate.id === period,
        }))}
      />
      <p className={styles.sort}>
        <span>{sort === 'missions' ? 'Classé par missions accomplies.' : 'Classé par XP.'}</span>
        <Link to={address(period, sort === 'missions' ? 'xp' : 'missions')} replace>
          {sort === 'missions' ? 'Trier par XP' : 'Trier par missions'}
        </Link>
      </p>

      {query.isError && <Notice tone="error">{errorMessage(query.error)}</Notice>}
      {query.isPending && <p>Chargement du classement…</p>}

      {query.isSuccess && ranked.length === 0 && (
        <EmptyState emoji="🏆" title="Le classement est ouvert">
          <p>{EMPTY_PERIOD[period]}</p>
        </EmptyState>
      )}

      {podium.length > 0 && (
        <ol className={styles.podium} aria-label="Podium">
          {PODIUM_ORDER.filter((position) => podium[position]).map((position) => {
            const entry = podium[position]!
            return (
              <li
                key={entry.pseudo}
                className={classes(
                  styles.step,
                  styles[`step${position + 1}`],
                  entry.isYou && styles.you,
                )}
              >
                <Emoji symbol={MEDALS[position]!} className={styles.medal} />
                <span className="visually-hidden">Rang {entry.rank}</span>
                <Avatar avatar={entry.avatar} decorative />
                <span className={styles.name}>{entry.pseudo}</span>
                <span className={styles.tags}>
                  <Tags entry={entry} />
                </span>
                <span className={styles.figures}>
                  <span>{missionsLabel(entry.missions)}</span>
                  <span>{formatXp(entry.xp)}</span>
                  <span>Niveau {entry.level}</span>
                </span>
                <Movement places={entry.movement} />
              </li>
            )
          })}
        </ol>
      )}

      {rest.length > 0 && (
        <ol className={styles.list} aria-label="Suite du classement">
          {rest.map((entry) => (
            <li key={entry.pseudo} className={classes(styles.row, entry.isYou && styles.you)}>
              <span className={styles.rank}>
                {entry.rank === null ? (
                  <>
                    <span aria-hidden="true">–</span>
                    <span className="visually-hidden">Pas encore classé</span>
                  </>
                ) : (
                  <>
                    <span className="visually-hidden">Rang </span>
                    {entry.rank}
                  </>
                )}
              </span>
              <Avatar avatar={entry.avatar} size="small" decorative />
              <span className={styles.who}>
                <span className={styles.name}>{entry.pseudo}</span>
                <span className={styles.level}>Niveau {entry.level}</span>
              </span>
              <span className={styles.tags}>
                <Tags entry={entry} />
                <Movement places={entry.movement} />
              </span>
              <span className={styles.score}>
                <span className={styles.missions}>{missionsLabel(entry.missions)}</span>
                <span className={styles.xp}>{formatXp(entry.xp)}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
