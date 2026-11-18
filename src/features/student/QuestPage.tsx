import { useEffect, useRef } from 'react'
import { useParams } from 'react-router'
import { isAutoCorrected } from '../../../shared/rules/quests'
import { BONUS_LABELS } from '../../../shared/rules/rewards'
import type { StudentQuestDetail } from '../../../shared/schemas/quests'
import { ApiError, errorFields, errorMessage } from '../../lib/api'
import { formatDateTime } from '../../lib/dates'
import { Card } from '../../ui/Card'
import { Chip } from '../../ui/Chip'
import { Countdown } from '../../ui/Countdown'
import { EmptyState } from '../../ui/EmptyState'
import { Notice } from '../../ui/Notice'
import { RichText } from '../../ui/RichText'
import { TextLink } from '../../ui/TextLink'
import { CategoryChip, difficultyLabel, formatXp, StatusChip } from '../quests/QuestChips'
import { QuestImage } from '../quests/QuestImage'
import { ExactForm } from './formats/ExactForm'
import { Flashcards } from './formats/Flashcards'
import { DeclarativeForm, FreeTextForm } from './formats/ManualForms'
import { QcmForm } from './formats/QcmForm'
import type { FormatProps } from './formats/types'
import { useMyQuest, useStartQuest, useSubmitAttempt, type AttemptBody } from './quests-api'
import styles from './QuestPage.module.css'

/** Détail d'une quête : consigne, récompense, compte à rebours, puis l'interface de son format. */
export function QuestPage() {
  const { questId = '' } = useParams()
  const query = useMyQuest(questId)
  const start = useStartQuest(questId)
  const attempt = useSubmitAttempt(questId)
  const quest = query.data

  // Ouvrir la quête la fait passer de « À faire » à « En cours », une seule fois.
  const started = useRef(false)
  const startQuest = start.mutate
  const status = quest?.status
  useEffect(() => {
    if (status === 'todo' && !started.current) {
      started.current = true
      startQuest()
    }
  }, [status, startQuest])

  if (query.isPending) return <p>Chargement de la quête…</p>
  if (!quest) {
    const missing = query.error instanceof ApiError && query.error.status === 404
    return (
      <>
        <BackLink />
        {missing ? (
          <EmptyState emoji="🧩" title="Quête introuvable" pageTitle>
            <p>Cette quête n’existe pas, ou elle ne t’est pas destinée.</p>
          </EmptyState>
        ) : (
          <Notice tone="error">{errorMessage(query.error)}</Notice>
        )}
      </>
    )
  }

  const open =
    quest.status === 'todo' || quest.status === 'in_progress' || quest.status === 'rejected'
  // Rouverte après sa deadline : elle ne rapporte plus qu'une part de sa récompense.
  const reopened = quest.lateRewardXp !== null
  // Ce que l'écran montre sous la consigne. Passer de « À faire » à « En cours » n'y change
  // rien : la saisie en cours ne doit pas être perdue quand la quête démarre.
  const view =
    quest.status === 'validated' || quest.status === 'submitted' || quest.status === 'expired'
      ? quest.status
      : quest.blocked
        ? 'blocked'
        : 'form'

  return (
    <>
      <BackLink />
      <header className={styles.header}>
        <div className={styles.tags}>
          <CategoryChip category={quest.category} withEmoji />
          <Chip>{difficultyLabel(quest.difficulty)}</Chip>
          <Chip>{formatXp(quest.lateRewardXp ?? quest.rewardXp)}</Chip>
        </div>
        <h1>{quest.title}</h1>
        <div className={styles.tags}>
          <StatusChip status={quest.status} blocked={quest.blocked} />
          {reopened && <Chip tone="warning">Rouverte</Chip>}
          {open && !reopened && quest.deadlineAt && <Countdown deadlineAt={quest.deadlineAt} />}
        </div>
        {quest.deadlineAt && (
          <p className={styles.deadline}>Deadline&nbsp;: le {formatDateTime(quest.deadlineAt)}</p>
        )}
      </header>

      {quest.lateRewardXp !== null && (
        <Notice tone="info">
          La deadline est passée, mais ton accompagnant a rouvert cette quête pour toi. Elle
          rapporte maintenant {formatXp(quest.lateRewardXp)} au lieu de {formatXp(quest.rewardXp)}.
        </Notice>
      )}

      {(quest.instructions.trim() !== '' || quest.imageUrl) && (
        <Card className={styles.instructions}>
          <h2>Consigne</h2>
          {quest.instructions.trim() !== '' && <RichText text={quest.instructions} />}
          {quest.imageUrl && <QuestImage src={quest.imageUrl} />}
        </Card>
      )}

      <QuestBody
        // Une nouvelle correction repart d'un formulaire rempli avec les dernières réponses.
        key={`${view}-${quest.attemptsUsed}`}
        quest={quest}
        busy={attempt.isPending}
        onSubmit={(body: AttemptBody) => attempt.mutate(body)}
        error={attempt.isError ? attempt.error : null}
      />
    </>
  )
}

const BackLink = () => (
  <p>
    <TextLink to="/quetes">Retour à mes quêtes</TextLink>
  </p>
)

