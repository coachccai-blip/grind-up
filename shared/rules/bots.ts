import { parisLocalToInstant } from '../time.js'
import { QUEST_DIFFICULTIES, type QuestDifficulty } from './quests.js'
import { DEFAULT_REWARDS, type RewardTable } from './settings.js'
import { shiftDay } from './streak.js'

/**
 * Bots (section 5 du brief) : de faux participants créés par l'admin, qui
 * progressent seuls pour donner du rythme au classement. Leur progression est
 * calculée quand un classement est demandé, sans tâche planifiée.
 */
export const BOT_MODES = [
  {
    id: 'regular',
    label: 'Régulier',
    hint: 'Accomplit un nombre fixe de missions par semaine.',
  },
  {
    id: 'adaptive',
    label: 'Adaptatif',
    hint: 'Vise une position par rapport aux élèves réels.',
  },
] as const
export type BotMode = (typeof BOT_MODES)[number]['id']

export const BOT_TARGETS = [
  { id: 'ahead_of_first', label: 'Juste devant le premier' },
  { id: 'middle', label: 'Autour du milieu du classement' },
  { id: 'behind_last', label: 'Juste derrière le dernier' },
] as const
export type BotTarget = (typeof BOT_TARGETS)[number]['id']

export const BOT_MISSIONS_MIN = 1
export const BOT_MISSIONS_MAX = 20
export const DEFAULT_BOT_MISSIONS = 5

/** Les missions d'un bot tombent entre 8 h et 21 h, heure de Paris. */
export const BOT_DAY_START_HOUR = 8
export const BOT_DAY_END_HOUR = 21

/** Répartition des difficultés des missions d'un bot : un poids par difficulté. */
export type DifficultyMix = Record<QuestDifficulty, number>

export const DEFAULT_DIFFICULTY_MIX: DifficultyMix = { easy: 40, medium: 40, hard: 15, epic: 5 }

/** Un nombre au hasard dans [0, 1[, comme Math.random : remplaçable dans les tests. */
export type Random = () => number

/**
 * Tire l'XP d'une mission dans le barème des difficultés, selon la répartition du
 * bot. Le barème est celui des paramètres de l'admin ; à défaut, celui du brief.
 */
export function drawMissionXp(
  mix: DifficultyMix,
  random: Random,
  rewards: RewardTable = DEFAULT_REWARDS,
): number {
  const entries = QUEST_DIFFICULTIES.map(
    (difficulty) => [difficulty.id, Math.max(0, mix[difficulty.id] ?? 0)] as const,
  )
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  if (total <= 0) return rewards.medium
  let draw = random() * total
  for (const [difficulty, weight] of entries) {
    draw -= weight
    if (draw < 0) return rewards[difficulty]
  }
  return rewards[entries.at(-1)![0]]
}

const two = (value: number) => String(value).padStart(2, '0')

/**
 * Planning d'un bot régulier pour une semaine : pour chaque mission, un jour du
 * lundi au dimanche et une heure entre 8 h et 21 h (heure de Paris), tirés au
 * sort. Renvoie les instants en UTC, du plus tôt au plus tard.
 */
export function drawWeekSchedule(monday: string, missions: number, random: Random): string[] {
  const minutesInDay = (BOT_DAY_END_HOUR - BOT_DAY_START_HOUR) * 60
  const instants: string[] = []
  for (let index = 0; index < missions; index += 1) {
    const day = shiftDay(monday, Math.min(6, Math.floor(random() * 7)))
    const minutes =
      BOT_DAY_START_HOUR * 60 + Math.min(minutesInDay - 1, Math.floor(random() * minutesInDay))
    const local = `${day}T${two(Math.floor(minutes / 60))}:${two(minutes % 60)}`
    const instant = parisLocalToInstant(local)
    if (instant) instants.push(instant.toISOString())
  }
  return instants.sort()
}

/**
 * Nombre de missions que vise un bot adaptatif, d'après les missions des élèves
 * réels sur la semaine : une de plus que le premier, la médiane, ou une de moins
 * que le dernier.
 */
export function adaptiveTarget(target: BotTarget, studentMissions: readonly number[]): number {
  if (studentMissions.length === 0) return 0
  const sorted = [...studentMissions].sort((first, second) => first - second)
  switch (target) {
    case 'ahead_of_first':
      return sorted.at(-1)! + 1
    case 'behind_last':
      return Math.max(0, sorted[0]! - 1)
    case 'middle': {
      const middle = Math.floor(sorted.length / 2)
      const median =
        sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2
      return Math.round(median)
    }
  }
}

/** Pseudos proposés quand l'admin en tire un au hasard. */
export const BOT_PSEUDOS = [
  'Astro',
  'Biscotte',
  'Comète',
  'Dynamo',
  'Éclair',
  'Fusée',
  'Galaxie',
  'Hibou',
  'Iris',
  'Jaguar',
  'Koala',
  'Lumen',
  'Mistral',
  'Nébula',
  'Orion',
  'Pixel',
  'Quartz',
  'Rocket',
  'Sirius',
  'Tornade',
  'Ulysse',
  'Vega',
  'Zéphyr',
] as const
