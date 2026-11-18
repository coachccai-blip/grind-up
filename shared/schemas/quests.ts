import { z } from 'zod'
import { answerKey } from '../rules/answers.js'
import {
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_PASS_THRESHOLD,
  isAutoCorrected,
  QUEST_CATEGORY_IDS,
  QUEST_DIFFICULTY_IDS,
  QUEST_FORMAT_IDS,
  type AssignmentStatus,
  type QuestCategory,
  type QuestDifficulty,
  type QuestFormat,
  type QuestState,
} from '../rules/quests.js'
import type { RewardBreakdown } from '../rules/rewards.js'
import { RICH_TEXT_MAX_LENGTH } from '../rules/rich-text.js'

/**
 * Formats des échanges autour des quêtes, partagés entre le serveur (qui valide
 * toutes les saisies) et l'interface (qui signale les erreurs avant l'envoi).
 */
export const QUEST_TITLE_MAX = 80
export const ITEM_PROMPT_MAX = 500
export const ANSWER_MAX = 200
export const MAX_ITEMS = 50
export const MAX_ACCEPTED_ANSWERS = 5
export const MIN_CHOICES = 2
export const MAX_CHOICES = 6
export const MIN_CARDS = 2
export const MAX_REWARD = 10_000
export const MAX_ATTEMPTS_LIMIT = 10
export const COMMENT_MAX = 500
export const FREE_TEXT_MAX = 5000

const TOO_LONG = (max: number) => `${max} caractères au maximum.`

// --- Saisie d'une quête par l'admin -------------------------------------------------------

/**
 * Élément d'une quête. Selon le format : une question et ses réponses acceptées,
 * une question de QCM avec ses choix et les positions des bonnes réponses, ou une
 * carte (question au recto, réponse au verso).
 */
export const questItemInputSchema = z.object({
  prompt: z.string().trim().max(ITEM_PROMPT_MAX, TOO_LONG(ITEM_PROMPT_MAX)),
  answers: z
    .array(z.string().trim().max(ANSWER_MAX, TOO_LONG(ANSWER_MAX)))
    .max(MAX_ACCEPTED_ANSWERS)
    .default([]),
  choices: z
    .array(z.string().trim().max(ANSWER_MAX, TOO_LONG(ANSWER_MAX)))
    .max(MAX_CHOICES)
    .default([]),
  correct: z
    .array(
      z
        .number()
        .int()
        .min(0)
        .max(MAX_CHOICES - 1),
    )
    .max(MAX_CHOICES)
    .default([]),
})
export type QuestItemInput = z.infer<typeof questItemInputSchema>

/** Élèves à qui la quête est donnée : tous les élèves actifs, ou une liste. */
export const assigneesSchema = z.union([
  z.literal('all'),
  z.array(z.string().min(1).max(64)).max(500),
])
export type Assignees = z.infer<typeof assigneesSchema>

export const questInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Donnez un titre à la quête.')
    .max(QUEST_TITLE_MAX, TOO_LONG(QUEST_TITLE_MAX)),
  instructions: z.string().max(RICH_TEXT_MAX_LENGTH, TOO_LONG(RICH_TEXT_MAX_LENGTH)).default(''),
  category: z.enum(QUEST_CATEGORY_IDS),
  format: z.enum(QUEST_FORMAT_IDS),
  difficulty: z.enum(QUEST_DIFFICULTY_IDS),
  rewardXp: z
    .number('Indiquez une récompense en XP.')
    .int('La récompense est un nombre entier.')
    .min(0, 'La récompense ne peut pas être négative.')
    .max(MAX_REWARD, `${MAX_REWARD} XP au maximum.`),
  /** Deadline en UTC (ISO 8601), ou null pour une quête sans deadline. */
  deadlineAt: z.iso.datetime().nullable().default(null),
  /** Déclaratif seulement : vrai si l'admin valide lui-même, faux pour une validation immédiate. */
  manualValidation: z.boolean().default(true),
  /** Formats corrigés automatiquement : pourcentage de bonnes réponses à atteindre. */
  passThreshold: z
    .number()
    .int()
    .min(1, 'Le seuil va de 1 à 100\u00A0%.')
    .max(100, 'Le seuil va de 1 à 100\u00A0%.')
    .default(DEFAULT_PASS_THRESHOLD),
  /** Formats corrigés automatiquement : nombre d'essais permis. */
  maxAttempts: z
    .number()
    .int()
    .min(1, 'Au moins une tentative.')
    .max(MAX_ATTEMPTS_LIMIT, `${MAX_ATTEMPTS_LIMIT} tentatives au maximum.`)
    .default(DEFAULT_MAX_ATTEMPTS),
  items: z
    .array(questItemInputSchema)
    .max(MAX_ITEMS, `${MAX_ITEMS} éléments au maximum.`)
    .default([]),
  assignees: assigneesSchema.default([]),
})
export type QuestInput = z.infer<typeof questInputSchema>

