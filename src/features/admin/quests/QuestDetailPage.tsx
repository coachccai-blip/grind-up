import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { findDifficulty, findFormat, isAutoCorrected } from '../../../../shared/rules/quests'
import type {
  AdminAssignment,
  AdminQuestDetail,
  Assignees,
} from '../../../../shared/schemas/quests'
import { ApiError, errorMessage } from '../../../lib/api'
import { formatDateTime } from '../../../lib/dates'
import { Avatar } from '../../../ui/Avatar'
import { Button, ButtonLink } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { Dialog, DialogActions } from '../../../ui/Dialog'
import { EmptyState } from '../../../ui/EmptyState'
import { Notice } from '../../../ui/Notice'
import { RichText } from '../../../ui/RichText'
import { TextLink } from '../../../ui/TextLink'
import { CategoryChip, formatXp, QuestStateChip, StatusChip } from '../../quests/QuestChips'
import { QuestImage } from '../../quests/QuestImage'
import { useLatePercent } from '../settings/settings-api'
import { useStudents } from '../students-api'
import { AssigneePicker } from './AssigneePicker'
import styles from './QuestDetailPage.module.css'
import {
  useAddAssignees,
  useAdminQuest,
  useAssignmentAction,
  useDeleteDraft,
  useQuestAction,
} from './quests-api'

/** Fiche d'une quête : ses réglages, son contenu, et l'avancement de chaque élève. */
export function QuestDetailPage() {
  const { id = '' } = useParams()
  const query = useAdminQuest(id)
  const quest = query.data

  if (query.isPending) return <p>Chargement de la quête…</p>
  if (!quest) {
    const missing = query.error instanceof ApiError && query.error.status === 404
    return (
      <>
        <BackLink />
        {missing ? (
          <EmptyState emoji="🧩" title="Quête introuvable" pageTitle>
            <p>Elle a peut-être été supprimée.</p>
          </EmptyState>
        ) : (
          <Notice tone="error">{errorMessage(query.error)}</Notice>
        )}
      </>
    )
  }
  return <QuestSheet key={quest.id} quest={quest} />
}

const BackLink = () => (
  <p>
    <TextLink to="/admin/quetes">Retour aux quêtes</TextLink>
  </p>
)

type OpenDialog = 'assign' | 'archive' | 'delete' | null

