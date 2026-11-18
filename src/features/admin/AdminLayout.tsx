import { useId, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useCurrentUser, useLogout } from '../../app/session'
import { Button } from '../../ui/Button'
import { classes } from '../../ui/classes'
import { Emoji } from '../../ui/Emoji'
import styles from './AdminLayout.module.css'

/** Les six écrans de l'admin (section 8 : navigation admin). */
const DESTINATIONS = [
  { to: '/admin', emoji: '📊', label: 'Vue d’ensemble', end: true },
  { to: '/admin/eleves', emoji: '🎒', label: 'Élèves', end: false },
  { to: '/admin/quetes', emoji: '🎯', label: 'Quêtes', end: false },
  { to: '/admin/validations', emoji: '✅', label: 'Validations', end: false },
  { to: '/admin/bots', emoji: '🤖', label: 'Bots', end: false },
  { to: '/admin/parametres', emoji: '⚙️', label: 'Paramètres', end: false },
]

/**
 * Espace admin : un menu latéral sur ordinateur, un menu repliable sur téléphone.
 */
export function AdminLayout() {
  const user = useCurrentUser()
  const logout = useLogout()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()

  return (
    <div className={styles.shell}>
      <header className={styles.side}>
        <div className={styles.brand}>
          <p className={styles.wordmark}>Grind up</p>
          <p className={styles.caption}>Espace admin</p>
        </div>
        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'Fermer' : 'Menu'}
        </button>
        <nav
          id={menuId}
          className={classes(styles.menu, menuOpen && styles.menuOpen)}
          aria-label="Navigation de l’espace admin"
        >
          <ul className={styles.destinations}>
            {DESTINATIONS.map((destination) => (
              <li key={destination.to}>
                <NavLink
                  to={destination.to}
                  end={destination.end}
                  className={({ isActive }) => classes(styles.link, isActive && styles.active)}
                  onClick={() => setMenuOpen(false)}
                >
                  <Emoji symbol={destination.emoji} className={styles.emoji} />
                  <span>{destination.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          <div className={styles.account}>
            <p className={styles.pseudo}>{user.pseudo}</p>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => logout.mutate(undefined)}
              disabled={logout.isPending}
            >
              Se déconnecter
            </Button>
          </div>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
