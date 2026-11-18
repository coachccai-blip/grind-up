import { useId, useState, type ChangeEvent } from 'react'
import { ImageError, prepareImage } from '../../../lib/images'
import { Button } from '../../../ui/Button'
import { QuestImage } from '../../quests/QuestImage'
import styles from './ImagePicker.module.css'
import type { ImageChange } from './quests-api'

interface ImagePickerProps {
  /** Adresse de l'image déjà enregistrée, ou null. */
  current: string | null
  change: ImageChange
  onChange: (change: ImageChange) => void
}

/**
 * Image facultative de la consigne. L'image choisie est réduite dans le
 * navigateur, puis envoyée avec la quête à son enregistrement.
 */
export function ImagePicker({ current, change, onChange }: ImagePickerProps) {
  const inputId = useId()
  const [error, setError] = useState<string | null>(null)
  const [preparing, setPreparing] = useState(false)
  const shown = change.kind === 'replace' ? change.dataUrl : change.kind === 'keep' ? current : null

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Le même fichier doit pouvoir être choisi à nouveau après un retrait.
    event.target.value = ''
    if (!file) return
    setError(null)
    setPreparing(true)
    try {
      onChange({ kind: 'replace', dataUrl: await prepareImage(file) })
    } catch (failure) {
      setError(
        failure instanceof ImageError ? failure.message : 'Cette image n’a pas pu être préparée.',
      )
    } finally {
      setPreparing(false)
    }
  }

  return (
    <div className={styles.picker}>
      <p className={styles.label}>Image de la consigne (facultative)</p>
      {shown && <QuestImage src={shown} />}
      <div className={styles.actions}>
        <label htmlFor={inputId} className={styles.choose}>
          {preparing ? 'Préparation…' : shown ? 'Changer l’image' : 'Choisir une image'}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={(event) => void choose(event)}
        />
        {shown && (
          <Button
            variant="quiet"
            onClick={() => onChange(current ? { kind: 'remove' } : { kind: 'keep' })}
          >
            Retirer l’image
          </Button>
        )}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}
