import { errorMessage } from '../../lib/api'
import { AvatarChoice } from '../../ui/AvatarChoice'
import { Notice } from '../../ui/Notice'
import { useChangeAvatar } from './progress-api'

/** Galerie d'avatars du profil : l'élève en choisit un, il est enregistré aussitôt. */
export function AvatarPicker({ current }: { current: string }) {
  const change = useChangeAvatar()
  // Le choix s'affiche tout de suite, sans attendre la réponse du serveur.
  const selected = change.isPending ? change.variables : current

  return (
    <>
      <AvatarChoice
        legend="Choisis ton avatar"
        value={selected}
        onChange={(avatar) => change.mutate(avatar)}
      />
      {change.isError && <Notice tone="error">{errorMessage(change.error)}</Notice>}
    </>
  )
}
