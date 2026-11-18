import { NavLink, Outlet } from 'react-router'
import { MAIN_CONTENT_ID, SkipLink } from '../../app/RootLayout'
import { useCurrentUser } from '../../app/session'
import { Avatar } from '../../ui/Avatar'
import { classes } from '../../ui/classes'
import { Emoji } from '../../ui/Emoji'
import { CelebrationDialog } from './CelebrationDialog'
import styles from './StudentLayout.module.css'

/** Les quatre destinations de l'élève (section 8 : navigation élève). */
const DESTINATIONS = [
  { to: '/', emoji: '🏠', label: 'Tableau de bord', end: true },
  { to: '/quetes', emoji: '🎯', label: 'Mes quêtes', end: false },
  { to: '/leaderboard', emoji: '🏆', label: 'Leaderboard', end: false },
  { to: '/profil', emoji: '👤', label: 'Profil', end: false },
]

/**
 * Espace élève : une barre de navigation en bas sur téléphone, en haut sur
 * ordinateur (à partir de 1 024 px).
 */
export function StudentLayout() {
  const user = useCurrentUser()

  return (
    <div className={styles.shell}>
      <SkipLink />
      <nav className={styles.bar} aria-label="Navigation principale">
        <p className={styles.wordmark}>Grind up</p>
        <ul className={styles.destinations}>
          {DESTINATIONS.map((destination) => (
            <li key={destination.to} className={styles.item}>
              <NavLink
                to={destination.to}
                end={destination.end}
                className={({ isActive }) => classes(styles.link, isActive && styles.active)}
              >
                <Emoji symbol={destination.emoji} className={styles.emoji} />
                <span className={styles.label}>{destination.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
        <p className={styles.identity}>
          <Avatar avatar={user.avatar} size="small" decorative />
          <span>{user.pseudo}</span>
        </p>
      </nav>
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <CelebrationDialog />
    </div>
  )
}
