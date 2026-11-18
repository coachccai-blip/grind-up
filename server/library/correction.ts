import type { QuestItemInput } from '../../shared/schemas/quests.js'

/**
 * Outils de rédaction des exercices de la bibliothèque : une correction s'écrit
 * étape par étape, et devient le texte mis en forme que l'élève lira sous la
 * bonne réponse, une fois sa quête validée.
 */

/** Une étape : la ligne de calcul, puis le commentaire qui la justifie. */
export type Step = readonly [calculation: string, comment: string]

/** Un mauvais choix d'un QCM, puis l'erreur qui y mène. */
export type Trap = readonly [choice: string, mistake: string]

export interface CorrectionParts {
  steps: readonly Step[]
  /** Pourquoi chaque mauvais choix est faux. */
  traps?: readonly Trap[]
  /** Une façon de contrôler le résultat. */
  check?: string
}

/**
 * Met une correction en forme : chaque calcul en gras, son commentaire à la
 * ligne ; puis la liste des pièges, et la vérification.
 */
export function correction({ steps, traps = [], check }: CorrectionParts): string {
  const blocks = steps.map(([calculation, comment]) => `**${calculation}**\n${comment}`)
  if (traps.length > 0) {
    const lines = traps.map(([choice, mistake]) => `- **${choice}**\u00A0: ${mistake}`)
    blocks.push(['**Les pièges**', ...lines].join('\n'))
  }
  if (check) blocks.push(`**Vérification\u00A0:** ${check}`)
  return blocks.join('\n\n')
}

export interface QcmQuestion {
  prompt: string
  choices: readonly string[]
  /** Le bon choix, désigné par son texte : aucune position à compter. */
  answer: string
  correction: CorrectionParts
}

/** Une question de QCM à une seule bonne réponse, avec sa correction détaillée. */
export function qcmQuestion({ prompt, choices, answer, correction: parts }: QcmQuestion) {
  const position = choices.indexOf(answer)
  if (position < 0) throw new Error(`Bonne réponse absente des choix\u00A0: ${prompt}`)
  return {
    prompt,
    answers: [],
    choices: [...choices],
    correct: [position],
    explanation: correction(parts),
  } satisfies QuestItemInput
}
