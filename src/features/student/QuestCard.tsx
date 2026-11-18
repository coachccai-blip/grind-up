import { Link } from 'react-router'
import { findCategory } from '../../../shared/rules/quests'
import type { StudentQuestSummary } from '../../../shared/schemas/quests'
import { formatDayMonth } from '../../lib/dates'
import { Chip } from '../../ui/Chip'
import { classes } from '../../ui/classes'
import { Countdown } from '../../ui/Countdown'
import { Emoji } from '../../ui/Emoji'
import { categoryTone, difficultyLabel, formatXp, StatusChip } from '../quests/QuestChips'
import styles from './QuestCard.module.css'

/**
 * Une quête dans une liste de l'élève : sa catégorie, sa récompense et, tant
 * qu'elle reste à faire, son compte à rebours. Un seul emoji par carte : celui
 * de la catégorie.
 */
export function QuestCard({ quest }: { quest: StudentQuestSummary }) {
  const category = findCategory(quest.category)
  const open =
    quest.status === 'todo' || quest.status === 'in_progress' || quest.status === 'rejected'
  const validated = quest.status === 'validated'
  const showStatus = !validated && (quest.status !== 'todo' || quest.blocked)

  return (
    <Link to={`/quetes/${quest.id}`} className={styles.card}>
      <span className={classes(styles.badge, styles[categoryTone(quest.category)])}>
        <Emoji symbol={category.emoji} />
      </span>
      <span className={styles.body}>
        <span className={styles.title}>{quest.title}</span>
        <span className={styles.meta}>
          {category.label} · {difficultyLabel(quest.difficulty)}
        </span>
      </span>
      <span className={styles.reward}>
        {validated && quest.xpAwarded !== null
          ? `+${formatXp(quest.xpAwarded)}`
          : formatXp(quest.rewardXp)}
      </span>
      <span className={styles.chips}>
        {showStatus && <StatusChip status={quest.status} blocked={quest.blocked} />}
        {open && quest.deadlineAt && <Countdown deadlineAt={quest.deadlineAt} />}
        {validated && (
          <Chip tone="success">
            {quest.validatedAt ? `Validée le ${formatDayMonth(quest.validatedAt)}` : 'Validée'}
          </Chip>
        )}
      </span>
    </Link>
  )
}
