/**
 * Après son inscription, un élève doit voir son identifiant et confirmer qu'il
 * l'a noté. Tant que ce n'est pas fait, on le garde en mémoire pour l'onglet en
 * cours : toute autre page de son espace le ramène à l'écran de bienvenue.
 */
const KEY = 'grind-up:welcome-pending'

let fallback = false

export function markWelcomePending(): void {
  fallback = true
  try {
    window.sessionStorage.setItem(KEY, '1')
  } catch {
    // Stockage indisponible : on se contente de la mémoire de la page.
  }
}

export function isWelcomePending(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === '1'
  } catch {
    return fallback
  }
}

export function clearWelcomePending(): void {
  fallback = false
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {
    // Rien à effacer.
  }
}
