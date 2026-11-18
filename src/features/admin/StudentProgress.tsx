import { useState } from 'react'
import { Link } from 'react-router'
import { isAutoCorrected } from '../../../shared/rules/quests'
import type { AdminStudent } from '../../../shared/schemas/admin'
import {
  XP_ADJUSTMENT_MAX,
  XP_REASON_MAX,
  xpAdjustmentRequestSchema,
  type StudentAssignment,
} from '../../../shared/schemas/progress'
import { COMMENT_MAX } from '../../../shared/schemas/quests'
import { errorFields, errorMessage } from '../../lib/api'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Dialog, DialogActions } from '../../ui/Dialog'
import { Field, TextArea } from '../../ui/Field'
import { Notice } from '../../ui/Notice'
import { OptionGroup } from '../../ui/OptionGroup'
import { BadgeList } from '../progress/BadgeList'
import { XpBar } from '../progress/XpBar'
import { XpJournal } from '../progress/XpJournal'
import { formatXp, StatusChip } from '../quests/QuestChips'
import { useAssignmentAction } from './quests/quests-api'
import styles from './StudentProgress.module.css'
import { useAdjustXp, useStudentProgress } from './students-api'

interface StudentProgressProps {
  student: AdminStudent
  onNotice: (notice: string) => void
}

const days = (count: number) => `${count}\u00A0jour${count > 1 ? 's' : ''}`

/**
 * Progression d'un élève sur sa fiche : niveau, XP, série, ses quêtes et leurs
 * statuts, ses badges, son journal d'XP, et l'ajustement manuel d'XP.
 */
