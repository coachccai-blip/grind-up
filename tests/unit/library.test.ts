import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { findLibraryExercise, listLibrary, listLibraryThemes } from '../../server/library/index.js'
import { LIBRARY_THEMES } from '../../server/library/themes.js'
import { answerKey } from '../../shared/rules/answers.js'
import { QUEST_DIFFICULTY_IDS } from '../../shared/rules/quests.js'
import { parseFigureLine } from '../../shared/rules/figures.js'
import { parseRichText, richTextToPlainText, type Inline } from '../../shared/rules/rich-text.js'
import type { LibraryExercise } from '../../shared/schemas/library.js'
import {
  ANSWER_MAX,
  EXPLANATION_MAX,
  ITEM_PROMPT_MAX,
  MAX_ACCEPTED_ANSWERS,
  normalizeQuestInput,
  publishProblems,
  QUEST_TITLE_MAX,
  questInputSchema,
  type QuestItemInput,
} from '../../shared/schemas/quests.js'
import { wrongEqualities } from '../helpers/equalities.js'

/**
 * Tout exercice de la bibliothèque est relu par ces tests comme le ferait un
 * correcteur. Il doit suivre le plan commun (rappel du cours, exemple expliqué,
 * questions, correction détaillée de chacune), pouvoir devenir une quête telle
 * quelle, et ne contenir que des égalités justes : chaque calcul qui se lit est
 * recalculé.
 */
const projectRoot = fileURLToPath(new URL('../..', import.meta.url))

const exercises: LibraryExercise[] = listLibrary().map(({ id }) => {
  const exercise = findLibraryExercise(id)
  if (!exercise) throw new Error(`Exercice introuvable\u00A0: ${id}`)
  return exercise
})

/** Toutes les questions, avec de quoi les nommer dans un message d'échec. */
const questions = exercises.flatMap((exercise) =>
  exercise.items.map((item, index) => ({
    name: `${exercise.id}, question ${index + 1}`,
    exercise,
    item,
  })),
)

/** Le même texte avec des espaces ordinaires, pour comparer deux écritures d'une réponse. */
const plain = (text: string) => text.replace(/[\u00A0\u202F]/g, ' ')

const boldText = (nodes: readonly Inline[]): string =>
  nodes.map((node) => (node.type === 'text' ? node.text : '')).join('')

/** Titres en gras qui structurent un texte, sans être des lignes de calcul. */
const LABELS = /^(Les pièges|Vérification|Erreur à éviter|Énoncé|Conclusion|Exemple \d)/

/** Les lignes de calcul d'un texte : le gras qui ouvre chaque étape. */
function calculationLines(text: string): string[] {
  return parseRichText(text).flatMap((block) => {
    if (block.type !== 'paragraph') return []
    const first = block.children[0]
    if (first?.type !== 'bold') return []
    const line = boldText(first.children)
    return LABELS.test(line) ? [] : [line]
  })
}

/** La résolution d'une correction : tout ce qui précède les pièges, l'erreur à éviter et la vérification. */
const resolution = (explanation: string) =>
  explanation.split(/\n\n\*\*(?:Les pièges|Erreur à éviter|Vérification)/)[0] ?? ''

/** Les mauvais choix que la correction commente, dans la liste « Les pièges ». */
function commentedTraps(explanation: string): string[] {
  return parseRichText(explanation).flatMap((block) =>
    block.type === 'list'
      ? block.items.map((item) => (item[0]?.type === 'bold' ? boldText(item[0].children) : ''))
      : [],
  )
}

/**
 * Le texte sans ses lignes d'illustration : les longueurs mesurent ce que l'élève
 * lit, pas les références aux figures (qui ont leur propre test, library-figures).
 */
const withoutFigures = (text: string) =>
  text
    .split('\n')
    .filter((line) => parseFigureLine(line) === null)
    .join('\n')

/** Une ligne telle qu'elle se lit : d'une ligne d'illustration, seul compte son texte alternatif. */
const readable = (line: string) => parseFigureLine(line)?.alt ?? line

const rightChoice = (item: QuestItemInput) => item.choices[item.correct[0] ?? -1] ?? ''
const wrongChoices = (item: QuestItemInput) =>
  item.choices.filter((_, position) => !item.correct.includes(position))

/** Tout ce que lit l'élève dans un exercice. */
const studentTexts = (exercise: LibraryExercise) => [
  exercise.title,
  exercise.lesson,
  exercise.example,
  exercise.instructions,
  ...exercise.items.flatMap((item) => [item.prompt, ...item.choices, item.explanation]),
]

