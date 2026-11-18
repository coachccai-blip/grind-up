import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { AdminStudent } from '../../../shared/schemas/admin'
import { pseudoSchema } from '../../../shared/schemas/auth'
import { errorFields, errorMessage } from '../../lib/api'
import { capitalize, formatDate, formatRelative } from '../../lib/dates'
import { Avatar } from '../../ui/Avatar'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { CopyButton } from '../../ui/CopyButton'
import { Dialog, DialogActions } from '../../ui/Dialog'
import { Field } from '../../ui/Field'
import { Identifier } from '../../ui/Identifier'
import { Notice } from '../../ui/Notice'
import { TextLink } from '../../ui/TextLink'
import { StatusChip } from './StatusChip'
import { StudentProgress } from './StudentProgress'
import styles from './StudentPage.module.css'
import {
  useDeleteStudent,
  useStudents,
  useTemporaryPassword,
  useUpdateStudent,
} from './students-api'

type OpenDialog = 'rename' | 'password' | 'deactivate' | 'delete' | null

/** Fiche d'un élève : son compte et les actions de l'admin sur ce compte. */
export function StudentPage() {
  const { id = '' } = useParams()
  const students = useStudents()
  const student = students.data?.find((candidate) => candidate.id === id)

  return (
    <>
      <p>
        <TextLink to="/admin/eleves">Retour aux élèves</TextLink>
      </p>
      {students.isPending && <p>Chargement de la fiche…</p>}
      {students.isError && <Notice tone="error">{errorMessage(students.error)}</Notice>}
      {students.isSuccess && !student && (
        <Notice tone="warning">
          Cet élève est introuvable. Son compte a peut-être été supprimé.
        </Notice>
      )}
      {student && <StudentFile key={student.id} student={student} />}
    </>
  )
}

function StudentFile({ student }: { student: AdminStudent }) {
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const update = useUpdateStudent(student.id)
  const close = () => setOpenDialog(null)

  const reactivate = () =>
    update.mutate(
      { isActive: true },
      { onSuccess: () => setNotice(`Le compte de ${student.pseudo} est réactivé.`) },
    )

  return (
    <>
      <Card className={styles.header}>
        <Avatar avatar={student.avatar} size="large" decorative />
        <div className={styles.identity}>
          <h1>{student.pseudo}</h1>
          <p className={styles.identifierLine}>
            <span className={styles.caption}>Identifiant</span>
            <Identifier value={student.publicId} />
          </p>
          <StatusChip active={student.isActive} />
        </div>
        <CopyButton text={student.publicId} label="Copier l’identifiant" />
      </Card>

      {notice && <Notice tone="success">{notice}</Notice>}
      {update.isError && openDialog === null && (
        <Notice tone="error">{errorMessage(update.error)}</Notice>
      )}

      <Card>
        <h2 className={styles.sectionTitle}>Compte</h2>
        <dl className={styles.facts}>
          <div>
            <dt>Inscription</dt>
            <dd>{formatDate(student.createdAt)}</dd>
          </div>
          <div>
            <dt>Dernière activité</dt>
            <dd>
              {student.lastActiveAt ? capitalize(formatRelative(student.lastActiveAt)) : 'Aucune'}
            </dd>
          </div>
        </dl>
      </Card>

      <StudentProgress student={student} onNotice={setNotice} />

      <Card>
        <h2 className={styles.sectionTitle}>Actions</h2>
        <div className={styles.actions}>
          <Button onClick={() => setOpenDialog('rename')}>Renommer</Button>
          <Button onClick={() => setOpenDialog('password')}>Mot de passe temporaire</Button>
          {student.isActive ? (
            <Button onClick={() => setOpenDialog('deactivate')}>Désactiver le compte</Button>
          ) : (
            <Button onClick={reactivate} busy={update.isPending} busyLabel="Réactivation…">
              Réactiver le compte
            </Button>
          )}
          <Button variant="danger" onClick={() => setOpenDialog('delete')}>
            Supprimer le compte
          </Button>
        </div>
      </Card>

      <RenameDialog
        student={student}
        open={openDialog === 'rename'}
        onClose={close}
        onDone={(pseudo) => setNotice(`L’élève s’appelle maintenant ${pseudo}.`)}
      />
      <TemporaryPasswordDialog student={student} open={openDialog === 'password'} onClose={close} />
      <DeactivateDialog
        student={student}
        open={openDialog === 'deactivate'}
        onClose={close}
        onDone={() => setNotice(`Le compte de ${student.pseudo} est désactivé.`)}
      />
      <DeleteDialog student={student} open={openDialog === 'delete'} onClose={close} />
    </>
  )
}

interface StudentDialogProps {
  student: AdminStudent
  open: boolean
  onClose: () => void
}