export function StudentProgress({ student, onNotice }: StudentProgressProps) {
  const query = useStudentProgress(student.id)
  const action = useAssignmentAction()
  const [adjusting, setAdjusting] = useState(false)
  const [cancelling, setCancelling] = useState<StudentAssignment | null>(null)
  const progress = query.data

  if (query.isPending) return <p>Chargement de la progression…</p>
  if (!progress) return <Notice tone="error">{errorMessage(query.error)}</Notice>

  const details = (assignment: StudentAssignment): string =>
    [
      isAutoCorrected(assignment.quest.format) && assignment.attemptsUsed > 0
        ? `Tentatives\u00A0: ${assignment.attemptsUsed} sur ${assignment.attemptsAllowed}`
        : null,
      assignment.xpAwarded !== null ? `+${formatXp(assignment.xpAwarded)}` : null,
      assignment.quest.state === 'archived' ? 'Quête archivée' : null,
    ]
      .filter(Boolean)
      .join(' · ')

  return (
    <>
      <Card className={styles.section}>
        <h2>Progression</h2>
        <dl className={styles.facts}>
          <div>
            <dt>Niveau</dt>
            <dd>{progress.level.level}</dd>
          </div>
          <div>
            <dt>XP</dt>
            <dd>{formatXp(progress.xp)}</dd>
          </div>
          <div>
            <dt>Missions</dt>
            <dd>{progress.missions}</dd>
          </div>
          <div>
            <dt>Série</dt>
            <dd>
              {days(progress.streak.current)}
              {progress.streak.best > 0 && ` (record\u00A0: ${days(progress.streak.best)})`}
            </dd>
          </div>
        </dl>
        <XpBar level={progress.level} />
        <div>
          <Button onClick={() => setAdjusting(true)}>Ajuster l’XP</Button>
        </div>
      </Card>

      <Card className={styles.section}>
        <h2>Quêtes</h2>
        {action.isError && cancelling === null && (
          <Notice tone="error">{errorMessage(action.error)}</Notice>
        )}
        {progress.assignments.length === 0 ? (
          <p className={styles.note}>Cet élève n’a encore reçu aucune quête.</p>
        ) : (
          <ul className={styles.assignments}>
            {progress.assignments.map((assignment) => (
              <li key={assignment.assignmentId} className={styles.assignment}>
                <div className={styles.what}>
                  <Link to={`/admin/quetes/${assignment.quest.id}`}>{assignment.quest.title}</Link>
                  <span className={styles.note}>{details(assignment)}</span>
                </div>
                <StatusChip status={assignment.status} blocked={assignment.blocked} />
                {assignment.status === 'expired' && (
                  <Button
                    className={styles.rescue}
                    disabled={action.isPending}
                    onClick={() =>
                      action.mutate(
                        { assignmentId: assignment.assignmentId, action: 'reopen' },
                        {
                          onSuccess: () =>
                            onNotice(
                              `« ${assignment.quest.title} » est rouverte pour ${student.pseudo}.`,
                            ),
                        },
                      )
                    }
                    aria-label={`Rouvrir « ${assignment.quest.title} »`}
                  >
                    Rouvrir
                  </Button>
                )}
                {assignment.blocked && assignment.status !== 'expired' && (
                  <Button
                    className={styles.rescue}
                    disabled={action.isPending}
                    onClick={() =>
                      action.mutate(
                        {
                          assignmentId: assignment.assignmentId,
                          action: 'attempts',
                          body: { count: 1 },
                        },
                        {
                          onSuccess: () =>
                            onNotice(`Une tentative redonnée pour « ${assignment.quest.title} ».`),
                        },
                      )
                    }
                    aria-label={`Redonner une tentative pour « ${assignment.quest.title} »`}
                  >
                    Redonner une tentative
                  </Button>
                )}
                {assignment.status === 'validated' && (
                  <Button
                    variant="quiet"
                    className={styles.rescue}
                    onClick={() => {
                      action.reset()
                      setCancelling(assignment)
                    }}
                    aria-label={`Annuler la validation de « ${assignment.quest.title} »`}
                  >
                    Annuler la validation
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className={styles.section}>
        <h2>Badges</h2>
        <BadgeList badges={progress.badges} audience="they" />
      </Card>

      <Card className={styles.section}>
        <h2>Journal d’XP</h2>
        {progress.journal.length === 0 ? (
          <p className={styles.note}>Aucune ligne pour l’instant.</p>
        ) : (
          <XpJournal entries={progress.journal} />
        )}
      </Card>

      {adjusting && (
        <AdjustXpDialog
          student={student}
          onClose={() => setAdjusting(false)}
          onDone={(amount) => {
            onNotice(
              `${amount > 0 ? '+' : ''}${formatXp(amount)} pour ${student.pseudo}\u00A0: ajustement enregistré.`,
            )
            setAdjusting(false)
          }}
        />
      )}
      {cancelling && (
        <CancelValidationDialog
          key={cancelling.assignmentId}
          student={student}
          assignment={cancelling}
          action={action}
          onClose={() => setCancelling(null)}
          onDone={() => {
            onNotice(`Validation de « ${cancelling.quest.title} » annulée.`)
            setCancelling(null)
          }}
        />
      )}
    </>
  )
}

interface AdjustXpDialogProps {
  student: AdminStudent
  onClose: () => void
  onDone: (amount: number) => void
}

/** Ajustement manuel d'XP : ajouter ou retirer un montant, avec un motif obligatoire. */
function AdjustXpDialog({ student, onClose, onDone }: AdjustXpDialogProps) {
  const adjust = useAdjustXp(student.id)
  const [direction, setDirection] = useState<'add' | 'remove'>('add')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const errors = { ...errorFields(adjust.error), ...localErrors }

  const submit = () => {
    const value = amount.trim() === '' ? Number.NaN : Number(amount.trim())
    const signed = direction === 'add' ? value : -value
    const parsed = xpAdjustmentRequestSchema.safeParse({ amount: signed, reason })
    if (!parsed.success || value <= 0) {
      const problems: Record<string, string> = {}
      if (!Number.isInteger(value) || value <= 0 || value > XP_ADJUSTMENT_MAX) {
        problems.amount = `Indiquez un nombre entier, de 1 à ${XP_ADJUSTMENT_MAX}.`
      }
      for (const issue of parsed.success ? [] : parsed.error.issues) {
        const field = String(issue.path[0])
        if (field === 'reason') problems.reason ??= issue.message
      }
      setLocalErrors(problems)
      return
    }
    setLocalErrors({})
    adjust.mutate(parsed.data, { onSuccess: () => onDone(parsed.data.amount) })
  }

  return (
    <Dialog open title={`Ajuster l’XP de ${student.pseudo}`} onClose={onClose}>
      <OptionGroup
        legend="Sens de l’ajustement"
        value={direction}
        onChange={setDirection}
        options={[
          { value: 'add', label: 'Ajouter de l’XP' },
          { value: 'remove', label: 'Retirer de l’XP' },
        ]}
      />
      <Field
        label="Montant (en XP)"
        inputMode="numeric"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        error={errors.amount}
      />
      <Field
        label="Motif"
        hint="L’élève le verra dans son historique d’XP."
        maxLength={XP_REASON_MAX}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        error={errors.reason}
      />
      {adjust.isError && Object.keys(errorFields(adjust.error)).length === 0 && (
        <Notice tone="error">{errorMessage(adjust.error)}</Notice>
      )}
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          variant="primary"
          onClick={submit}
          busy={adjust.isPending}
          busyLabel="Enregistrement…"
        >
          Enregistrer l’ajustement
        </Button>
      </DialogActions>
    </Dialog>
  )
}

interface CancelValidationDialogProps {
  student: AdminStudent
  assignment: StudentAssignment
  action: ReturnType<typeof useAssignmentAction>
  onClose: () => void
  onDone: () => void
}

/** Annulation d'une validation : l'XP est retirée, la quête repasse à « Refusée ». */
function CancelValidationDialog({
  student,
  assignment,
  action,
  onClose,
  onDone,
}: CancelValidationDialogProps) {
  const [comment, setComment] = useState('')

  return (
    <Dialog open title={'Annuler cette validation\u00A0?'} onClose={onClose}>
      <p>
        {student.pseudo} perdra les {formatXp(assignment.xpAwarded ?? 0)} gagnés avec «&nbsp;
        {assignment.quest.title}&nbsp;». La quête repassera à «&nbsp;Refusée&nbsp;» et pourra être
        recommencée. Les deux lignes resteront au journal.
      </p>
      <TextArea
        label="Commentaire pour l’élève (facultatif)"
        rows={3}
        maxLength={COMMENT_MAX}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      {action.isError && <Notice tone="error">{errorMessage(action.error)}</Notice>}
      <DialogActions>
        <Button onClick={onClose}>Garder la validation</Button>
        <Button
          variant="danger"
          busy={action.isPending}
          busyLabel="Annulation…"
          onClick={() =>
            action.mutate(
              { assignmentId: assignment.assignmentId, action: 'cancel', body: { comment } },
              { onSuccess: onDone },
            )
          }
        >
          Annuler la validation
        </Button>
      </DialogActions>
    </Dialog>
  )
}
