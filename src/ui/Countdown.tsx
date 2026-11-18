import { useEffect, useState } from 'react'
import { countdown, type CountdownTone } from '../../shared/rules/countdown'
import { Chip, type ChipTone } from './Chip'

const TONES: Record<CountdownTone, ChipTone> = {
  calm: 'neutral',
  soon: 'warning',
  urgent: 'urgent',
  over: 'neutral',
}

/** Délai maximal d'un minuteur du navigateur. */
const MAX_TIMER_MS = 2 ** 31 - 1

/**
 * Compte à rebours jusqu'à la deadline : orange à moins de 24 h, rose à moins de
 * 3 h, et la formule change avec l'urgence. Il se met à jour tout seul.
 */
export function Countdown({ deadlineAt }: { deadlineAt: string }) {
  const [now, setNow] = useState(() => new Date())
  const state = countdown(deadlineAt, now)

  useEffect(() => {
    const timer = window.setTimeout(
      () => setNow(new Date()),
      Math.min(state.refreshInMs, MAX_TIMER_MS),
    )
    return () => window.clearTimeout(timer)
  }, [state.refreshInMs, now])

  return <Chip tone={TONES[state.tone]}>{state.text}</Chip>
}