describe('bibliothèque : catalogue', () => {
  it('range les exercices par thème, dans l’ordre du programme', () => {
    const order = LIBRARY_THEMES.map((theme) => theme.id as string)
    const used = listLibraryThemes().map((theme) => theme.id)
    expect(used).toEqual(order.filter((id) => used.includes(id)))
    const positions = exercises.map((exercise) => order.indexOf(exercise.theme))
    expect(positions).not.toContain(-1)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  it('donne à chaque exercice un identifiant et un titre uniques', () => {
    const ids = exercises.map((exercise) => exercise.id)
    const titles = exercises.map((exercise) => exercise.title)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(titles).size).toBe(titles.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    for (const title of titles) expect(title.length, title).toBeLessThanOrEqual(QUEST_TITLE_MAX)
  })

  it('présente les exercices sans leur contenu', () => {
    for (const summary of listLibrary()) {
      expect(Object.keys(summary).sort()).toEqual([
        'category',
        'description',
        'difficulty',
        'figure',
        'format',
        'id',
        'itemCount',
        'level',
        'theme',
        'title',
      ])
    }
  })

  it('ne figure pas dans le code envoyé au navigateur', () => {
    const filesUnder = (directory: string): string[] =>
      readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name)
        return entry.isDirectory() ? filesUnder(path) : [path]
      })
    const markers = ['Les pièges', ...exercises.map((exercise) => exercise.id)]
    const leaks = ['src', 'shared']
      .flatMap((directory) => filesUnder(join(projectRoot, directory)))
      .filter((file) => /\.(ts|tsx|css|json)$/.test(file))
      .filter((file) => {
        const source = readFileSync(file, 'utf8')
        return markers.some((marker) => source.includes(marker))
      })
      .map((file) => relative(projectRoot, file))
    expect(leaks).toEqual([])
  })
})

describe.each(exercises)('bibliothèque : « $title »', (exercise) => {
  it('se présente à l’admin : niveau, difficulté, description', () => {
    expect(exercise).toMatchObject({ level: '3e', category: 'maths' })
    expect(['qcm', 'exact']).toContain(exercise.format)
    expect(QUEST_DIFFICULTY_IDS).toContain(exercise.difficulty)
    expect(exercise.description.length).toBeGreaterThanOrEqual(60)
    expect(exercise.description.length).toBeLessThanOrEqual(260)
    expect(exercise.itemCount).toBe(exercise.items.length)
  })

  it('commence par un bref rappel du cours', () => {
    expect(withoutFigures(exercise.lesson).length).toBeGreaterThanOrEqual(150)
    expect(withoutFigures(exercise.lesson).length).toBeLessThanOrEqual(1600)
    expect(richTextToPlainText(exercise.lesson)).not.toContain('*')
  })

  it('montre la méthode sur un exemple expliqué, différent des questions', () => {
    expect(exercise.example).toContain('**Énoncé\u00A0:**')
    expect(exercise.example).toContain('**Conclusion\u00A0:**')
    expect(calculationLines(exercise.example).length).toBeGreaterThanOrEqual(2)
    expect(withoutFigures(exercise.example).length).toBeGreaterThanOrEqual(300)
    expect(withoutFigures(exercise.example).length).toBeLessThanOrEqual(3200)
    expect(richTextToPlainText(exercise.example)).not.toContain('*')
    for (const item of exercise.items) expect(exercise.example).not.toContain(item.prompt)
  })

  it('dit comment répondre, et annonce la correction détaillée', () => {
    expect(exercise.instructions).toContain(
      exercise.format === 'qcm'
        ? 'une seule est juste par question'
        : 'seulement le nombre demandé',
    )
    expect(exercise.instructions).toContain('correction détaillée')
  })

  it('pose de 5 à 8 questions, toutes différentes', () => {
    expect(exercise.items.length).toBeGreaterThanOrEqual(5)
    expect(exercise.items.length).toBeLessThanOrEqual(8)
    const prompts = exercise.items.map((item) => item.prompt)
    expect(new Set(prompts).size).toBe(prompts.length)
  })

  it('peut être publié tel quel comme une quête', () => {
    const request = questInputSchema.safeParse({
      title: exercise.title,
      lesson: exercise.lesson,
      example: exercise.example,
      instructions: exercise.instructions,
      category: exercise.category,
      format: exercise.format,
      difficulty: exercise.difficulty,
      rewardXp: 100,
      items: exercise.items,
      assignees: 'all',
    })
    expect(request.error?.issues ?? []).toEqual([])
    if (!request.success) return

    const quest = normalizeQuestInput(request.data)
    expect(publishProblems(quest, new Date())).toEqual({})
    // Rien à retoucher à l'enregistrement : ni espace en trop, ni choix vide.
    expect(quest.items).toEqual(exercise.items)
    expect(quest.lesson).toBe(exercise.lesson)
    expect(quest.example).toBe(exercise.example)
  })

  it('ne contient que des égalités justes : chaque calcul qui se lit est recalculé', () => {
    expect(wrongEqualities(exercise.lesson), 'rappel du cours').toEqual([])
    expect(wrongEqualities(exercise.example), 'exemple expliqué').toEqual([])
    exercise.items.forEach((item, index) => {
      expect(wrongEqualities(item.explanation), `correction ${index + 1}`).toEqual([])
    })
  })

  it('suit la typographie française de l’application', () => {
    for (const text of [exercise.description, ...studentTexts(exercise)]) {
      for (const line of text.split('\n').map(readable)) {
        // Espace insécable devant « : », « ; », « ! » et « ? ».
        expect(line, line).not.toMatch(/[\p{L}\p{N}»)’}%*] [!?;:](?=\s|\*|$)/u)
        // Apostrophe typographique.
        expect(line, line).not.toMatch(/\p{L}'\p{L}/u)
        // Un nombre et son unité ne se séparent pas.
        expect(line, line).not.toMatch(
          /\d (?:cm|mm|dm|km|m|kg|g|L|mL|cL|h|min|s|€|%|°)(?![\p{L}\p{N}])/u,
        )
        // Signe moins et signe de multiplication : un tiret ne sert qu'aux mots composés et aux listes.
        expect(line.replace(/^- /, ''), line).not.toMatch(/(?<!\p{L})-|-(?!\p{L})/u)
        expect(line, line).not.toMatch(/\d ?x ?\d|\d ?\* ?\d/)
      }
    }
  })

  it('tutoie l’élève', () => {
    for (const text of studentTexts(exercise)) {
      expect(text, text).not.toMatch(
        /\b(vous|votre|vos|calculez|développez|factorisez|résolvez)\b/i,
      )
    }
  })

  if (exercise.format === 'qcm') {
    it('change la bonne réponse de place d’une question à l’autre', () => {
      const positions = exercise.items.map((item) => item.correct[0])
      expect(new Set(positions).size).toBeGreaterThanOrEqual(3)
      // Jamais trois fois de suite au même endroit.
      positions.forEach((position, index) => {
        const repeated = positions[index - 1] === position && positions[index - 2] === position
        expect(repeated, `question ${index + 1}`).toBe(false)
      })
    })
  }
})

