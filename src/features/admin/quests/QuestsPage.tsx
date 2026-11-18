import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { findFormat, QUEST_CATEGORIES, type QuestCategory } from '../../../../shared/rules/quests'
import type { AdminQuestSummary } from '../../../../shared/schemas/quests'
import { errorMessage } from '../../../lib/api'
import { formatDateTime } from '../../../lib/dates'
import { ButtonLink } from '../../../ui/Button'
import { EmptyState } from '../../../ui/EmptyState'
import { Select } from '../../../ui/Field'
import { Notice } from '../../../ui/Notice'
import { CategoryChip, formatXp, QuestStateChip } from '../../quests/QuestChips'
import { useAdminQuests } from './quests-api'
import styles from './QuestsPage.module.css'

type StateFilter = 'active' | 'draft' | 'published' | 'archived'
type DeadlineFilter = 'all' | 'upcoming' | 'past' | 'none'

const STATE_OPTIONS: { value: StateFilter; label: string }[] = [
  { value: 'active', label: 'Brouillons et publiées' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'published', label: 'Publiées' },
  { value: 'archived', label: 'Archivées' },
]

const DEADLINE_OPTIONS: { value: DeadlineFilter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'upcoming', label: 'À venir' },
  { value: 'past', label: 'Dépassée' },
  { value: 'none', label: 'Sans deadline' },
]

function matches(
  quest: AdminQuestSummary,
  filters: { category: QuestCategory | ''; state: StateFilter; deadline: DeadlineFilter },
  now: number,
): boolean {
  if (filters.category && quest.category !== filters.category) return false
  if (filters.state === 'active' ? quest.state === 'archived' : quest.state !== filters.state) {
    return false
  }
  const deadline = quest.deadlineAt ? new Date(quest.deadlineAt).getTime() : null
  switch (filters.deadline) {
    case 'upcoming':
      return deadline !== null && deadline > now
    case 'past':
      return deadline !== null && deadline <= now
    case 'none':
      return deadline === null
    default:
      return true
  }
}

/** Avancement d'une quête publiée, en une phrase. */
function progressText(quest: AdminQuestSummary): string {
  const { assigned, validated, submitted } = quest.progress
  if (quest.state === 'draft') return 'Pas encore publiée'
  if (assigned === 0) return 'Aucun élève'
  const done = `${validated} sur ${assigned} validée${validated > 1 ? 's' : ''}`
  return submitted > 0 ? `${done} · ${submitted} à valider` : done
}

/** Liste des quêtes de l'admin, filtrable par catégorie, état et deadline. */
export function QuestsPage() {
  const quests = useAdminQuests()
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  const [category, setCategory] = useState<QuestCategory | ''>('')
  const [state, setState] = useState<StateFilter>('active')
  const [deadline, setDeadline] = useState<DeadlineFilter>('all')
  const [now] = useState(() => Date.now())

  const all = quests.data ?? []
  const shown = all.filter((quest) => matches(quest, { category, state, deadline }, now))

  return (
    <>
      <div className={styles.heading}>
        <h1>Quêtes</h1>
        <div className={styles.headingActions}>
          <ButtonLink to="/admin/quetes/bibliotheque">Bibliothèque</ButtonLink>
          <ButtonLink to="/admin/quetes/nouvelle" variant="primary">
            Nouvelle quête
          </ButtonLink>
        </div>
      </div>
      {notice && <Notice tone="success">{notice}</Notice>}
      {quests.isError && <Notice tone="error">{errorMessage(quests.error)}</Notice>}
      {quests.isPending && <p>Chargement des quêtes…</p>}

      {quests.isSuccess && all.length === 0 && (
        <EmptyState emoji="🎯" title="Aucune quête pour l’instant">
          <p>
            Créez votre première quête, ou partez d’un exercice de la bibliothèque, puis donnez-la à
            vos élèves.
          </p>
        </EmptyState>
      )}

      {all.length > 0 && (
        <>
          <div className={styles.filters}>
            <Select
              label="Catégorie"
              value={category}
              onChange={(event) => setCategory(event.target.value as QuestCategory | '')}
              options={[
                { value: '', label: 'Toutes' },
                ...QUEST_CATEGORIES.map(({ id, label }) => ({ value: id, label })),
              ]}
            />
            <Select
              label="État"
              value={state}
              onChange={(event) => setState(event.target.value as StateFilter)}
              options={STATE_OPTIONS}
            />
            <Select
              label="Deadline"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value as DeadlineFilter)}
              options={DEADLINE_OPTIONS}
            />
          </div>
          <p className={styles.count} role="status">
            {shown.length === all.length
              ? `${all.length} quête${all.length > 1 ? 's' : ''}`
              : `${shown.length} sur ${all.length} quêtes`}
          </p>
          <ul className={styles.list}>
            {shown.map((quest) => (
              <li key={quest.id}>
                <Link to={`/admin/quetes/${quest.id}`} className={styles.row}>
                  <span className={styles.title}>{quest.title}</span>
                  <span className={styles.tags}>
                    <CategoryChip category={quest.category} withEmoji />
                    <QuestStateChip state={quest.state} />
                  </span>
                  <span className={styles.meta}>
                    {findFormat(quest.format).label} · {formatXp(quest.rewardXp)}
                  </span>
                  <span className={styles.meta}>
                    {quest.deadlineAt
                      ? `Deadline\u00A0: le ${formatDateTime(quest.deadlineAt)}`
                      : 'Sans deadline'}
                  </span>
                  <span className={styles.progress}>{progressText(quest)}</span>
                </Link>
              </li>
            ))}
          </ul>
          {shown.length === 0 && <p>Aucune quête ne correspond à ces filtres.</p>}
        </>
      )}
    </>
  )
}
