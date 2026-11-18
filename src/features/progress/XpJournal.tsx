import type { XpEntry } from '../../../shared/schemas/progress'
import { capitalize, formatRelative } from '../../lib/dates'
import { formatXp } from '../quests/QuestChips'
import styles from './XpJournal.module.css'

/** Lignes du journal d'XP : ce qui a rapporté ou retiré de l'XP, et quand. */
export function XpJournal({ entries }: { entries: readonly XpEntry[] }) {
  return (
    <ul className={styles.journal}>
      {entries.map((entry) => (
        <li key={entry.id} className={styles.entry}>
          <span className={styles.what}>
            <span className={styles.label}>{entry.label}</span>
            <span className={styles.when}>{capitalize(formatRelative(entry.createdAt))}</span>
          </span>
          <span className={styles.amount}>
            {entry.amount > 0 ? '+' : ''}
            {formatXp(entry.amount)}
          </span>
        </li>
      ))}
    </ul>
  )
}
