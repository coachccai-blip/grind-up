import { useEffect, useState } from 'react'
import { findBadge } from '../../../shared/rules/badges'
import type { Celebration } from '../../../shared/schemas/progress'
import { errorMessage } from '../../lib/api'
import { Button } from '../../ui/Button'
import { Dialog, DialogActions } from '../../ui/Dialog'
import { Emoji } from '../../ui/Emoji'
import { Notice } from '../../ui/Notice'
import { formatXp } from '../quests/QuestChips'
import styles from './CelebrationDialog.module.css'
import { useMarkCelebrated, useProgress } from './progress-api'

/** Durée du décompte de l'XP gagnée : moins d'une seconde, comme toutes les animations. */
const COUNT_UP_MS = 700

/** Fait monter un nombre de zéro à sa valeur. Sans animation si l'appareil demande de les réduire. */
function useCountUp(target: number): number {
  const [shown, setShown] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? target : 0,
  )
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const startedAt = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      const progress = Math.min(1, (now - startedAt) / COUNT_UP_MS)
      // Ralentit en arrivant sur la valeur.
      setShown(Math.round(target * (1 - (1 - progress) ** 3)))
      if (progress < 1) frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [target])
  return shown
}

function titleOf(celebration: Celebration): string {
  const count = celebration.validations.length
  if (count === 0) return celebration.badges.length > 1 ? 'Nouveaux badges' : 'Nouveau badge'
  return count > 1 ? `${count} quêtes validées` : 'Quête validée'
}

/**
 * Annonce de ce que l'élève n'a pas encore vu : quêtes validées, XP gagnée,
 * passage de niveau, nouveaux badges. Elle s'affiche où qu'il soit dans son
 * espace, y compris quand l'admin a validé une quête en son absence.
 */
export function CelebrationDialog() {
  const progress = useProgress()
  const celebration = progress.data?.celebration ?? null
  if (!celebration) return null
  // Une nouvelle annonce repart d'un décompte neuf.
  return <Announcement key={JSON.stringify(celebration)} celebration={celebration} />
}

function Announcement({ celebration }: { celebration: Celebration }) {
  const seen = useMarkCelebrated()
  const gained = useCountUp(celebration.xpGained)
  const acknowledge = () => seen.mutate()

  return (
    <Dialog open title={titleOf(celebration)} onClose={acknowledge}>
      <div className={styles.celebration}>
        {celebration.validations.length > 0 && (
          <>
            <p className={styles.gain} aria-label={`+${formatXp(celebration.xpGained)}`}>
              <span aria-hidden="true">+{formatXp(gained)}</span>
            </p>
            <ul className={styles.quests}>
              {celebration.validations.map((validation) => (
                <li key={validation.questId}>
                  <span>{validation.title}</span>
                  {celebration.validations.length > 1 && (
                    <span className={styles.questXp}>+{formatXp(validation.xp)}</span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
        {celebration.levelUp && (
          <p className={styles.levelUp}>
            <Emoji symbol="🎉" className={styles.emoji} />
            <span>
              <strong>Niveau {celebration.levelUp.to}&nbsp;!</strong>
              <span className={styles.detail}>
                Tu passes du niveau {celebration.levelUp.from} au niveau {celebration.levelUp.to}.
              </span>
            </span>
          </p>
        )}
        {celebration.badges.map((code) => {
          const badge = findBadge(code)
          return (
            badge && (
              <p key={code} className={styles.badge}>
                <Emoji symbol={badge.emoji} className={styles.emoji} />
                <span>
                  <strong>Nouveau badge&nbsp;: {badge.label}</strong>
                  <span className={styles.detail}>Retrouve-le dans ton profil.</span>
                </span>
              </p>
            )
          )
        })}
      </div>
      {seen.isError && <Notice tone="error">{errorMessage(seen.error)}</Notice>}
      <DialogActions>
        <Button variant="primary" onClick={acknowledge} busy={seen.isPending} busyLabel="…">
          Continuer
        </Button>
      </DialogActions>
    </Dialog>
  )
}