describe('bibliothèque : chaque question', () => {
  it.each(questions)('$name : un énoncé, et une correction détaillée qui se lit', ({ item }) => {
    expect(item.prompt.length).toBeGreaterThanOrEqual(10)
    expect(item.prompt.length).toBeLessThanOrEqual(ITEM_PROMPT_MAX)
    expect(item.explanation.length).toBeGreaterThanOrEqual(150)
    expect(item.explanation.length).toBeLessThanOrEqual(EXPLANATION_MAX)
    expect(calculationLines(item.explanation).length).toBeGreaterThanOrEqual(2)
    // Toute la mise en forme est comprise : aucun « ** » ne reste dans le texte affiché.
    expect(richTextToPlainText(item.explanation)).not.toContain('*')
  })

  const qcmQuestions = questions.filter(({ exercise }) => exercise.format === 'qcm')
  it.each(qcmQuestions)('$name : trois ou quatre choix distincts, un seul juste', ({ item }) => {
    expect(item.choices.length).toBeGreaterThanOrEqual(3)
    expect(item.choices.length).toBeLessThanOrEqual(4)
    expect(item.correct).toHaveLength(1)
    expect(item.answers).toEqual([])
    expect(new Set(item.choices.map(answerKey)).size).toBe(item.choices.length)
    for (const choice of item.choices) expect(choice.length).toBeLessThanOrEqual(ANSWER_MAX)
  })

  it.each(qcmQuestions)('$name : la correction mène à la bonne réponse', ({ item }) => {
    expect(plain(resolution(item.explanation))).toContain(plain(rightChoice(item)))
  })

  it.each(qcmQuestions)('$name : la correction commente chaque mauvais choix', ({ item }) => {
    expect(commentedTraps(item.explanation).sort()).toEqual(wrongChoices(item).sort())
  })

  const typedQuestions = questions.filter(({ exercise }) => exercise.format === 'exact')
  it.each(typedQuestions)('$name : la réponse attendue est celle de la correction', ({ item }) => {
    expect(item.answers.length).toBeGreaterThanOrEqual(1)
    expect(item.answers.length).toBeLessThanOrEqual(MAX_ACCEPTED_ANSWERS)
    expect(item.choices).toEqual([])
    // Sans tenir compte des majuscules : « Oui : … » répond bien « oui ».
    expect(plain(resolution(item.explanation)).toLowerCase()).toContain(
      plain(item.answers[0]!).toLowerCase(),
    )
    expect(item.explanation).toContain('**Erreur à éviter\u00A0:**')
  })
})
