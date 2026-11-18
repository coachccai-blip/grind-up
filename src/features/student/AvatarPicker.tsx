import { AVATARS } from '../../../shared/rules/avatars'
import { errorMessage } from '../../lib/api'
import { Avatar } from '../../ui/Avatar'
import { classes } from '../../ui/classes'
import { Notice } from '../../ui/Notice'
import styles from './AvatarPicker.module.css'
import { useChangeAvatar } from './progress-api'

/** Galerie d'avatars : l'élève en choisit un, il est enregistré aussitôt. */
export function AvatarPicker({ current }: { current: string }) {
  const change = useChangeAvatar()
  // Le choix s'affiche tout de suite, sans attendre la réponse du serveur.
  const selected = change.isPending ? change.variables : current

  return (
    <fieldset className={styles.picker}>
      <legend className="visually-hidden">Choisis ton avatar</legend>
      <div className={styles.gallery}>
        {AVATARS.map((avatar) => (
          <label
            key={avatar.id}
            className={classes(styles.option, avatar.id === selected && styles.selected)}
          >
            <input
              type="radio"
              name="avatar"
              className="visually-hidden"
              checked={avatar.id === selected}
              onChange={() => change.mutate(avatar.id)}
            />
            <Avatar avatar={avatar.id} decorative />
            <span className="visually-hidden">{avatar.label}</span>
          </label>
        ))}
      </div>
      {change.isError && <Notice tone="error">{errorMessage(change.error)}</Notice>}
    </fieldset>
  )
}