/** L'interface du format, en lecture seule quand la quête ne peut plus être modifiée. */
function FormatView(props: FormatProps & { textError?: string | null }) {
  const { textError, ...format } = props
  switch (props.quest.format) {
    case 'exact':
      return <ExactForm {...format} />
    case 'qcm':
      return <QcmForm {...format} />
    case 'flashcards':
      return <Flashcards {...format} />
    case 'declarative':
      return <DeclarativeForm {...format} />
    case 'free_text':
      return <FreeTextForm {...format} error={textError} />
  }
}

interface BodyProps extends Omit<FormatProps, 'readOnly'> {
  error: unknown
}

function QuestBody({ quest, busy, onSubmit, error }: BodyProps) {
  const auto = isAutoCorrected(quest.format)
  const last = quest.lastAttempt
  const fieldError = errorFields(error).text
  const sent = last ? last.text || last.comment : ''

  if (quest.status === 'validated') {
    return (
      <>
        <ValidatedPanel quest={quest} />
        {auto ? (
          <Card>
            <h2 className={styles.sectionTitle}>
              {quest.format === 'flashcards' ? 'Les cartes' : 'Tes réponses'}
            </h2>
            <FormatView quest={quest} busy={false} onSubmit={() => undefined} readOnly />
          </Card>
        ) : (
          sent !== '' && <SentAnswer text={sent} />
        )}
      </>
    )
  }

  if (quest.status === 'submitted') {
    return (
      <>
        <Notice tone="info" title="Réponse envoyée">
          Ton accompagnant doit maintenant la valider. Tu gagneras ton XP à ce moment-là.
        </Notice>
        {sent !== '' && <SentAnswer text={sent} />}
      </>
    )
  }

  if (quest.status === 'expired') {
    return (
      <Notice tone="info" title="Deadline dépassée">
        Cette quête est expirée et ne rapporte plus d’XP. Si tu penses pouvoir encore la faire,
        parles-en à ton accompagnant.
      </Notice>
    )
  }

  if (quest.blocked) {
    return (
      <>
        <Notice tone="warning" title="Tentatives épuisées">
          Tu as utilisé tes {quest.attemptsUsed} tentatives. Demande à ton accompagnant de t’en
          redonner.
        </Notice>
        {quest.format !== 'flashcards' && (
          <Card>
            <h2 className={styles.sectionTitle}>Tes dernières réponses</h2>
            <FormatView quest={quest} busy={false} onSubmit={() => undefined} readOnly />
          </Card>
        )}
      </>
    )
  }

  return (
    <>
      {quest.status === 'rejected' && (
        <Card tone="urgent">
          <h2 className={styles.sectionTitle}>À reprendre</h2>
          <p>Ton accompagnant te demande de recommencer.</p>
          {quest.adminComment && (
            <p className={styles.comment}>«&nbsp;{quest.adminComment}&nbsp;»</p>
          )}
        </Card>
      )}
      {auto && last && (
        <Notice tone="warning" title={`Tu as ${last.score ?? 0}\u00A0% de bonnes réponses`}>
          Il en faut {quest.passThreshold}&nbsp;% pour valider la quête. Corrige les réponses à
          revoir, puis valide à nouveau.
        </Notice>
      )}
      {error !== null && fieldError === undefined && (
        <Notice tone="error">{errorMessage(error)}</Notice>
      )}
      <Card>
        <FormatView quest={quest} busy={busy} onSubmit={onSubmit} textError={fieldError} />
        {auto && (
          <p className={styles.attempts}>
            Tentative {Math.min(quest.attemptsUsed + 1, quest.attemptsAllowed)} sur{' '}
            {quest.attemptsAllowed} · {quest.passThreshold}&nbsp;% de bonnes réponses pour valider
          </p>
        )}
      </Card>
    </>
  )
}

function SentAnswer({ text }: { text: string }) {
  return (
    <Card>
      <h2 className={styles.sectionTitle}>Ta réponse</h2>
      <p className={styles.sent}>{text}</p>
    </Card>
  )
}

/** Quête validée : l'XP gagnée et son détail. */
function ValidatedPanel({ quest }: { quest: StudentQuestDetail }) {
  const reward = quest.reward
  return (
    <Card tone="success" className={styles.validated}>
      <h2>Quête validée</h2>
      <p className={styles.gain}>+{formatXp(reward?.total ?? quest.xpAwarded ?? 0)}</p>
      {reward && (reward.bonuses.length > 0 || reward.late) && (
        <ul className={styles.breakdown}>
          <li>
            <span>{reward.late ? 'Récompense, quête rendue en retard' : 'Récompense'}</span>
            <span>{formatXp(reward.base)}</span>
          </li>
          {reward.bonuses.map((bonus) => (
            <li key={bonus.kind}>
              <span>{BONUS_LABELS[bonus.kind]}</span>
              <span>+{formatXp(bonus.amount)}</span>
            </li>
          ))}
        </ul>
      )}
      {quest.adminComment && (
        <p className={styles.comment}>Ton accompagnant&nbsp;: «&nbsp;{quest.adminComment}&nbsp;»</p>
      )}
    </Card>
  )
}
