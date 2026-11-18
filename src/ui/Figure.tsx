import { figureSrc, type FigureRef } from '../../shared/rules/figures'
import styles from './Figure.module.css'
import { classes } from './classes'

/**
 * Illustration d'un texte : un fichier SVG servi par le site lui-même
 * (public/figures/). Son texte alternatif la décrit ; vide, l'image est
 * décorative et les lecteurs d'écran la passent.
 */
export function Figure({ id, alt, className }: FigureRef & { className?: string }) {
  return (
    <div className={classes(styles.figure, className)}>
      <img src={figureSrc(id)} alt={alt} loading="lazy" decoding="async" />
    </div>
  )
}

/** Les illustrations d'un énoncé, sous son texte. */
export function Figures({ figures }: { figures: readonly FigureRef[] }) {
  if (figures.length === 0) return null
  return (
    <div className={styles.group}>
      {figures.map((figure, index) => (
        <Figure key={`${figure.id}-${index}`} {...figure} />
      ))}
    </div>
  )
}
