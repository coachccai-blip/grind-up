import { RichText } from '../../../ui/RichText'
import styles from './formats.module.css'

interface DetailedCorrectionProps {
  /** Correction rédigée par l'accompagnant ; absente tant que la quête n'est pas validée. */
  text: string | undefined
  /** Vrai si la dernière réponse de l'élève était fausse : la correction s'ouvre d'elle-même. */
  wrong: boolean
}

/**
 * Correction détaillée d'une question, sous sa bonne réponse. Elle se déplie à
 * la demande ; celle d'une réponse à revoir est déjà ouverte.
 */
export function DetailedCorrection({ text, wrong }: DetailedCorrectionProps) {
  if (!text) return null
  return (
    <details className={styles.explanation} open={wrong}>
      <summary>Correction détaillée</summary>
      <RichText text={text} className={styles.explanationText} />
    </details>
  )
}
