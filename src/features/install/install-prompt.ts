import { useSyncExternalStore } from 'react'

/**
 * Installation sur l'écran d'accueil. Chrome et Edge (Android, ordinateur)
 * signalent que le site peut être installé par l'événement « beforeinstallprompt » :
 * on le garde de côté pour proposer un bouton « Installer ». Safari n'a pas cet
 * événement : sur iPhone, l'installation passe par le bouton Partager.
 */
interface InstallPromptEvent extends Event {
  prompt(): Promise<unknown>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let pending: InstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

/** À appeler une fois, au démarrage : l'événement peut arriver avant l'écran qui s'en sert. */
export function watchInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Le navigateur n'affiche pas son propre bandeau : l'application propose son bouton.
    event.preventDefault()
    pending = event as InstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    pending = null
    installed = true
    notify()
  })
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Vrai quand le site est ouvert depuis l'écran d'accueil, comme une application. */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  )
}

export interface InstallState {
  /** Vrai si le site est déjà installé, ou vient de l'être. */
  installed: boolean
  /** Vrai si le navigateur permet de lancer l'installation depuis un bouton. */
  canPrompt: boolean
  /** Ouvre la fenêtre d'installation du navigateur. */
  install: () => Promise<void>
}

export function useInstallPrompt(): InstallState {
  const canPrompt = useSyncExternalStore(subscribe, () => pending !== null)
  const justInstalled = useSyncExternalStore(subscribe, () => installed)
  return {
    installed: justInstalled || isStandalone(),
    canPrompt,
    install: async () => {
      const event = pending
      if (!event) return
      await event.prompt()
      await event.userChoice
      // Une invitation ne sert qu'une fois ; le navigateur en enverra une autre si besoin.
      pending = null
      notify()
    },
  }
}