function QuestSheet({ quest }: { quest: AdminQuestDetail }) {
  const navigate = useNavigate()
  const location = useLocation()
  const arrival = location.state as { notice?: string; warning?: string } | null
  const [notice, setNotice] = useState<string | null>(arrival?.notice ?? null)
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null)
  const close = () => setOpenDialog(null)

  const publish = useQuestAction(quest.id, 'publish')
  const duplicate = useQuestAction(quest.id, 'duplicate')
  const restore = useQuestAction(quest.id, 'restore')
  const auto = isAutoCorrected(quest.format)
  const incomplete = publish.error instanceof ApiError && publish.error.code === 'quest_incomplete'

  return (
    <>
      <BackLink />
      <Card className={styles.header}>
        <div className={styles.tags}>
          <CategoryChip category={quest.category} withEmoji />
          <QuestStateChip state={quest.state} />
        </div>
        <h1>{quest.title}</h1>
        <dl className={styles.facts}>
          <div>
            <dt>Format</dt>
            <dd>{findFormat(quest.format).label}</dd>
          </div>
          <div>
            <dt>Difficulté</dt>
            <dd>{findDifficulty(quest.difficulty).label}</dd>
          </div>
          <div>
            <dt>Récompense</dt>
            <dd>{formatXp(quest.rewardXp)}</dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd>{quest.deadlineAt ? `Le ${formatDateTime(quest.deadlineAt)}` : 'Aucune'}</dd>
          </div>
          {auto && (
            <>
              <div>
                <dt>Seuil de réussite</dt>
                <dd>{quest.passThreshold}&nbsp;%</dd>
              </div>
              <div>
                <dt>Tentatives</dt>
                <dd>{quest.maxAttempts}</dd>
              </div>
            </>
          )}
          {!auto && (
            <div>
              <dt>Validation</dt>
              <dd>{quest.manualValidation ? 'Par vous' : 'Immédiate'}</dd>
            </div>
          )}
        </dl>
        <div className={styles.actions}>
          {quest.state === 'draft' && (
            <Button
              variant="primary"
              onClick={() =>
                publish.mutate(undefined, { onSuccess: () => setNotice('Quête publiée.') })
              }
              busy={publish.isPending}
              busyLabel="Publication…"
            >
              Publier la quête
            </Button>
          )}
          {quest.state !== 'archived' && (
            <ButtonLink to={`/admin/quetes/${quest.id}/modifier`}>Modifier</ButtonLink>
          )}
          {quest.state === 'published' && (
            <Button onClick={() => setOpenDialog('assign')}>Ajouter des élèves</Button>
          )}
          <Button
            onClick={() =>
              duplicate.mutate(undefined, {
                onSuccess: ({ quest: copy }) =>
                  void navigate(`/admin/quetes/${copy.id}/modifier`, {
                    state: { notice: 'Copie créée en brouillon.' },
                  }),
              })
            }
            busy={duplicate.isPending}
            busyLabel="Copie…"
          >
            Dupliquer
          </Button>
          {quest.state === 'published' && (
            <Button onClick={() => setOpenDialog('archive')}>Archiver</Button>
          )}
          {quest.state === 'archived' && (
            <Button
              onClick={() =>
                restore.mutate(undefined, { onSuccess: () => setNotice('Quête restaurée.') })
              }
              busy={restore.isPending}
              busyLabel="Restauration…"
            >
              Restaurer
            </Button>
          )}
          {quest.state === 'draft' && (
            <Button variant="danger" onClick={() => setOpenDialog('delete')}>
              Supprimer le brouillon
            </Button>
          )}
        </div>
      </Card>

      {notice && <Notice tone="success">{notice}</Notice>}
      {arrival?.warning && <Notice tone="warning">{arrival.warning}</Notice>}
      {incomplete && (
        <Notice tone="error" title="La quête ne peut pas encore être publiée">
          Il lui manque des informations.{' '}
          <TextLink to={`/admin/quetes/${quest.id}/modifier`}>
            Ouvrir la quête pour la compléter
          </TextLink>
        </Notice>
      )}
      {[publish, duplicate, restore].map(
        (action, index) =>
          action.isError &&
          !(action === publish && incomplete) && (
            <Notice key={index} tone="error">
              {errorMessage(action.error)}
            </Notice>
          ),
      )}

      {(quest.instructions.trim() !== '' || quest.imageUrl) && (
        <Card className={styles.instructions}>
          <h2>Consigne</h2>
          {quest.instructions.trim() !== '' && <RichText text={quest.instructions} />}
          {quest.imageUrl && <QuestImage src={quest.imageUrl} />}
        </Card>
      )}

      {auto && quest.items.length > 0 && <Content quest={quest} />}

      <Progress quest={quest} onNotice={setNotice} />

      <AssignDialog
        quest={quest}
        open={openDialog === 'assign'}
        onClose={close}
        onDone={setNotice}
      />
      <ArchiveDialog
        quest={quest}
        open={openDialog === 'archive'}
        onClose={close}
        onDone={setNotice}
      />
      <DeleteDialog quest={quest} open={openDialog === 'delete'} onClose={close} />
    </>
  )
}

