/**
 * Niveaux (section 4 du brief). Passer du niveau n au niveau n + 1 coûte 100 × n XP :
 * l'XP totale nécessaire pour atteindre le niveau n est donc 50 × n × (n − 1).
 * Le niveau se calcule à partir de l'XP totale ; il n'est jamais stocké.
 */

/** XP totale requise pour atteindre un niveau. Niveau 1 : 0 ; niveau 2 : 100 ; niveau 5 : 1 000. */
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1)
}

/** Niveau atteint avec cette XP totale. Une XP nulle ou négative laisse au niveau 1. */
export function levelFromXp(totalXp: number): number {
  if (totalXp <= 0) return 1
  // Plus grand n tel que 50 n (n − 1) ≤ XP : racine positive de n² − n − XP / 50 = 0.
  let level = Math.floor((1 + Math.sqrt(1 + (4 * totalXp) / 50)) / 2)
  // La racine carrée peut tomber un cran à côté à la frontière d'un niveau : on rectifie.
  while (xpForLevel(level + 1) <= totalXp) level += 1
  while (level > 1 && xpForLevel(level) > totalXp) level -= 1
  return level
}

export interface LevelProgress {
  level: number
  /** XP acquise dans le niveau en cours. */
  xpInLevel: number
  /** XP à réunir pour passer du niveau en cours au suivant : 100 × niveau. */
  xpToNextLevel: number
  /** XP qu'il reste à gagner avant le niveau suivant. */
  xpRemaining: number
  /** Avancement dans le niveau, de 0 à 100. */
  percent: number
}

/** Ce que montre la barre de progression : l'XP du niveau en cours et ce qu'il reste. */
export function levelProgress(totalXp: number): LevelProgress {
  const level = levelFromXp(totalXp)
  const xpToNextLevel = 100 * level
  const xpInLevel = Math.max(0, totalXp - xpForLevel(level))
  return {
    level,
    xpInLevel,
    xpToNextLevel,
    xpRemaining: xpToNextLevel - xpInLevel,
    percent: Math.floor((xpInLevel / xpToNextLevel) * 100),
  }
}
