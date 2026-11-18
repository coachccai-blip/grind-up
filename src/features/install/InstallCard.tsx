import { detectPlatform, INSTALL_STEPS, type InstallAudience } from '../../../shared/rules/install'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { useInstallPrompt } from './install-prompt'
import styles from './InstallCard.module.css'

/**
 * Installation sur l'écran d'accueil : un bouton quand le navigateur le permet,
 * sinon la marche à suivre pour cet appareil. Rien si le site est déjà installé.
 */
export function InstallCard({ audience }: { audience: InstallAudience }) {
  const { installed, canPrompt, install } = useInstallPrompt()
  if (installed) return null

  return (
    <Card className={styles.card}>
      <h2>Installer Grind up</h2>
      <p>
        {audience === 'student'
          ? 'Ajoute Grind up à ton écran d’accueil pour l’ouvrir comme une application.'
          : 'Ajoutez Grind up à votre écran d’accueil pour l’ouvrir comme une application.'}
      </p>
      {canPrompt ? (
        <Button onClick={() => void install()}>Installer l’application</Button>
      ) : (
        <p className={styles.steps}>
          {INSTALL_STEPS[audience][detectPlatform(navigator.userAgent, navigator.maxTouchPoints)]}
        </p>
      )}
    </Card>
  )
}
