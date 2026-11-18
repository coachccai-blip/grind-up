import type { QuestDifficulty } from '../../shared/rules/quests.js'
import type { LibraryExercise } from '../../shared/schemas/library.js'
import type { QuestItemInput } from '../../shared/schemas/quests.js'
import type { LibraryThemeId } from './themes.js'
import { typography } from './typography.js'

/**
 * Outils de rédaction des exercices de la bibliothèque.
 *
 * Un exercice suit toujours le même plan : un bref rappel du cours, un exemple
 * expliqué de la méthode, puis des questions pour s'entraîner, chacune avec sa
 * correction détaillée. Les textes s'écrivent au clavier, avec des espaces
 * ordinaires : la typographie de l'application leur est appliquée ici.
 *
 * Écriture des calculs : le carré « ² », le signe de multiplication « × »
 * (jamais la lettre x), la virgule décimale. Un test relit chaque exercice et
 * recalcule toutes les égalités qu'il sait lire.
 */

/** Une étape d'une résolution : la ligne de calcul, puis le commentaire qui la justifie. */
export type Step = readonly [calculation: string, comment: string]

/** Un mauvais choix d'un QCM, puis l'erreur qui y mène. */
export type Trap = readonly [choice: string, mistake: string]

export interface CorrectionParts {
  /** La résolution, étape par étape. La dernière étape énonce la bonne réponse. */
  steps: readonly Step[]
  /** QCM : pourquoi chaque mauvais choix est faux. */
  traps?: readonly Trap[]
  /** Réponse à saisir : l'erreur la plus courante. */
  mistake?: string
  /** Une façon de contrôler le résultat. */
  check?: string
}

const stepBlocks = (steps: readonly Step[]) =>
  steps.map(([calculation, comment]) => `**${typography(calculation)}**\n${typography(comment)}`)

/**
 * Met une correction en forme : chaque calcul en gras, son commentaire à la
 * ligne ; puis les pièges ou l'erreur à éviter, et la vérification.
 */
export function correction({ steps, traps = [], mistake, check }: CorrectionParts): string {
  const blocks = stepBlocks(steps)
  if (traps.length > 0) {
    const lines = traps.map(
      ([choice, why]) => `- **${typography(choice)}**\u00A0: ${typography(why)}`,
    )
    blocks.push(['**Les pièges**', ...lines].join('\n'))
  }
  if (mistake) blocks.push(`**Erreur à éviter\u00A0:** ${typography(mistake)}`)
  if (check) blocks.push(`**Vérification\u00A0:** ${typography(check)}`)
  return blocks.join('\n\n')
}

export interface WorkedExample {
  /** L'énoncé de l'exemple : une question du même genre que celles de l'exercice. */
  statement: string
  /** La méthode, étape par étape. */
  steps: readonly Step[]
  /** La réponse, en une phrase. */
  conclusion: string
}

/**
 * Met en forme l'exemple expliqué : l'énoncé, la méthode pas à pas, la conclusion.
 * Quand un exercice fait travailler deux méthodes, il peut en montrer deux.
 */
export function workedExample(example: WorkedExample | readonly WorkedExample[]): string {
  const examples: readonly WorkedExample[] = Array.isArray(example) ? example : [example]
  return examples
    .flatMap(({ statement, steps, conclusion }, index) => [
      ...(examples.length > 1 ? [`**Exemple ${index + 1}**`] : []),
      `**Énoncé\u00A0:** ${typography(statement)}`,
      ...stepBlocks(steps),
      `**Conclusion\u00A0:** ${typography(conclusion)}`,
    ])
    .join('\n\n')
}

/** Assemble des paragraphes ; une liste s'écrit comme un paragraphe de lignes « - … ». */
export const paragraphs = (...blocks: readonly string[]) => blocks.join('\n\n')

export interface QcmQuestion {
  kind: 'qcm'
  prompt: string
  choices: readonly string[]
  /** Le bon choix, désigné par son texte : aucune position à compter. */
  answer: string
  correction: CorrectionParts
}

export interface ExactQuestion {
  kind: 'exact'
  prompt: string
  /** Les réponses acceptées ; la première est celle que montre le corrigé. */
  answers: readonly string[]
  correction: CorrectionParts
}

export type Question = QcmQuestion | ExactQuestion

/** Une question de QCM à une seule bonne réponse, avec sa correction détaillée. */
export const qcm = (question: Omit<QcmQuestion, 'kind'>): QcmQuestion => ({
  kind: 'qcm',
  ...question,
})

/** Une question dont l'élève saisit la réponse : un nombre, ou une réponse courte. */
export const exact = (question: Omit<ExactQuestion, 'kind'>): ExactQuestion => ({
  kind: 'exact',
  ...question,
})

/** Unités qu'un énoncé peut demander (« en cm », « en euros »), et la façon dont un élève les écrit. */
const ASKED_UNITS: readonly (readonly [asked: string, written: readonly string[]])[] = [
  ['km/h', ['km/h']],
  ['m/s', ['m/s']],
  ['cm²', ['cm²', 'cm2']],
  ['cm³', ['cm³', 'cm3']],
  ['m²', ['m²', 'm2']],
  ['m³', ['m³', 'm3']],
  ['cm', ['cm']],
  ['mm', ['mm']],
  ['dm', ['dm']],
  ['km', ['km']],
  ['m', ['m']],
  ['kg', ['kg']],
  ['g', ['g']],
  ['litres', ['L', 'litres']],
  ['L', ['L']],
  ['heures', ['h', 'heures']],
  ['h', ['h']],
  ['minutes', ['min', 'minutes']],
  ['min', ['min']],
  ['secondes', ['s', 'secondes']],
  ['euros', ['€', 'euros']],
  ['€', ['€']],
  ['%', ['%']],
  ['degrés', ['°', 'degrés']],
  ['°C', ['°C', '°']],
  ['°', ['°']],
]

