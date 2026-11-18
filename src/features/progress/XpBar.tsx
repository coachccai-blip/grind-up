import type { LevelProgress } from '../../../shared/rules/levels'
import { formatXp } from '../quests/QuestChips'
import styles from './XpBar.module.css'

/**
 * Barre d'XP : ce qui est acquis dans le niveau en cours, et ce qu'il reste
 * avant le suivant. C'est l'un des cinq endroits où le dégradé « Océan » est permis.
 */
export function XpBar({ level }: { level: LevelProgress }) {
  return (
    <div className={styles.xp}>
      <progress
        className={styles.bar}
        max={level.xpToNextLevel}
        value={level.xpInLevel}
        aria-label={`Progression vers le niveau ${level.level + 1}`}
      />
      <p className={styles.caption}>
        <span>
          {formatXp(level.xpInLevel)} sur {formatXp(level.xpToNextLevel)}
        </span>
        <span>
          Encore {formatXp(level.xpRemaining)} avant le niveau {level.level + 1}
        </span>
      </p>
    </div>
  )
}