function RenameDialog({
  student,
  open,
  onClose,
  onDone,
}: StudentDialogProps & { onDone: (pseudo: string) => void }) {
  const update = useUpdateStudent(student.id)
  const [pseudo, setPseudo] = useState(student.pseudo)
  const [localError, setLocalError] = useState<string | null>(null)
  const error = localError ?? errorFields(update.error).pseudo ?? null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const parsed = pseudoSchema.safeParse(pseudo)
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? null)
      return
    }
    setLocalError(null)
    update.mutate(
      { pseudo: parsed.data },
      {
        onSuccess: ({ student: renamed }) => {
          onDone(renamed.pseudo)
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open={open} title={`Renommer ${student.pseudo}`} onClose={onClose}>
      <form className={styles.dialogForm} onSubmit={submit} noValidate>
        {update.isError && !error && <Notice tone="error">{errorMessage(update.error)}</Notice>}
        <Field
          label="Nouveau pseudo"
          name="pseudo"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={20}
          value={pseudo}
          onChange={(event) => setPseudo(event.target.value)}
          hint="L’identifiant de l’élève ne change pas."
          error={error}
        />
        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            type="submit"
            variant="primary"
            busy={update.isPending}
            busyLabel="Enregistrement…"
          >
            Enregistrer
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

function TemporaryPasswordDialog({ student, open, onClose }: StudentDialogProps) {
  const generate = useTemporaryPassword(student.id)
  const temporaryPassword = generate.data?.temporaryPassword

  const closeAndForget = () => {
    // Le mot de passe temporaire n'est affiché qu'une fois.
    generate.reset()
    onClose()
  }

  return (
    <Dialog open={open} title="Mot de passe temporaire" onClose={closeAndForget}>
      {temporaryPassword ? (
        <>
          <p>
            Transmettez ce mot de passe à {student.pseudo}. Il ne sera plus affiché, et{' '}
            {student.pseudo} devra en choisir un nouveau à sa prochaine connexion.
          </p>
          <p className={styles.secret}>
            <Identifier value={temporaryPassword} />
          </p>
          <DialogActions>
            <CopyButton text={temporaryPassword} label="Copier le mot de passe" />
            <Button variant="primary" onClick={closeAndForget}>
              Terminé
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <p>
            Le mot de passe actuel de {student.pseudo} ne fonctionnera plus, et ses appareils seront
            déconnectés.
          </p>
          {generate.isError && <Notice tone="error">{errorMessage(generate.error)}</Notice>}
          <DialogActions>
            <Button onClick={closeAndForget}>Annuler</Button>
            <Button
              variant="primary"
              onClick={() => generate.mutate()}
              busy={generate.isPending}
              busyLabel="Génération…"
            >
              Générer le mot de passe
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  )
}

function DeactivateDialog({
  student,
  open,
  onClose,
  onDone,
}: StudentDialogProps & { onDone: () => void }) {
  const update = useUpdateStudent(student.id)

  return (
    <Dialog
      open={open}
      title={`Désactiver le compte de ${student.pseudo}\u00A0?`}
      onClose={onClose}
    >
      <p>
        {student.pseudo} ne pourra plus se connecter et n’apparaîtra plus dans le leaderboard. Ses
        données sont conservées et reviendront à la réactivation.
      </p>
      {update.isError && <Notice tone="error">{errorMessage(update.error)}</Notice>}
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button
          variant="primary"
          busy={update.isPending}
          busyLabel="Désactivation…"
          onClick={() =>
            update.mutate(
              { isActive: false },
              {
                onSuccess: () => {
                  onDone()
                  onClose()
                },
              },
            )
          }
        >
          Désactiver le compte
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function DeleteDialog({ student, open, onClose }: StudentDialogProps) {
  const navigate = useNavigate()
  const remove = useDeleteStudent(student.id)
  const [understood, setUnderstood] = useState(false)

  const closeAndReset = () => {
    setUnderstood(false)
    onClose()
  }

  return (
    <Dialog
      open={open}
      title={`Supprimer le compte de ${student.pseudo}\u00A0?`}
      onClose={closeAndReset}
    >
      <p>Son compte et toutes ses données seront effacés. Cette action est irréversible.</p>
      <label className={styles.confirmation}>
        <input
          type="checkbox"
          checked={understood}
          onChange={(event) => setUnderstood(event.target.checked)}
        />
        <span>Je comprends que cette suppression est définitive.</span>
      </label>
      {remove.isError && <Notice tone="error">{errorMessage(remove.error)}</Notice>}
      <DialogActions>
        <Button onClick={closeAndReset}>Annuler</Button>
        <Button
          variant="danger"
          disabled={!understood}
          busy={remove.isPending}
          busyLabel="Suppression…"
          onClick={() =>
            remove.mutate(undefined, {
              onSuccess: () =>
                navigate('/admin/eleves', {
                  replace: true,
                  state: { notice: `Le compte de ${student.pseudo} a été supprimé.` },
                }),
            })
          }
        >
          Supprimer définitivement
        </Button>
      </DialogActions>
    </Dialog>
  )
}
