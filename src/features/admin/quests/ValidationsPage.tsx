import { useState } from 'react'
import { COMMENT_MAX, type PendingValidation } from '../../../../shared/schemas/quests'
import { errorFields, errorMessage } from '../../../lib/api'
import { capitalize, formatRelative } from '../../../lib/dates'
import { Avatar } from '../../../ui/Avatar'
import { Button } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { Checkbox } from '../../../ui/Choice'
import { Chip } from '../../../ui/Chip'
import { Dialog, DialogActions } from '../../../ui/Dialog'
import { EmptyState } from '../../../ui/EmptyState'
import { TextArea } from '../../../ui/Field'
import { Notice } from '../../../ui/Notice'
import { TextLink } from '../../../ui/TextLink'
import { CategoryChip, formatXp } from '../../quests/QuestChips'
import { useLatePercent } from '../settings/settings-api'
import { useAssignmentAction, useValidations } from './quests-api'
import styles from './ValidationsPage.module.css'

/** File de validation : les réalisations soumises, de la plus ancienne à la plus récente. */
export function ValidationsPage() {
  const validations = useValidations()
  const action = useAssignmentAction()
  const [notice, setNotice] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<PendingValidation | null>(null)
  const pending = validations.data ?? []

  const validate = (entry: PendingValidation) =>
    action.mutate(
      { assignmentId: entry.assignmentId, action: 'validate' },
      {
        onSuccess: ({ assignment }) =>
          setNotice(
            `Réalisation de ${entry.student.pseudo} validée\u00A0: +${formatXp(assignment.xpAwarded ?? 0)}.`,
          ),
      },
    )

  return (
    <>
      <h1>Validations</h1>
      {notice && <Notice tone="success">{notice}</Notice>}
      {validations.isError && <Notice tone="error">{errorMessage(validations.error)}</Notice>}
      {action.isError && rejecting === null && (
        <Notice tone="error">{errorMessage(action.error)}</Notice>
      )}
      {validations.isPending && <p>Chargement des réalisations…</p>}

      {validations.isSuccess && pending.length === 0 && (
        <EmptyState emoji="✅" title="Aucune réalisation à valider">
          <p>Vous êtes à jour. Les réalisations soumises par vos élèves apparaîtront ici.</p>
        </EmptyState>
      )}

      {pending.length > 0 && (
        <>
          <p className={styles.count} role="status">
            {pending.length > 1
              ? `${pending.length} réalisations à valider, de la plus ancienne à la plus récente.`
              : 'Une réalisation à valider.'}
          </p>
          <ul className={styles.list}>
            {pending.map((entry) => (
              <Card as="li" key={entry.assignmentId} className={styles.entry}>
                <div className={styles.who}>
                  <Avatar avatar={entry.student.avatar} decorative />
                  <div>
                    <TextLink to={`/admin/eleves/${entry.student.id}`} className={styles.pseudo}>
                      {entry.student.pseudo}
                    </TextLink>
                    <p className={styles.when}>{capitalize(formatRelative(entry.submittedAt))}</p>
                  </div>
                </div>
                <div>
                  <TextLink to={`/admin/quetes/${entry.quest.id}`} className={styles.quest}>
                    {entry.quest.title}
                  </TextLink>
                  <div className={styles.tags}>
                    <CategoryChip category={entry.quest.category} />
                    <Chip>{formatXp(entry.quest.rewardXp)}</Chip>
                    {entry.late && <Chip tone="warning">Rendue après la deadline</Chip>}
                  </div>
                </div>
                <div className={styles.answer}>
                  <p className={styles.answerLabel}>
                    {entry.quest.format === 'declarative' ? 'Commentaire de l’élève' : 'Réponse'}
                  </p>
                  {entry.answer !== '' ? (
                    <p className={styles.answerText}>{entry.answer}</p>
                  ) : (
                    <p className={styles.when}>L’élève a déclaré avoir fini, sans commentaire.</p>
                  )}
                </div>
                <div className={styles.actions}>
                  <Button
                    onClick={() => validate(entry)}
                    disabled={action.isPending}
                    aria-label={`Valider la réalisation de ${entry.student.pseudo}`}
                  >
                    Valider
                  </Button>
                  <Button
                    variant="quiet"
                    onClick={() => {
                      action.reset()
                      setRejecting(entry)
                    }}
                    disabled={action.isPending}
                    aria-label={`Refuser la réalisation de ${entry.student.pseudo}`}
                  >
                    Refuser
                  </Button>
                </div>
              </Card>
            ))}
          </ul>
        </>
      )}

      {rejecting && (
        <RejectDialog
          key={rejecting.assignmentId}
          entry={rejecting}
          action={action}
          onClose={() => setRejecting(null)}
          onDone={() => {
            setNotice(
              `Réalisation de ${rejecting.student.pseudo} refusée\u00A0: l’élève peut recommencer.`,
            )
            setRejecting(null)
          }}
        />
      )}
    </>
  )
}

interface RejectDialogProps {
  entry: PendingValidation
  action: ReturnType<typeof useAssignmentAction>
  onClose: () => void
  onDone: () => void
}

/** Refus d'une réalisation : un commentaire dit à l'élève ce qu'il doit reprendre. */
function RejectDialog({ entry, action, onClose, onDone }: RejectDialogProps) {
  const [comment, setComment] = useState('')
  const [missing, setMissing] = useState(false)
  const [pastDeadline] = useState(
    () =>
      entry.quest.deadlineAt !== null && new Date(entry.quest.deadlineAt).getTime() < Date.now(),
  )
  const [reopen, setReopen] = useState(pastDeadline)
  const latePercent = useLatePercent()

  const submit = () => {
    if (comment.trim() === '') {
      setMissing(true)
      return
    }
    setMissing(false)
    action.mutate(
      { assignmentId: entry.assignmentId, action: 'reject', body: { comment, reopen } },
      { onSuccess: onDone },
    )
  }

  return (
    <Dialog open title={`Refuser la réalisation de ${entry.student.pseudo}`} onClose={onClose}>
      <TextArea
        label="Commentaire pour l’élève"
        hint={'Dites-lui ce qu’il doit reprendre\u00A0: il le lira avant de recommencer.'}
        rows={4}
        maxLength={COMMENT_MAX}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        error={
          missing
            ? 'Expliquez à l’élève ce qu’il doit reprendre.'
            : errorFields(action.error).comment
        }
      />
      {pastDeadline && (
        <Checkbox
          label="Rouvrir la quête pour cet élève"
          hint={`La deadline est passée\u00A0: sans réouverture, la quête sera expirée pour lui.${
            latePercent === null
              ? ''
              : ` Rouverte, elle rapporte ${latePercent}\u00A0% de sa récompense.`
          }`}
          checked={reopen}
          onChange={(event) => setReopen(event.target.checked)}
        />
      )}
      {action.isError && errorFields(action.error).comment === undefined && (
        <Notice tone="error">{errorMessage(action.error)}</Notice>
      )}
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="primary" onClick={submit} busy={action.isPending} busyLabel="Envoi…">
          Refuser et demander de recommencer
        </Button>
      </DialogActions>
    </Dialog>
  )
}
