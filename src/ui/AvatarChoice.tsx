import { useId } from 'react'
import { AVATARS } from '../../shared/rules/avatars'
import { Avatar } from './Avatar'
import styles from './AvatarChoice.module.css'
import { classes } from './classes'

interface AvatarChoiceProps {
  legend: string
  value: string
  onChange: (avatar: string) => void
}

/** Galerie d'avatars : un choix parmi les emojis fournis, chacun dans une zone tactile de 52 px. */
export function AvatarChoice({ legend, value, onChange }: AvatarChoiceProps) {
  const name = useId()
  return (
    <fieldset className={styles.picker}>
      <legend className="visually-hidden">{legend}</legend>
      <div className={styles.gallery}>
        {AVATARS.map((avatar) => (
          <label
            key={avatar.id}
            className={classes(styles.option, avatar.id === value && styles.selected)}
          >
            <input
              type="radio"
              name={name}
              className="visually-hidden"
              checked={avatar.id === value}
              onChange={() => onChange(avatar.id)}
            />
            <Avatar avatar={avatar.id} decorative />
            <span className="visually-hidden">{avatar.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
