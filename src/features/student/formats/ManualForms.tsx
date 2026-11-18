import { useState, type FormEvent } from 'react'
import { COMMENT_MAX, FREE_TEXT_MAX } from '../../../../shared/schemas/quests'
import { Button } from '../../../ui/Button'
import { TextArea } from '../../../ui/Field'
import styles from './formats.module.css'
import type { FormatProps } from './types'

/** Déclaratif : l'élève dit « C'est fait » et peut ajouter un commentaire. */
export function DeclarativeForm({ quest, busy, onSubmit }: FormatProps) {
  const [comment, setComment] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit({ comment })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <TextArea
        label={'Un commentaire\u00A0? (facultatif)'}
        hint="Durée, distance, ressenti…"
        rows={3}
        maxLength={COMMENT_MAX}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      <Button type="submit" variant="primary" fullWidth busy={busy} busyLabel="Envoi…">
        C’est fait
      </Button>
      {quest.manualValidation && (
        <p className={styles.hint}>Ton accompagnant validera ensuite ta quête.</p>
      )}
    </form>
  )
}

/** Réponse libre : un texte, que l'admin lit et valide. */
export function FreeTextForm({
  quest,
  busy,
  onSubmit,
  error,
}: FormatProps & { error?: string | null }) {
  // Après un refus, l'élève repart de son texte précédent.
  const [text, setText] = useState(quest.lastAttempt?.text ?? '')
  const [empty, setEmpty] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const missing = text.trim() === ''
    setEmpty(missing)
    if (!missing) onSubmit({ text })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <TextArea
        label="Ta réponse"
        rows={8}
        maxLength={FREE_TEXT_MAX}
        value={text}
        onChange={(event) => setText(event.target.value)}
        error={empty ? 'Écris ta réponse avant de l’envoyer.' : error}
      />
      <Button type="submit" variant="primary" fullWidth busy={busy} busyLabel="Envoi…">
        Envoyer ma réponse
      </Button>
      <p className={styles.hint}>Ton accompagnant lira ta réponse avant de valider ta quête.</p>
    </form>
  )
}
