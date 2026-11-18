import { useEffect, useState } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'

const SITE_NAME = 'Grind up'

/** Le nom de l'écran affiché : celui de son titre principal, ou celui qu'il déclare. */
function screenName(): string {
  const heading = document.querySelector<HTMLElement>('h1')
  return heading?.dataset.title ?? heading?.textContent?.trim() ?? ''
}

/**
 * Ce qui vaut pour toutes les pages :
 * - changer d'écran ramène en haut de la page, et le bouton « Retour » du
 *   navigateur retrouve l'endroit quitté ;
 * - le titre de l'onglet suit l'écran affiché (« Mes quêtes · Grind up ») ;
 * - le nouvel écran est annoncé aux lecteurs d'écran, qui ne voient pas la page changer.
 */
export function RootLayout() {
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    let current: string | null = null
    const update = () => {
      const name = screenName()
      if (name === '' || name === current) return
      // À l'arrivée sur le site, le navigateur lit déjà le titre : seuls les écrans suivants sont annoncés.
      if (current !== null) setAnnouncement(name)
      current = name
      document.title = `${name} · ${SITE_NAME}`
    }
    update()
    // Le titre principal arrive avec les données de l'écran : on le guette.
    const observer = new MutationObserver(update)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <ScrollRestoration />
      <Outlet />
      <p className="visually-hidden" role="status">
        {announcement}
      </p>
    </>
  )
}

/** Identifiant du contenu principal, cible du lien d'évitement. */
export const MAIN_CONTENT_ID = 'contenu'

/**
 * Lien d'évitement : premier élément atteint au clavier, il mène droit au contenu
 * sans repasser par la navigation. Il n'apparaît que lorsqu'il a le focus.
 */
export function SkipLink() {
  return (
    <a className="skip-link" href={`#${MAIN_CONTENT_ID}`}>
      Aller au contenu
    </a>
  )
}
