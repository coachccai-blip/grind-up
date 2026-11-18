import { useEffect, useState } from 'react'
import { Button, type ButtonVariant } from './Button'

interface CopyButtonProps {
  /** Texte à copier. */
  text: string
  label?: string
  variant?: ButtonVariant
}

/** Bouton « Copier » : confirme par son libellé, lu aussi par les lecteurs d'écran. */
export function CopyButton({ text, label = 'Copier', variant = 'secondary' }: CopyButtonProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const timer = window.setTimeout(() => setState('idle'), 2500)
    return () => window.clearTimeout(timer)
  }, [state])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
    } catch {
      setState('failed')
    }
  }

  return (
    <Button variant={variant} onClick={() => void copy()}>
      <span aria-live="polite">
        {state === 'copied' ? 'Copié' : state === 'failed' ? 'Copie impossible' : label}
      </span>
    </Button>
  )
}
