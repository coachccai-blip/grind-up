import { findBadge } from '../../../shared/rules/badges'
import type { BadgeProgress } from '../../../shared/schemas/progress'
import { formatDayMonth } from '../../lib/dates'
import { classes } from '../../ui/classes'
import { Emoji } from '../../ui/Emoji'
import styles from './BadgeList.module.css'

interface BadgeListProps {
  badges: readonly BadgeProgress[]
  /** « you » : les conditions s'adressent à l'élève ; « they » : fiche d'un élève, vue par l'admin. */
  audience?: 'you' | 'they'
}

/** Badges obtenus et à débloquer. Un badge à débloquer montre où en est l'élève. */
export function BadgeList({ badges, audience = 'you' }: BadgeListProps) {
  return (
    <ul className={styles.list}>
      {badges.map((progress) => {
        const badge = findBadge(progress.code)
        if (!badge) return null
        const earned = progress.earnedAt !== null
        return (
          <li key={progress.code} className={classes(styles.badge, earned && styles.earned)}>
            <span className={styles.medal}>
              <Emoji symbol={badge.emoji} />
            </span>
            <span className={styles.text}>
              <span className={styles.label}>{badge.label}</span>
              {earned ? (
                <span className={styles.detail}>
                  Obtenu le {formatDayMonth(progress.earnedAt!)}
                </span>
              ) : (
                <span className={styles.detail}>
                  {audience === 'you' ? badge.condition : 'À débloquer'}
                  {progress.goal > 1 &&
                    (audience === 'you'
                      ? ` Tu en es à ${Math.min(progress.done, progress.goal)} sur ${progress.goal}.`
                      : `\u00A0: ${Math.min(progress.done, progress.goal)} sur ${progress.goal}`)}
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
