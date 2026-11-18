import { Link } from 'react-router'
import styles from './LinkTabs.module.css'
import { classes } from './classes'

export interface LinkTab {
  to: string
  label: string
  /** Libellé abrégé pour les petits écrans ; le libellé complet reste lu par les lecteurs d'écran. */
  shortLabel?: string
  /** Nombre d'éléments dans l'onglet, affiché à côté du libellé. */
  count?: number
  active: boolean
}

/**
 * Onglets qui changent l'adresse de la page : le bouton « Retour » du
 * navigateur revient à l'onglet précédent, et un onglet peut se partager.
 */
interface LinkTabsProps {
  label: string
  tabs: readonly LinkTab[]
  /** Nombre d'onglets par ligne sur téléphone : deux, ou trois pour des libellés courts. */
  columns?: 2 | 3
}

export function LinkTabs({ label, tabs, columns = 2 }: LinkTabsProps) {
  return (
    <nav aria-label={label}>
      <ul className={classes(styles.tabs, columns === 3 && styles.three)}>
        {tabs.map((tab) => (
          <li key={tab.to}>
            <Link
              to={tab.to}
              replace
              className={classes(styles.tab, tab.active && styles.active)}
              aria-current={tab.active ? 'page' : undefined}
            >
              {tab.shortLabel && tab.shortLabel !== tab.label ? (
                <>
                  <span className={styles.narrow} aria-hidden="true">
                    {tab.shortLabel}
                  </span>
                  <span className={styles.wide}>{tab.label}</span>
                </>
              ) : (
                <span>{tab.label}</span>
              )}
              {tab.count !== undefined && <span className={styles.count}>{tab.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
