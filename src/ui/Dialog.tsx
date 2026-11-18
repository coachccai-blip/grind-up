import { useEffect, useId, useRef, type ReactNode } from 'react'
import styles from './Dialog.module.css'

interface DialogProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Fenêtre de dialogue, fondée sur l'élément natif <dialog> : le navigateur gère
 * le piège à focus, la touche Échap et le retour du focus à la fermeture.
 */
export function Dialog({ open, title, onClose, children }: DialogProps) {
  const element = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = element.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={element}
      className={styles.dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        // Un clic sur le fond, hors de la fenêtre, la ferme.
        if (event.target === element.current) onClose()
      }}
    >
      {open && (
        <div className={styles.content}>
          <h2 id={titleId}>{title}</h2>
          <div className={styles.body}>{children}</div>
        </div>
      )}
    </dialog>
  )
}

/**
 * Boutons d'une fenêtre : côte à côte et alignés à droite sur ordinateur, empilés
 * sur toute la largeur sur téléphone. L'action qui fait avancer est la dernière.
 */
export function DialogActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>
}
