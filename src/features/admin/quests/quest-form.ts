import {
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_PASS_THRESHOLD,
  findDifficulty,
  isAutoCorrected,
  SUGGESTED_FORMAT,
  type QuestCategory,
  type QuestDifficulty,
  type QuestFormat,
} from '../../../../shared/rules/quests'
import {
  normalizeQuestInput,
  publishProblems,
  saveQuestRequestSchema,
  type AdminQuestDetail,
  type SaveQuestRequest,
} from '../../../../shared/schemas/quests'
import { instantToParisLocal, parisLocalToInstant } from '../../../../shared/time'

/**
 * État du formulaire d'une quête. Les nombres et la date y sont gardés tels que
 * l'admin les saisit ; ils ne sont convertis qu'à l'envoi.
 */
export interface FormItem {
  /** Identifiant local, le temps de la saisie. */
  key: string
  prompt: string
  /** Réponse exacte : réponses acceptées séparées par « ; ». Carte : sa réponse. */
  answersText: string
  /** QCM : les choix proposés, et les positions des bonnes réponses. */
  choices: string[]
  correct: number[]
}

export interface QuestForm {
  title: string
  instructions: string
  category: QuestCategory
  format: QuestFormat
  difficulty: QuestDifficulty
  rewardXp: string
  /** Date et heure de Paris, au format des champs « date et heure » ; vide pour aucune deadline. */
  deadlineLocal: string
  manualValidation: boolean
  passThreshold: string
  maxAttempts: string
  items: FormItem[]
  assignAll: boolean
  assignees: string[]
}

export const QCM_INITIAL_CHOICES = 3

let nextKey = 0
export function newItem(format: QuestFormat): FormItem {
  nextKey += 1
  return {
    key: `item-${nextKey}`,
    prompt: '',
    answersText: '',
    choices: format === 'qcm' ? Array.from({ length: QCM_INITIAL_CHOICES }, () => '') : [],
    correct: [],
  }
}

/** Éléments de départ d'un format : une question, ou deux cartes. */
export function initialItems(format: QuestFormat): FormItem[] {
  if (!isAutoCorrected(format)) return []
  return format === 'flashcards' ? [newItem(format), newItem(format)] : [newItem(format)]
}

export function emptyForm(): QuestForm {
  const category: QuestCategory = 'maths'
  const format = SUGGESTED_FORMAT[category]
  const difficulty: QuestDifficulty = 'medium'
  return {
    title: '',
    instructions: '',
    category,
    format,
    difficulty,
    rewardXp: String(findDifficulty(difficulty).defaultReward),
    deadlineLocal: '',
    manualValidation: false,
    passThreshold: String(DEFAULT_PASS_THRESHOLD),
    maxAttempts: String(DEFAULT_MAX_ATTEMPTS),
    items: initialItems(format),
    assignAll: true,
    assignees: [],
  }
}

export function formFromQuest(quest: AdminQuestDetail): QuestForm {
  return {
    title: quest.title,
    instructions: quest.instructions,
    category: quest.category,
    format: quest.format,
    difficulty: quest.difficulty,
    rewardXp: String(quest.rewardXp),
    deadlineLocal: quest.deadlineAt ? instantToParisLocal(new Date(quest.deadlineAt)) : '',
    manualValidation: quest.manualValidation,
    passThreshold: String(quest.passThreshold),
    maxAttempts: String(quest.maxAttempts),
    items: quest.items.map((item) => ({
      key: item.id,
      prompt: item.prompt,
      answersText: item.answers.join(' ; '),
      choices: item.choices,
      correct: item.correct,
    })),
    assignAll: quest.draftAssignees === 'all',
    assignees: quest.draftAssignees === 'all' ? [] : quest.draftAssignees,
  }
}

const toNumber = (text: string) => (text.trim() === '' ? Number.NaN : Number(text.trim()))

/** La requête d'enregistrement correspondant au formulaire. */
export function toRequest(form: QuestForm, publish: boolean): SaveQuestRequest {
  const deadline = form.deadlineLocal === '' ? null : parisLocalToInstant(form.deadlineLocal)
  return {
    title: form.title,
    instructions: form.instructions,
    category: form.category,
    format: form.format,
    difficulty: form.difficulty,
    rewardXp: toNumber(form.rewardXp),
    deadlineAt: deadline ? deadline.toISOString() : null,
    manualValidation: form.manualValidation,
    passThreshold: toNumber(form.passThreshold),
    maxAttempts: toNumber(form.maxAttempts),
    items: form.items.map((item) => ({
      prompt: item.prompt,
      answers:
        form.format === 'exact'
          ? item.answersText.split(';').map((answer) => answer.trim())
          : [item.answersText],
      choices: item.choices,
      correct: item.correct,
    })),
    assignees: form.assignAll ? 'all' : form.assignees,
    publish,
  }
}

/**
 * Ce qui est à corriger avant l'envoi, champ par champ. Une quête publiée (ou
 * sur le point de l'être) doit en plus pouvoir être réalisée et corrigée.
 */
export function checkForm(
  form: QuestForm,
  request: SaveQuestRequest,
  options: { complete: boolean; checkDeadline: boolean },
): Record<string, string> {
  const problems: Record<string, string> = {}
  if (form.deadlineLocal !== '' && request.deadlineAt === null) {
    problems.deadlineAt = 'Cette date n’existe pas.'
  }

  const parsed = saveQuestRequestSchema.safeParse(request)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path.join('.') || '_'
      // Un nombre illisible est signalé dans les mots de l'admin, pas dans ceux de la validation.
      const unreadable = issue.code === 'invalid_type' ? NUMBER_MESSAGES[field] : undefined
      problems[field] ??= unreadable ?? issue.message
    }
  }

  if (options.complete) {
    // Le contenu est contrôlé même si un autre champ est déjà en erreur : l'admin voit tout
    // ce qui reste à corriger en une seule fois.
    const { deadlineAt, ...rest } = publishProblems(normalizeQuestInput(request), new Date())
    for (const [field, message] of Object.entries(rest)) problems[field] ??= message
    if (deadlineAt && options.checkDeadline) problems.deadlineAt ??= deadlineAt
  }
  return problems
}

const NUMBER_MESSAGES: Record<string, string> = {
  rewardXp: 'Indiquez une récompense en XP, en nombre entier.',
  passThreshold: 'Le seuil va de 1 à 100\u00A0%.',
  maxAttempts: 'Indiquez un nombre de tentatives, de 1 à 10.',
}
