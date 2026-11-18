import { useNavigate, useSearchParams } from 'react-router'
import { QUEST_TABS, tabOfStatus, type QuestTab } from '../../../shared/rules/assignment-status'
import { QUEST_CATEGORIES, type QuestCategory } from '../../../shared/rules/quests'
import type { StudentQuestSummary } from '../../../shared/schemas/quests'
import { errorMessage } from '../../lib/api'
import { EmptyState } from '../../ui/EmptyState'
import { Select } from '../../ui/Field'
import { LinkTabs } from '../../ui/LinkTabs'
import { Notice } from '../../ui/Notice'
import { QuestCard } from './QuestCard'
import styles from './MyQuestsPage.module.css'
import { useMyQuests } from './quests-api'

const EMPTY_TABS: Record<QuestTab, { title: string; text: string }> = {
  todo: {
    title: 'Aucune quête à faire',
    text: 'Tu es à jour. Reviens bientôt, ton accompagnant t’en préparera d’autres.',
  },
  pending: {
    title: 'Rien en attente',
    text: 'Les quêtes que ton accompagnant doit valider apparaîtront ici.',
  },
  done: {
    title: 'Aucune quête terminée pour l’instant',
    text: 'Tes quêtes validées et l’XP gagnée apparaîtront ici.',
  },
  expired: {
    title: 'Aucune quête expirée',
    text: 'Bravo, tu n’as laissé passer aucune deadline.',
  },
}

const time = (iso: string | null) => (iso ? new Date(iso).getTime() : 0)

/** Ordre de chaque onglet : le plus pressé d'abord pour agir, le plus récent d'abord pour relire. */
function sorted(tab: QuestTab, quests: StudentQuestSummary[]): StudentQuestSummary[] {
  if (tab === 'todo') return quests
  const key = (quest: StudentQuestSummary) =>
    tab === 'done'
      ? time(quest.validatedAt)
      : tab === 'pending'
        ? -time(quest.submittedAt)
        : time(quest.deadlineAt)
  return [...quests].sort((first, second) => key(second) - key(first))
}

/** « Mes quêtes » : onglets À faire, En attente de validation, Terminées, Expirées ; filtre par catégorie. */
export function MyQuestsPage() {
  const quests = useMyQuests()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const tab = QUEST_TABS.find((candidate) => candidate.id === params.get('onglet'))?.id ?? 'todo'
  const category = QUEST_CATEGORIES.find(
    (candidate) => candidate.id === params.get('categorie'),
  )?.id

  const address = (nextTab: QuestTab, nextCategory: QuestCategory | undefined) => {
    const search = new URLSearchParams()
    if (nextTab !== 'todo') search.set('onglet', nextTab)
    if (nextCategory) search.set('categorie', nextCategory)
    const text = search.toString()
    return text ? `/quetes?${text}` : '/quetes'
  }

  const all = quests.data ?? []
  const inCategory = category ? all.filter((quest) => quest.category === category) : all
  const inTab = (candidate: QuestTab) =>
    inCategory.filter((quest) => tabOfStatus(quest.status) === candidate)
  const shown = sorted(tab, inTab(tab))

  return (
    <>
      <h1>Mes quêtes</h1>
      {quests.isError && <Notice tone="error">{errorMessage(quests.error)}</Notice>}
      {quests.isPending && <p>Chargement des quêtes…</p>}

      {quests.isSuccess && all.length === 0 && (
        <EmptyState emoji="🎯" title="Aucune quête pour l’instant">
          <p>Tes quêtes apparaîtront ici dès que ton accompagnant t’en donnera.</p>
        </EmptyState>
      )}

      {all.length > 0 && (
        <>
          <LinkTabs
            label="État des quêtes"
            tabs={QUEST_TABS.map((candidate) => ({
              to: address(candidate.id, category),
              label: candidate.label,
              shortLabel: candidate.shortLabel,
              count: inTab(candidate.id).length,
              active: candidate.id === tab,
            }))}
          />
          <Select
            label="Catégorie"
            className={styles.filter}
            value={category ?? ''}
            onChange={(event) =>
              void navigate(address(tab, (event.target.value || undefined) as QuestCategory), {
                replace: true,
              })
            }
            options={[
              { value: '', label: 'Toutes les catégories' },
              ...QUEST_CATEGORIES.map(({ id, label }) => ({ value: id, label })),
            ]}
          />
          {shown.length > 0 ? (
            <ul className={styles.list}>
              {shown.map((quest) => (
                <li key={quest.id}>
                  <QuestCard quest={quest} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState emoji="🎯" title={EMPTY_TABS[tab].title}>
              <p>
                {category
                  ? 'Aucune quête de cette catégorie dans cet onglet.'
                  : EMPTY_TABS[tab].text}
              </p>
            </EmptyState>
          )}
        </>
      )}
    </>
  )
}