/** Requête d'enregistrement : la quête, et l'intention de la publier ou non. */
export const saveQuestRequestSchema = questInputSchema.extend({
  publish: z.boolean().default(false),
})
export type SaveQuestRequest = z.infer<typeof saveQuestRequestSchema>

/** Réponses distinctes au sens de la correction : « 3,50 » et « 3.5 » n'en font qu'une. */
function distinctAnswers(answers: readonly string[]): string[] {
  const seen = new Set<string>()
  return answers.filter((answer) => {
    const key = answerKey(answer)
    if (key === '' || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Met une quête sous sa forme enregistrée : chaque élément ne garde que ce qui
 * sert à son format, les choix vides d'un QCM sont retirés (les positions des
 * bonnes réponses suivent), et les réglages sans objet reprennent leur valeur
 * par défaut.
 */
export function normalizeQuestInput(input: QuestInput): QuestInput {
  const items = input.items.map((item): QuestItemInput => {
    switch (input.format) {
      case 'exact':
        return {
          prompt: item.prompt,
          answers: distinctAnswers(item.answers),
          choices: [],
          correct: [],
        }
      case 'flashcards':
        return {
          prompt: item.prompt,
          answers: item.answers.filter((answer) => answer !== '').slice(0, 1),
          choices: [],
          correct: [],
        }
      case 'qcm': {
        const kept = item.choices
          .map((choice, position) => ({ choice, position }))
          .filter(({ choice }) => choice !== '')
        const correct = kept
          .map(({ position }, newPosition) => (item.correct.includes(position) ? newPosition : -1))
          .filter((position) => position >= 0)
        return {
          prompt: item.prompt,
          answers: [],
          choices: kept.map(({ choice }) => choice),
          correct,
        }
      }
      default:
        return { prompt: item.prompt, answers: [], choices: [], correct: [] }
    }
  })

  const auto = isAutoCorrected(input.format)
  return {
    ...input,
    items: auto ? items : [],
    manualValidation: input.format === 'declarative' ? input.manualValidation : !auto,
    passThreshold: auto ? input.passThreshold : DEFAULT_PASS_THRESHOLD,
    maxAttempts: auto ? input.maxAttempts : DEFAULT_MAX_ATTEMPTS,
  }
}

/**
 * Ce qui empêche de publier une quête, champ par champ. Un brouillon peut être
 * incomplet ; une quête publiée doit pouvoir être réalisée et corrigée.
 * Les clés suivent les champs du formulaire : « items.2.answers », « deadlineAt »…
 */
export function publishProblems(quest: QuestInput, now: Date): Record<string, string> {
  const problems: Record<string, string> = {}

  if (quest.deadlineAt !== null && new Date(quest.deadlineAt).getTime() <= now.getTime()) {
    problems.deadlineAt = 'La deadline doit être dans le futur.'
  }

  if (!isAutoCorrected(quest.format)) {
    if (quest.instructions.trim() === '') {
      problems.instructions =
        'La consigne dit à l’élève ce qu’il doit faire\u00A0: elle est requise.'
    }
    return problems
  }

  const minimum = quest.format === 'flashcards' ? MIN_CARDS : 1
  if (quest.items.length < minimum) {
    problems.items =
      quest.format === 'flashcards'
        ? `Ajoutez au moins ${MIN_CARDS} cartes.`
        : 'Ajoutez au moins une question.'
  }

  quest.items.forEach((item, index) => {
    const field = (name: string) => `items.${index}.${name}`
    if (item.prompt === '') {
      problems[field('prompt')] =
        quest.format === 'flashcards' ? 'Question de la carte requise.' : 'Énoncé requis.'
    }
    if (quest.format === 'exact' && item.answers.length === 0) {
      problems[field('answers')] = 'Indiquez au moins une réponse attendue.'
    }
    if (quest.format === 'flashcards' && item.answers.length === 0) {
      problems[field('answers')] = 'Réponse de la carte requise.'
    }
    if (quest.format === 'qcm') {
      const keys = item.choices.map(answerKey)
      if (item.choices.length < MIN_CHOICES) {
        problems[field('choices')] = `Proposez au moins ${MIN_CHOICES} choix.`
      } else if (new Set(keys).size !== keys.length) {
        problems[field('choices')] = 'Deux choix sont identiques.'
      } else if (item.correct.length === 0) {
        problems[field('choices')] = 'Cochez au moins une bonne réponse.'
      }
    }
  })

  // Le test des cartes propose les réponses des autres cartes : il en faut au moins deux distinctes.
  if (quest.format === 'flashcards' && problems.items === undefined) {
    const backs = new Set(quest.items.map((item) => answerKey(item.answers[0] ?? '')))
    backs.delete('')
    if (backs.size < MIN_CARDS) {
      problems.items = 'Les cartes doivent avoir au moins deux réponses différentes.'
    }
  }

  return problems
}

/** Envoi de l'image de la consigne, encodée en adresse « data: ». */
export const questImageRequestSchema = z.object({
  dataUrl: z.string().min(1).max(2_100_000, 'Cette image est trop lourde.'),
})

// --- Actions de l'admin sur une quête ou une réalisation -----------------------------------

export const addAssigneesRequestSchema = z.object({ assignees: assigneesSchema })
export type AddAssigneesRequest = z.infer<typeof addAssigneesRequestSchema>

export const validateRequestSchema = z.object({
  comment: z.string().trim().max(COMMENT_MAX, TOO_LONG(COMMENT_MAX)).default(''),
})

export const rejectRequestSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(1, 'Expliquez à l’élève ce qu’il doit reprendre.')
    .max(COMMENT_MAX, TOO_LONG(COMMENT_MAX)),
  /** Deadline passée : rouvrir la quête pour que l'élève puisse recommencer. */
  reopen: z.boolean().default(false),
})
export type RejectRequest = z.infer<typeof rejectRequestSchema>

export const grantAttemptsRequestSchema = z.object({
  count: z.number().int().min(1).max(MAX_ATTEMPTS_LIMIT).default(1),
})

// --- Réponses de l'élève ---------------------------------------------------------------------

/**
 * Une tentative. Selon le format :
 * - réponse exacte : un texte par question ;
 * - QCM : les positions des choix cochés, par question ;
 * - cartes : pour chaque carte, l'identifiant de la carte dont la réponse est choisie ;
 * - déclaratif : un commentaire facultatif ;
 * - réponse libre : le texte.
 */
export const attemptRequestSchema = z.object({
  answers: z
    .record(
      z.string().max(64),
      z.union([
        z.string().max(ANSWER_MAX, TOO_LONG(ANSWER_MAX)),
        z
          .array(
            z
              .number()
              .int()
              .min(0)
              .max(MAX_CHOICES - 1),
          )
          .max(MAX_CHOICES),
      ]),
    )
    .default({}),
  comment: z.string().trim().max(COMMENT_MAX, TOO_LONG(COMMENT_MAX)).default(''),
  text: z.string().trim().max(FREE_TEXT_MAX, TOO_LONG(FREE_TEXT_MAX)).default(''),
})
export type AttemptRequest = z.infer<typeof attemptRequestSchema>
export type AttemptAnswers = AttemptRequest['answers']

// --- Ce que reçoit l'admin -------------------------------------------------------------------

export interface QuestProgress {
  assigned: number
  validated: number
  /** Réalisations en attente de validation. */
  submitted: number
}

/** Une quête dans la liste de l'admin. */
export interface AdminQuestSummary {
  id: string
  title: string
  category: QuestCategory
  format: QuestFormat
  difficulty: QuestDifficulty
  rewardXp: number
  deadlineAt: string | null
  state: QuestState
  createdAt: string
  updatedAt: string
  progress: QuestProgress
}

export interface AssignedStudent {
  id: string
  pseudo: string
  publicId: string
  avatar: string
  isActive: boolean
}

/** L'avancement d'un élève sur une quête. */
export interface AdminAssignment {
  id: string
  student: AssignedStudent
  status: AssignmentStatus
  /** Tentatives épuisées sans atteindre le seuil : l'élève attend que l'admin en redonne. */
  blocked: boolean
  attemptsUsed: number
  attemptsAllowed: number
  /** Meilleur score des tentatives corrigées automatiquement, en pourcentage. */
  bestScore: number | null
  assignedAt: string
  submittedAt: string | null
  validatedAt: string | null
  xpAwarded: number | null
  adminComment: string | null
}

export interface AdminQuestItem extends QuestItemInput {
  id: string
}

/** Une quête complète, réponses attendues comprises : réservée à l'admin. */
export interface AdminQuestDetail extends AdminQuestSummary {
  instructions: string
  manualValidation: boolean
  passThreshold: number
  maxAttempts: number
  /** Adresse de l'image de la consigne, ou null. Elle change quand l'image change. */
  imageUrl: string | null
  items: AdminQuestItem[]
  /** Brouillon : les élèves choisis, qui recevront la quête à sa publication. */
  draftAssignees: Assignees
  /** Vrai dès qu'un élève a soumis : les questions et la récompense sont alors figées. */
  locked: boolean
  assignments: AdminAssignment[]
}

export interface AdminQuestsResponse {
  quests: AdminQuestSummary[]
}

export interface AdminQuestResponse {
  quest: AdminQuestDetail
}

/** Une réalisation soumise, dans la file de validation. */
export interface PendingValidation {
  assignmentId: string
  quest: {
    id: string
    title: string
    category: QuestCategory
    format: QuestFormat
    rewardXp: number
    deadlineAt: string | null
  }
  student: AssignedStudent
  submittedAt: string
  /** Vrai si la soumission est arrivée après la deadline (quête rouverte). */
  late: boolean
  /** Réponse de l'élève : son texte, ou son commentaire pour une quête déclarative. */
  answer: string
  attemptNumber: number
}

export interface ValidationsResponse {
  validations: PendingValidation[]
}

export interface AssignmentResponse {
  assignment: AdminAssignment
}

// --- Ce que reçoit l'élève -------------------------------------------------------------------

/** Une quête dans les listes de l'élève. */
export interface StudentQuestSummary {
  /** Identifiant de la quête : chaque élève n'a qu'une réalisation par quête. */
  id: string
  title: string
  category: QuestCategory
  format: QuestFormat
  difficulty: QuestDifficulty
  rewardXp: number
  deadlineAt: string | null
  status: AssignmentStatus
  /** Tentatives épuisées : l'élève ne peut plus répondre tant que l'admin n'en redonne pas. */
  blocked: boolean
  assignedAt: string
  submittedAt: string | null
  validatedAt: string | null
  xpAwarded: number | null
}

/**
 * Élément d'une quête, tel que l'élève le reçoit. Les réponses attendues n'y
 * figurent jamais, sauf le verso des cartes de mémorisation, qui sont faites
 * pour être lues.
 */
export interface StudentQuestItem {
  id: string
  prompt: string
  /** QCM : les choix proposés. */
  choices?: string[]
  /** QCM : vrai si plusieurs réponses sont à cocher. */
  multiple?: boolean
  /** Cartes : le verso de la carte. */
  back?: string
  /** Cartes : les réponses proposées au test, désignées par leur carte. */
  options?: { id: string; text: string }[]
}

export interface AttemptResult {
  number: number
  /** Pourcentage de bonnes réponses ; null pour une réalisation validée à la main. */
  score: number | null
  /** Par élément : vrai si la réponse était juste. */
  results: Record<string, boolean>
  answers: AttemptAnswers
  comment: string
  text: string
  createdAt: string
}

export interface StudentQuestDetail extends StudentQuestSummary {
  instructions: string
  /** Adresse de l'image de la consigne, ou null. Elle change quand l'image change. */
  imageUrl: string | null
  manualValidation: boolean
  passThreshold: number
  attemptsUsed: number
  attemptsAllowed: number
  items: StudentQuestItem[]
  lastAttempt: AttemptResult | null
  adminComment: string | null
  /** Détail de l'XP gagnée, une fois la quête validée. */
  reward: RewardBreakdown | null
  /**
   * Corrigé, une fois la quête validée : par élément, les réponses attendues
   * (réponse exacte) ou les choix justes (QCM).
   */
  corrections: Record<string, string[]> | null
}

export interface StudentQuestsResponse {
  quests: StudentQuestSummary[]
}

export interface StudentQuestResponse {
  quest: StudentQuestDetail
}
