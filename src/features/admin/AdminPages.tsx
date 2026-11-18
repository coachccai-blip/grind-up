import { Link } from 'react-router'
import { errorMessage } from '../../lib/api'
import { Card } from '../../ui/Card'
import { CopyButton } from '../../ui/CopyButton'
import { EmptyState } from '../../ui/EmptyState'
import { Notice } from '../../ui/Notice'
import styles from './AdminPages.module.css'
import { useStudents } from './students-api'

/** Adresse de la page d'inscription, à transmettre aux élèves. */
function signupAddress(): string {
  return `${window.location.origin}/inscription`
}

/** Carte « Inviter vos élèves » : l'adresse d'inscription et son bouton de copie. */
export function InviteCard() {
  return (
    <Card className={styles.invite}>
      <h2>Inviter vos élèves</h2>
      <p>
        Transmettez-leur cette adresse&nbsp;: chacun y crée son compte et reçoit son identifiant.
      </p>
      <p className={styles.address}>{signupAddress()}</p>
      <CopyButton text={signupAddress()} label="Copier l’adresse" />
    </Card>
  )
}

export function OverviewPage() {
  const students = useStudents()
  const active = students.data?.filter((student) => student.isActive).length

  return (
    <>
      <h1>Vue d’ensemble</h1>
      {students.isError && <Notice tone="error">{errorMessage(students.error)}</Notice>}
      <Card className={styles.figure}>
        <p className={styles.figureLabel}>Élèves actifs</p>
        <p className={styles.figureValue}>{active ?? '…'}</p>
        <Link to="/admin/eleves">Voir les élèves</Link>
      </Card>
      <InviteCard />
    </>
  )
}

/** Écrans de l'admin qui arrivent aux étapes suivantes. */
function ComingSoon({
  title,
  emoji,
  children,
}: {
  title: string
  emoji: string
  children: string
}) {
  return (
    <>
      <h1>{title}</h1>
      <EmptyState emoji={emoji} title="Bientôt disponible">
        <p>{children}</p>
      </EmptyState>
    </>
  )
}

export const BotsPage = () => (
  <ComingSoon title="Bots" emoji="🤖">
    Vous créerez ici des bots pour donner du rythme au classement.
  </ComingSoon>
)

export const SettingsPage = () => (
  <ComingSoon title="Paramètres" emoji="⚙️">
    Vous réglerez ici le barème d’XP, les bonus et l’export des données.
  </ComingSoon>
)
