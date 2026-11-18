import styles from './Identifier.module.css'
import { classes } from './classes'

/** Identifiant XXXX-XXXX d'un élève, affiché en caractères espacés pour être recopié sans erreur. */
export function Identifier({ value, large = false }: { value: string; large?: boolean }) {
  return <span className={classes(styles.identifier, large && styles.large)}>{value}</span>
}