const MAX_ANSWERS = 5

/** Ce que l'élève peut écrire après le nombre quand l'énoncé demande « combien de … ». */
const COUNTED: Record<string, readonly string[]> = { années: ['ans', 'années'], temps: [] }

/**
 * Les réponses acceptées d'une question à saisir. L'élève doit écrire le nombre
 * seul ; une réponse juste n'est pas refusée pour autant s'il l'habille comme
 * l'énoncé y invite :
 * - avec l'unité demandée (« en cm ») : « 5 cm » ;
 * - avec ce que l'on compte (« combien de séances ») : « 12 séances » ;
 * - avec l'inconnue, quand l'énoncé parle de x : « x = 8 ».
 */
function acceptedAnswers(prompt: string, answers: readonly string[]): string[] {
  const numbers = answers.filter((answer) => /^[−-]?\d+(?:[,.]\d+)?$/.test(answer))
  const unit = [...prompt.matchAll(/\ben ([\p{L}%°€/²³]+)/gu)]
    .map((match) => ASKED_UNITS.find(([asked]) => asked === match[1]))
    .filter((found) => found !== undefined)
    .at(-1)
  const counted = [...prompt.matchAll(/\bcombien d(?:e |’)(\p{L}+)/giu)].at(-1)?.[1]
  const suffixes = [...(unit?.[1] ?? []), ...(counted ? (COUNTED[counted] ?? [counted]) : [])]
  // La lettre x d'une expression (« 3x + 5 », « x² »), pas celle d'un mot (« deux », « dix »).
  const unknown = /(?<!\p{L})x(?!\p{L})/u.test(prompt)

  return [
    ...answers,
    ...(unknown ? numbers.map((answer) => `x = ${answer}`) : []),
    ...suffixes.flatMap((suffix) => numbers.map((answer) => `${answer} ${suffix}`)),
  ].slice(0, MAX_ANSWERS)
}

function toItem(question: Question): QuestItemInput {
  if (question.kind === 'exact') {
    return {
      prompt: typography(question.prompt),
      answers: acceptedAnswers(question.prompt, question.answers),
      choices: [],
      correct: [],
      explanation: correction(question.correction),
    }
  }
  const position = question.choices.indexOf(question.answer)
  if (position < 0) throw new Error(`Bonne réponse absente des choix\u00A0: ${question.prompt}`)
  return {
    prompt: typography(question.prompt),
    answers: [],
    choices: question.choices.map(typography),
    correct: [position],
    explanation: correction(question.correction),
  }
}

/** Ce que chaque exercice dit à l'élève avant ses questions, selon la façon de répondre. */
const HOW_TO_ANSWER = {
  qcm: 'Fais chaque calcul au brouillon, puis choisis ta réponse : une seule est juste par question.',
  exact:
    'Fais chaque calcul au brouillon, puis écris ta réponse : seulement le nombre demandé, sans unité ni phrase.',
} as const

const AFTERWARDS =
  'Une fois la quête validée, tu pourras lire la correction détaillée de chaque question.'

export interface ExerciseSource {
  /** Identifiant lisible : il figure dans l'adresse de l'écran et ne change plus ensuite. */
  id: string
  title: string
  theme: LibraryThemeId
  difficulty: QuestDifficulty
  /** Pour l'admin : ce que l'exercice fait travailler, en une ou deux phrases. */
  description: string
  /** Bref rappel du cours : les définitions et les formules dont l'exercice a besoin. */
  lesson: string
  /** Un exemple expliqué de la méthode (deux au plus), sur d'autres valeurs que celles des questions. */
  example: WorkedExample | readonly WorkedExample[]
  /** Consigne propre à l'exercice, si elle ajoute quelque chose à la consigne commune. */
  intro?: string
  /** Les questions, toutes du même genre : un QCM, ou des réponses à saisir. */
  questions: readonly Question[]
}

/** Construit l'exercice tel que l'application le sert : textes mis en forme, questions prêtes. */
export function defineExercise(source: ExerciseSource): Omit<LibraryExercise, 'itemCount'> {
  const kinds = new Set(source.questions.map((question) => question.kind))
  if (kinds.size !== 1) {
    throw new Error(
      `Un exercice est un QCM ou des réponses à saisir, pas les deux\u00A0: ${source.id}`,
    )
  }
  const format = source.questions[0]!.kind
  return {
    id: source.id,
    title: typography(source.title),
    theme: source.theme,
    level: '3e',
    description: typography(source.description),
    category: 'maths',
    format,
    difficulty: source.difficulty,
    lesson: typography(source.lesson),
    example: workedExample(source.example),
    instructions: typography(
      paragraphs(...(source.intro ? [source.intro] : []), HOW_TO_ANSWER[format], AFTERWARDS),
    ),
    items: source.questions.map(toItem),
  }
}
