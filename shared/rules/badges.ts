import type { QuestCategory } from './quests.js'

/**
 * Badges (sections 4 et 8 du brief). Ils sont attribués automatiquement ; un
 * badge ne s'obtient qu'une fois et n'est jamais retiré.
 */
export interface BadgeStats {
  /** Quêtes validées, toutes catégories confondues. */
  validated: number
  validatedByCategory: Partial<Record<QuestCategory, number>>
  /** Record de série, en jours. */
  bestStreak: number
  /** Quêtes validées avec le bonus d'avance. */
  earlyBonuses: number
  /** Quêtes validées avec le bonus sans faute. */
  flawlessBonuses: number
  /** Semaines terminées dans les trois premiers du leaderboard. */
  podiumWeeks: number
}

export interface Badge {
  code: string
  label: string
  emoji: string
  /** Ce qu'il faut faire pour l'obtenir, dit à l'élève. */
  condition: string
  /** Avancement vers le badge : ce qui est fait, et ce qu'il faut atteindre. */
  progress: (stats: BadgeStats) => { done: number; goal: number }
}

const category = (id: QuestCategory, goal: number) => (stats: BadgeStats) => ({
  done: stats.validatedByCategory[id] ?? 0,
  goal,
})

export const BADGES: readonly Badge[] = [
  {
    code: 'first_step',
    label: 'Premier pas',
    emoji: '👣',
    condition: 'Valide ta première quête.',
    progress: (stats) => ({ done: stats.validated, goal: 1 }),
  },
  {
    code: 'regular',
    label: 'Régulier',
    emoji: '📅',
    condition: 'Tiens une série de 7 jours.',
    progress: (stats) => ({ done: stats.bestStreak, goal: 7 }),
  },
  {
    code: 'unstoppable',
    label: 'Inarrêtable',
    emoji: '🚀',
    condition: 'Tiens une série de 30 jours.',
    progress: (stats) => ({ done: stats.bestStreak, goal: 30 }),
  },
  {
    code: 'maths',
    label: 'Matheux',
    emoji: '📐',
    condition: 'Valide 10 quêtes de maths.',
    progress: category('maths', 10),
  },
  {
    code: 'memory',
    label: 'Mémoire d’éléphant',
    emoji: '🐘',
    condition: 'Valide 10 quêtes de mémorisation.',
    progress: category('memorization', 10),
  },
  {
    code: 'athlete',
    label: 'Athlète',
    emoji: '🏅',
    condition: 'Valide 10 quêtes de sport.',
    progress: category('sport', 10),
  },
  {
    code: 'early',
    label: 'En avance',
    emoji: '⏰',
    condition: 'Valide 5 quêtes avec le bonus d’avance.',
    progress: (stats) => ({ done: stats.earlyBonuses, goal: 5 }),
  },
  {
    code: 'flawless',
    label: 'Sans faute',
    emoji: '💯',
    condition: 'Réussis 5 quêtes sans faute dès le premier essai.',
    progress: (stats) => ({ done: stats.flawlessBonuses, goal: 5 }),
  },
  {
    code: 'podium',
    label: 'Podium',
    emoji: '👑',
    condition: 'Termine une semaine dans les 3 premiers du leaderboard.',
    progress: (stats) => ({ done: stats.podiumWeeks, goal: 1 }),
  },
]

export type BadgeCode = (typeof BADGES)[number]['code']

export function findBadge(code: string): Badge | undefined {
  return BADGES.find((badge) => badge.code === code)
}

/** Codes des badges dont la condition est remplie. */
export function earnedBadges(stats: BadgeStats): string[] {
  return BADGES.filter((badge) => {
    const { done, goal } = badge.progress(stats)
    return done >= goal
  }).map((badge) => badge.code)
}
