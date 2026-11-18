import { Link } from 'react-router'
import {
  EXPIRING_WINDOW_HOURS,
  INACTIVITY_DAYS,
  type AdminOverview,
} from '../../../shared/schemas/admin'
import { errorMessage } from '../../lib/api'
import { formatRelative } from '../../lib/dates'
import { Avatar } from '../../ui/Avatar'
import { Card } from '../../ui/Card'
import { classes } from '../../ui/classes'
import { CopyButton } from '../../ui/CopyButton'
import { Countdown } from '../../ui/Countdown'
import { Emoji } from '../../ui/Emoji'
import { Notice } from '../../ui/Notice'
import styles from './AdminPages.module.css'
import { useOverview } from './overview-api'

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

interface FigureProps {
  to: string
  emoji: string
  label: string
  value: number
  /** Vrai quand ce chiffre appelle une action de l'admin. */
  attention?: boolean
}

/** Un chiffre de la vue d'ensemble : toute la tuile mène à l'écran concerné. */
function Figure({ to, emoji, label, value, attention = false }: FigureProps) {
  return (
    <li>
      <Link to={to} className={classes(styles.figure, attention && styles.attention)}>
        <span className={styles.figureLabel}>
          <Emoji symbol={emoji} />
          <span>{label}</span>
        </span>
        <span className={styles.figureValue}>{value}</span>
      </Link>
    </li>
  )
}

function expiringTitle(count: number): string {
  if (count === 0) return `Aucune quête n’expire dans les ${EXPIRING_WINDOW_HOURS}\u00A0h`
  return count > 1
    ? `${count} quêtes expirent dans les ${EXPIRING_WINDOW_HOURS}\u00A0h`
    : `1 quête expire dans les ${EXPIRING_WINDOW_HOURS}\u00A0h`
}

function inactiveTitle(count: number): string {
  if (count === 0) return `Aucun élève inactif depuis ${INACTIVITY_DAYS} jours`
  return count > 1
    ? `${count} élèves inactifs depuis ${INACTIVITY_DAYS} jours`
    : `1 élève inactif depuis ${INACTIVITY_DAYS} jours`
}

function ExpiringSoon({ quests }: { quests: AdminOverview['expiringSoon'] }) {
  return (
    <Card className={styles.block}>
      <h2>{expiringTitle(quests.length)}</h2>
      {quests.length === 0 ? (
        <p className={styles.note}>Les deadlines proches s’afficheront ici.</p>
      ) : (
        <ul className={styles.rows}>
          {quests.map((quest) => (
            <li key={quest.id}>
              <Link to={`/admin/quetes/${quest.id}`} className={styles.row}>
                <span className={styles.rowTitle}>{quest.title}</span>
                <span className={styles.rowMeta}>
                  <Countdown deadlineAt={quest.deadlineAt} />
                  <span>
                    {quest.remaining > 1
                      ? `${quest.remaining} élèves ne l’ont pas terminée`
                      : '1 élève ne l’a pas terminée'}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function InactiveStudents({ overview }: { overview: AdminOverview }) {
  const students = overview.inactiveStudents
  return (
    <Card className={styles.block}>
      <h2>{inactiveTitle(students.length)}</h2>
      {students.length === 0 ? (
        <p className={styles.note}>
          {overview.activeStudents === 0
            ? 'Vos élèves apparaîtront ici s’ils restent une semaine sans venir.'
            : `Tous vos élèves sont venus ces ${INACTIVITY_DAYS} derniers jours.`}
        </p>
      ) : (
        <ul className={styles.rows}>
          {students.map((student) => (
            <li key={student.id}>
              <Link to={`/admin/eleves/${student.id}`} className={styles.row}>
                <span className={styles.who}>
                  <Avatar avatar={student.avatar} size="small" decorative />
                  <span className={styles.rowTitle}>{student.pseudo}</span>
                </span>
                <span className={styles.rowMeta}>
                  {student.lastActiveAt
                    ? `Dernière activité\u00A0: ${formatRelative(student.lastActiveAt)}`
                    : 'Aucune activité'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/**
 * Vue d'ensemble : élèves actifs, quêtes en cours, réalisations à valider,
 * quêtes qui expirent dans les 48 h, élèves inactifs depuis 7 jours.
 */
export function OverviewPage() {
  const overview = useOverview()
  const data = overview.data

  return (
    <>
      <h1>Vue d’ensemble</h1>
      {overview.isError && <Notice tone="error">{errorMessage(overview.error)}</Notice>}
      {overview.isPending && <p>Chargement de la vue d’ensemble…</p>}
      {data && (
        <>
          {/* Personne ne s'est encore inscrit : l'invitation passe en premier. */}
          {data.totalStudents === 0 && <InviteCard />}
          <ul className={styles.figures}>
            <Figure
              to="/admin/eleves"
              emoji="🎒"
              label={data.activeStudents > 1 ? 'Élèves actifs' : 'Élève actif'}
              value={data.activeStudents}
            />
            <Figure
              to="/admin/quetes"
              emoji="🎯"
              label={data.questsInProgress > 1 ? 'Quêtes en cours' : 'Quête en cours'}
              value={data.questsInProgress}
            />
            <Figure
              to="/admin/validations"
              emoji="✅"
              label={
                data.pendingValidations > 1 ? 'Réalisations à valider' : 'Réalisation à valider'
              }
              value={data.pendingValidations}
              attention={data.pendingValidations > 0}
            />
          </ul>
          <ExpiringSoon quests={data.expiringSoon} />
          <InactiveStudents overview={data} />
          {data.totalStudents > 0 && <InviteCard />}
        </>
      )}
    </>
  )
}
