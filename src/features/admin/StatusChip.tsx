import styles from './StatusChip.module.css'
import { classes } from '../../ui/classes'

/** État d'un compte : le libellé dit l'état, la couleur ne fait que l'appuyer. */
export function StatusChip({ active }: { active: boolean }) {
  return (
    <span className={classes(styles.chip, active ? styles.active : styles.disabled)}>
      {active ? 'Compte actif' : 'Compte désactivé'}
    </span>
  )
}
