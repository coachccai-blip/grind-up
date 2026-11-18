import type { StudentQuestDetail } from '../../../../shared/schemas/quests'
import type { AttemptBody } from '../quests-api'

/** Ce que reçoit l'interface de chaque format de quête. */
export interface FormatProps {
  quest: StudentQuestDetail
  /** Envoi en cours : le bouton patiente. */
  busy: boolean
  onSubmit: (body: AttemptBody) => void
  /** Quête terminée ou bloquée : les réponses se relisent, sans pouvoir être changées. */
  readOnly?: boolean
}
