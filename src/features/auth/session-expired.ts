/**
 * Quand le serveur ne reconnaît plus la session en cours d'utilisation, on le
 * note ici pour l'expliquer sur l'écran de connexion vers lequel l'utilisateur
 * est renvoyé.
 */
const KEY = 'grind-up:session-expired'

export function markSessionExpired(): void {
  try {
    window.sessionStorage.setItem(KEY, '1')
  } catch {
    // Stockage indisponible (navigation privée stricte) : on se passe du message.
  }
}

/** Indique si la session vient d'expirer, et efface l'indication. */
export function takeSessionExpiredFlag(): boolean {
  try {
    const expired = window.sessionStorage.getItem(KEY) === '1'
    window.sessionStorage.removeItem(KEY)
    return expired
  } catch {
    return false
  }
}
