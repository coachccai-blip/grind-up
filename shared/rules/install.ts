/**
 * Installation sur l'écran d'accueil (section 11 du brief). Chrome et Edge
 * proposent un bouton ; ailleurs, l'utilisateur passe par le menu de son
 * navigateur, et la marche à suivre dépend de son appareil.
 */
export type InstallPlatform = 'ios' | 'android' | 'desktop'

/** L'appareil, d'après ce que le navigateur dit de lui-même. */
export function detectPlatform(userAgent: string, touchPoints: number): InstallPlatform {
  // Un iPad récent se présente comme un Mac : son écran tactile le distingue.
  if (/iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1)) {
    return 'ios'
  }
  return /Android/.test(userAgent) ? 'android' : 'desktop'
}

/** L'élève est tutoyé, l'admin vouvoyé. */
export type InstallAudience = 'student' | 'admin'

/** Marche à suivre quand le navigateur ne propose pas de bouton d'installation. */
export const INSTALL_STEPS: Record<InstallAudience, Record<InstallPlatform, string>> = {
  student: {
    ios: 'Touche le bouton Partager de ton navigateur, puis « Sur l’écran d’accueil ».',
    android:
      'Ouvre le menu de ton navigateur, puis choisis « Ajouter à l’écran d’accueil » ou « Installer l’application ».',
    desktop:
      'Dans Chrome ou Edge, clique sur l’icône d’installation, à droite de la barre d’adresse.',
  },
  admin: {
    ios: 'Touchez le bouton Partager de votre navigateur, puis « Sur l’écran d’accueil ».',
    android:
      'Ouvrez le menu de votre navigateur, puis choisissez « Ajouter à l’écran d’accueil » ou « Installer l’application ».',
    desktop:
      'Dans Chrome ou Edge, cliquez sur l’icône d’installation, à droite de la barre d’adresse.',
  },
}