/** Contenu d'une quête corrigée automatiquement, réponses attendues comprises. */
function Content({ quest }: { quest: AdminQuestDetail }) {
  const isCards = quest.format === 'flashcards'
  return (
    <Card>
      <h2 className={styles.sectionTitle}>{isCards ? 'Cartes' : 'Questions'}</h2>
      <ol className={styles.items}>
        {quest.items.map((item, index) => (
          <li key={item.id}>
            <p className={styles.prompt}>
              {index + 1}. {item.prompt}
            </p>
            {quest.format === 'qcm' ? (
              <ul className={styles.choices}>
                {item.choices.map((choice, position) => (
                  <li key={position}>
                    {choice}
                    {item.correct.includes(position) && (
                      <span className={styles.right}> — bonne réponse</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.answer}>
                {isCards
                  ? 'Réponse'
                  : item.answers.length > 1
                    ? 'Réponses acceptées'
                    : 'Réponse attendue'}
                &nbsp;: <strong>{item.answers.join(' ou ')}</strong>
              </p>
            )}
          </li>
        ))}
      </ol>
    </Card>
  )
}

interface ProgressProps {
  quest: AdminQuestDetail
  onNotice: (notice: string) => void
}

/** Avancement de chaque élève, avec les gestes de rattrapage : rouvrir, redonner une tentative. */
function Progress({ quest, onNotice }: ProgressProps) {
  const action = useAssignmentAction(quest.id)
  const auto = isAutoCorrected(quest.format)
  const latePercent = useLatePercent()

  if (quest.state === 'draft') {
    const chosen = quest.draftAssignees
    return (
      <Card>
        <h2 className={styles.sectionTitle}>Élèves</h2>
        <p>
          {chosen === 'all'
            ? 'À sa publication, la quête sera donnée à tous les élèves.'
            : chosen.length === 0
              ? 'Aucun élève n’est encore choisi.'
              : `À sa publication, la quête sera donnée à ${chosen.length} élève${chosen.length > 1 ? 's' : ''}.`}
        </p>
      </Card>
    )
  }

  const details = (assignment: AdminAssignment): string[] => [
    ...(auto
      ? [`Tentatives\u00A0: ${assignment.attemptsUsed} sur ${assignment.attemptsAllowed}`]
      : []),
    ...(auto && assignment.bestScore !== null
      ? [`Meilleur score\u00A0: ${assignment.bestScore}\u00A0%`]
      : []),
    ...(assignment.xpAwarded !== null ? [`+${formatXp(assignment.xpAwarded)}`] : []),
  ]

  return (
    <Card>
      <h2 className={styles.sectionTitle}>Avancement</h2>
      {action.isError && <Notice tone="error">{errorMessage(action.error)}</Notice>}
      {quest.assignments.length === 0 ? (
        <p>Aucun élève n’a encore cette quête.</p>
      ) : (
        <ul className={styles.progress}>
          {quest.assignments.map((assignment) => (
            <li key={assignment.id} className={styles.assignment}>
              <Avatar avatar={assignment.student.avatar} size="small" decorative />
              <div className={styles.who}>
                <TextLink to={`/admin/eleves/${assignment.student.id}`}>
                  {assignment.student.pseudo}
                </TextLink>
                <span className={styles.details}>{details(assignment).join(' · ')}</span>
              </div>
              <StatusChip status={assignment.status} blocked={assignment.blocked} />
              {assignment.status === 'expired' && (
                <Button
                  className={styles.rescue}
                  onClick={() =>
                    action.mutate(
                      { assignmentId: assignment.id, action: 'reopen' },
                      {
                        onSuccess: () =>
                          onNotice(`Quête rouverte pour ${assignment.student.pseudo}.`),
                      },
                    )
                  }
                  disabled={action.isPending}
                  aria-label={`Rouvrir la quête pour ${assignment.student.pseudo}`}
                >
                  Rouvrir
                </Button>
              )}
              {assignment.blocked && assignment.status !== 'expired' && (
                <Button
                  className={styles.rescue}
                  onClick={() =>
                    action.mutate(
                      { assignmentId: assignment.id, action: 'attempts', body: { count: 1 } },
                      {
                        onSuccess: () =>
                          onNotice(`Une tentative redonnée à ${assignment.student.pseudo}.`),
                      },
                    )
                  }
                  disabled={action.isPending}
                  aria-label={`Redonner une tentative à ${assignment.student.pseudo}`}
                >
                  Redonner une tentative
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {latePercent !== null &&
        quest.assignments.some((assignment) => assignment.status === 'expired') && (
          <p className={styles.note}>
            Une quête rouverte après sa deadline rapporte {latePercent}&nbsp;% de sa récompense.
          </p>
        )}
    </Card>
  )
}

interface QuestDialogProps {
  quest: AdminQuestDetail
  open: boolean
  onClose: () => void
}

function AssignDialog({
  quest,
  open,
  onClose,
  onDone,
}: QuestDialogProps & { onDone: (notice: string) => void }) {
  const students = useStudents()
  const add = useAddAssignees(quest.id)
  const [choice, setChoice] = useState<{ all: boolean; chosen: string[] }>({
    all: false,
    chosen: [],
  })
  const already = new Set(quest.assignments.map((assignment) => assignment.student.id))
  const active = (students.data ?? []).filter((student) => student.isActive)
  const nothingToAdd = choice.all
    ? active.every((student) => already.has(student.id))
    : choice.chosen.length === 0

  const closeAndReset = () => {
    setChoice({ all: false, chosen: [] })
    add.reset()
    onClose()
  }

  const submit = () => {
    const assignees: Assignees = choice.all ? 'all' : choice.chosen
    add.mutate(assignees, {
      onSuccess: ({ quest: updated }) => {
        const added = updated.assignments.length - quest.assignments.length
        onDone(
          added > 1
            ? `${added} élèves ajoutés.`
            : added === 1
              ? 'Un élève ajouté.'
              : 'Aucun élève ajouté.',
        )
        closeAndReset()
      },
    })
  }

  return (
    <Dialog open={open} title="Ajouter des élèves" onClose={closeAndReset}>
      {students.isPending && <p>Chargement des élèves…</p>}
      {students.isError && <Notice tone="error">{errorMessage(students.error)}</Notice>}
      {students.isSuccess && (
        <AssigneePicker
          students={active}
          all={choice.all}
          chosen={choice.chosen}
          onChange={setChoice}
          alreadyAssigned={already}
        />
      )}
      {add.isError && <Notice tone="error">{errorMessage(add.error)}</Notice>}
      <DialogActions>
        <Button onClick={closeAndReset}>Annuler</Button>
        <Button
          variant="primary"
          onClick={submit}
          disabled={nothingToAdd}
          busy={add.isPending}
          busyLabel="Ajout…"
        >
          Ajouter
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function ArchiveDialog({
  quest,
  open,
  onClose,
  onDone,
}: QuestDialogProps & { onDone: (notice: string) => void }) {
  const archive = useQuestAction(quest.id, 'archive')
  const pending = quest.progress.submitted

  return (
    <Dialog open={open} title={'Archiver cette quête\u00A0?'} onClose={onClose}>
      <p>
        Elle disparaîtra des quêtes à faire de vos élèves. L’XP déjà gagnée est conservée, et vous
        pourrez la restaurer.
      </p>
      {pending > 0 && (
        <Notice tone="warning">
          {pending > 1
            ? `${pending} réalisations attendent votre validation\u00A0: elles quitteront la file tant que la quête est archivée.`
            : 'Une réalisation attend votre validation\u00A0: elle quittera la file tant que la quête est archivée.'}
        </Notice>
      )}
      {archive.isError && <Notice tone="error">{errorMessage(archive.error)}</Notice>}
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          variant="primary"
          onClick={() =>
            archive.mutate(undefined, {
              onSuccess: () => {
                onDone('Quête archivée.')
                onClose()
              },
            })
          }
          busy={archive.isPending}
          busyLabel="Archivage…"
        >
          Archiver
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function DeleteDialog({ quest, open, onClose }: QuestDialogProps) {
  const navigate = useNavigate()
  const remove = useDeleteDraft(quest.id)

  return (
    <Dialog open={open} title={'Supprimer ce brouillon\u00A0?'} onClose={onClose}>
      <p>Le brouillon «&nbsp;{quest.title}&nbsp;» sera effacé. Cette action est irréversible.</p>
      {remove.isError && <Notice tone="error">{errorMessage(remove.error)}</Notice>}
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          variant="danger"
          onClick={() =>
            remove.mutate(undefined, {
              onSuccess: () =>
                void navigate('/admin/quetes', { state: { notice: 'Brouillon supprimé.' } }),
            })
          }
          busy={remove.isPending}
          busyLabel="Suppression…"
        >
          Supprimer le brouillon
        </Button>
      </DialogActions>
    </Dialog>
  )
}
