import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { correction, qcmQuestion } from '../../server/library/correction.js'
import { findLibraryExercise, listLibrary } from '../../server/library/index.js'
import { QUEST_DIFFICULTY_IDS } from '../../shared/rules/quests.js'
import { parseRichText, richTextToPlainText, type Inline } from '../../shared/rules/rich-text.js'
import type { LibraryExercise } from '../../shared/schemas/library.js'
import {
  EXPLANATION_MAX,
  normalizeQuestInput,
  publishProblems,
  questInputSchema,
  type QuestItemInput,
} from '../../shared/schemas/quests.js'
import { evaluate, sameExpression } from '../helpers/expressions.js'

/**
 * Le contenu de la bibliothèque est relu par ces tests comme le ferait un
 * correcteur : chaque exercice doit pouvoir devenir une quête, chaque bonne
 * réponse est recalculée, chaque ligne de calcul d'une correction aussi.
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

const boldText = (nodes: readonly Inline[]): string =>
  nodes.map((node) => (node.type === 'text' ? node.text : '')).join('')

/** Les lignes de calcul d'une correction : le texte en gras qui ouvre chaque étape. */
function calculationLines(explanation: string): string[] {
  return parseRichText(explanation).flatMap((block) => {
    if (block.type !== 'paragraph') return []
    const first = block.children[0]
    if (first?.type !== 'bold') return []
    const text = boldText(first.children)
    return text === 'Les pièges' || text.startsWith('Vérification') ? [] : [text]
  })
}

/** Les mauvais choix que la correction commente, dans la liste « Les pièges ». */
function commentedTraps(explanation: string): string[] {
  return parseRichText(explanation).flatMap((block) =>
    block.type === 'list'
      ? block.items.map((item) => (item[0]?.type === 'bold' ? boldText(item[0].children) : ''))
      : [],
  )
}

const rightChoice = (item: QuestItemInput) => item.choices[item.correct[0] ?? -1] ?? ''
const wrongChoices = (item: QuestItemInput) =>
  item.choices.filter((_, position) => !item.correct.includes(position))

describe('bibliothèque : forme des exercices', () => {
  it('propose l’exercice sur les identités remarquables, en deux quêtes', () => {
    expect(
      listLibrary().map(({ id, level, format, difficulty, itemCount }) => [
        id,
        level,
        format,
        difficulty,
        itemCount,
      ]),
    ).toEqual([
      ['identites-remarquables-cas-simples', '3e', 'qcm', 'easy', 6],
      ['identites-remarquables-cas-difficiles', '3e', 'qcm', 'hard', 8],
    ])
  })

  it('donne à chaque exercice un identifiant unique, lisible dans une adresse', () => {
    const ids = exercises.map((exercise) => exercise.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })

  it.each(exercises)('« $title » peut être publié tel quel comme une quête', (exercise) => {
    const request = questInputSchema.safeParse({
      title: exercise.title,
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
    expect(exercise.itemCount).toBe(exercise.items.length)
    expect(QUEST_DIFFICULTY_IDS).toContain(exercise.difficulty)
    expect(exercise.description.length).toBeGreaterThan(40)
  })

  it.each(questions)(
    '$name : quatre choix, une seule bonne réponse, une correction',
    ({ item }) => {
      expect(item.choices).toHaveLength(4)
      expect(item.correct).toHaveLength(1)
      expect(item.answers).toEqual([])
      expect(item.explanation.length).toBeGreaterThan(100)
      expect(item.explanation.length).toBeLessThanOrEqual(EXPLANATION_MAX)
      // Toute la mise en forme est comprise : aucun « ** » ne reste dans le texte affiché.
      expect(richTextToPlainText(item.explanation)).not.toContain('*')
      expect(calculationLines(item.explanation).length).toBeGreaterThanOrEqual(3)
      expect(item.explanation).toContain('**Vérification\u00A0:**')
    },
  )

  it.each(questions)('$name : la correction commente chaque mauvais choix', ({ item }) => {
    expect(commentedTraps(item.explanation).sort()).toEqual(wrongChoices(item).sort())
  })

  it.each(exercises)('« $title » : la bonne réponse change de place', (exercise) => {
    const positions = new Set(exercise.items.map((item) => item.correct[0]))
    expect(positions.size).toBeGreaterThanOrEqual(3)
    // Jamais trois fois de suite au même endroit.
    exercise.items.forEach((item, index) => {
      const [previous, before] = [exercise.items[index - 1], exercise.items[index - 2]]
      const repeated =
        previous?.correct[0] === item.correct[0] && before?.correct[0] === item.correct[0]
      expect(repeated, `question ${index + 1}`).toBe(false)
    })
  })
})

describe('bibliothèque : les calculs sont justes', () => {
  /** L'expression d'un énoncé « Développe et réduis A = … . » ou « Factorise A = … . ». */
  const stated = (prompt: string) =>
    /^(Développe et réduis|Factorise) (\p{Lu}) = (.+)\.$/u.exec(prompt)
  /** Le calcul d'un énoncé « Calcule … sans calculatrice ». */
  const mental = (prompt: string) => /^Calcule (.+) sans calculatrice/.exec(prompt)
  /** Le membre de gauche d'un énoncé « Résous l’équation … = 0. ». */
  const equation = (prompt: string) => /^Résous l’équation (.+) = 0\.$/.exec(prompt)

  it('reconnaît le genre de chaque question', () => {
    for (const { name, item } of questions) {
      const kinds = [stated(item.prompt), mental(item.prompt), equation(item.prompt)].filter(
        Boolean,
      )
      expect(kinds, name).toHaveLength(1)
    }
  })

  const algebra = questions.filter(({ item }) => stated(item.prompt))
  it.each(algebra)('$name : la bonne réponse est égale à l’expression de l’énoncé', ({ item }) => {
    const [, verb, , expression] = stated(item.prompt)!
    expect(sameExpression(rightChoice(item), expression!)).toBe(true)
    // Une forme développée n'a plus de parenthèses ; une forme factorisée en a.
    expect(rightChoice(item).includes('(')).toBe(verb === 'Factorise')
  })

  it.each(algebra)('$name : chaque mauvais choix est vraiment faux', ({ item }) => {
    const [, verb, , expression] = stated(item.prompt)!
    for (const choice of wrongChoices(item)) {
      const equal = sameExpression(choice, expression!)
      expect(equal, choice).not.toBeNull()
      // Seul piège égal à l'énoncé : une forme développée, quand il faut factoriser.
      if (equal) expect(verb === 'Factorise' && !choice.includes('('), choice).toBe(true)
    }
  })

  it.each(algebra)('$name : chaque ligne de la correction est une égalité vraie', ({ item }) => {
    const [, , letter, expression] = stated(item.prompt)!
    let checked = 0
    for (const line of calculationLines(item.explanation)) {
      for (const equality of line.split(' et ')) {
        const parts = equality.split(' = ')
        const readable = parts.filter((part) => evaluate(part, 1) !== null)
        for (const part of readable) {
          expect(sameExpression(part, readable[0]!), `${line} → ${part}`).toBe(true)
          // Une ligne « A = … » doit rester égale à l'expression de l'énoncé.
          if (parts[0] === letter) {
            expect(sameExpression(part, expression!), `${line} → ${part}`).toBe(true)
          }
          checked += 1
        }
      }
    }
    expect(checked).toBeGreaterThanOrEqual(3)
  })

  const mentalSums = questions.filter(({ item }) => mental(item.prompt))
  it.each(mentalSums)('$name : le résultat et chaque étape du calcul sont justes', ({ item }) => {
    const value = evaluate(mental(item.prompt)![1]!, 0)
    expect(value).not.toBeNull()
    expect(evaluate(rightChoice(item), 0)).toBe(value)
    for (const choice of wrongChoices(item)) {
      expect(evaluate(choice, 0), choice).not.toBeNull()
      expect(evaluate(choice, 0), choice).not.toBe(value)
    }
    const lines = calculationLines(item.explanation)
    expect(lines).toHaveLength(3)
    for (const line of lines) {
      for (const part of line.split(' = '))
        expect(evaluate(part, 0), `${line} → ${part}`).toBe(value)
    }
  })

  const equations = questions.filter(({ item }) => equation(item.prompt))
  it.each(equations)('$name : les solutions annulent l’équation, et elles seules', ({ item }) => {
    const left = equation(item.prompt)![1]!
    const solutions = (choice: string) =>
      choice.split(' ou ').map((part) => evaluate(part.replace(/^x = /, ''), 0))
    const roots = solutions(rightChoice(item))
    expect(roots).toHaveLength(2)
    // Math.abs : un produit nul peut valoir −0, qui est bien zéro.
    const at = (expression: string, x: number) => Math.abs(evaluate(expression, x) ?? Number.NaN)
    for (const root of roots) expect(at(left, root!), `x = ${root}`).toBe(0)
    expect(at(left, 0)).not.toBe(0)
    for (const choice of wrongChoices(item)) {
      expect([...solutions(choice)].sort(), choice).not.toEqual([...roots].sort())
    }
    // Chaque ligne « … = 0 » de la correction garde les mêmes solutions.
    const zeroLines = calculationLines(item.explanation).filter(
      (line) => line.endsWith(' = 0') && !line.includes(' ou '),
    )
    expect(zeroLines.length).toBeGreaterThanOrEqual(3)
    for (const line of zeroLines) {
      const expression = line.slice(0, -' = 0'.length)
      for (const root of roots) expect(at(expression, root!), line).toBe(0)
      expect(at(expression, 0), line).not.toBe(0)
    }
  })
})

describe('bibliothèque : les égalités écrites dans les phrases sont justes', () => {
  /** Le plus long calcul lisible à la fin d'un texte, en partant d'un début de mot. */
  function calculationBefore(text: string): string | null {
    const words = text.split(' ')
    for (let start = 0; start < words.length; start += 1) {
      const candidate = words.slice(start).join(' ')
      if (evaluate(candidate, 1) !== null) return candidate
    }
    return null
  }

  /** Le plus long calcul lisible au début d'un texte, jusqu'à une fin de mot. */
  function calculationAfter(text: string): string | null {
    const words = text.split(' ')
    for (let end = words.length; end > 0; end -= 1) {
      const candidate = words
        .slice(0, end)
        .join(' ')
        .replace(/[\s.,;:!?]+$/u, '')
      if (evaluate(candidate, 1) !== null) return candidate
    }
    return null
  }

  /** Pour chaque signe égal d'une phrase, les deux calculs qu'il relie, s'ils se lisent. */
  function equalitiesIn(sentence: string): [string, string][] {
    const pairs: [string, string][] = []
    for (
      let index = sentence.indexOf(' = ');
      index >= 0;
      index = sentence.indexOf(' = ', index + 1)
    ) {
      const left = calculationBefore(sentence.slice(0, index))
      const right = calculationAfter(sentence.slice(index + 3))
      if (left !== null && right !== null) pairs.push([left, right])
    }
    return pairs
  }

  it('retrouve les égalités d’une phrase', () => {
    expect(equalitiesIn('On calcule\u00A0: (3x)² = 3² × x² = 9x², puis 4² = 16.')).toEqual([
      ['(3x)²', '3² × x²'],
      ['3² × x²', '9x²'],
      ['4²', '16'],
    ])
    expect(equalitiesIn('avec a = x et b = 3')).toEqual([])
  })

  /** Les égalités d'une correction qui doivent être vraies pour tout x, ou entre nombres. */
  const identitiesOf = (item: QuestItemInput) =>
    item.explanation
      .replaceAll('**', '')
      .split('\n')
      .flatMap(equalitiesIn)
      // Une valeur donnée à x (« pour x = 1 ») ou une équation (« x + 3 = 0 ») n'est pas une identité.
      .filter(([left, right]) => left.includes('x') === right.includes('x'))

  it.each(questions)('$name : chaque égalité de la correction est vraie', ({ item }) => {
    const identities = identitiesOf(item)
    expect(identities.length).toBeGreaterThanOrEqual(1)
    for (const [left, right] of identities) {
      expect(sameExpression(left, right), `${left} = ${right}`).toBe(true)
    }
  })

  it('relit bien les égalités : plus de soixante sur l’ensemble des corrections', () => {
    const total = questions.reduce((count, { item }) => count + identitiesOf(item).length, 0)
    expect(total).toBeGreaterThan(60)
  })
})

describe('bibliothèque : typographie et confidentialité', () => {
  const texts = exercises.flatMap((exercise) => [
    exercise.title,
    exercise.description,
    exercise.instructions,
    ...exercise.items.flatMap((item) => [item.prompt, ...item.choices, item.explanation]),
  ])

  it('suit la typographie française de l’application', () => {
    for (const text of texts) {
      // Espace insécable devant « : », « ; », « ! » et « ? ».
      expect(text).not.toMatch(/[\p{L}\p{N}»)’}%] [!?;:](?=\s|$)/u)
      // Apostrophe typographique.
      expect(text).not.toMatch(/\p{L}'\p{L}/u)
    }
  })

  it('écrit les calculs avec le signe moins et le signe de multiplication', () => {
    for (const text of texts) {
      for (const line of text.split('\n')) {
        // Le tiret ne sert qu'à ouvrir une ligne de liste.
        expect(line.replace(/^- /, ''), line).not.toMatch(/-/)
        expect(line, line).not.toMatch(/\d ?\* ?\d|\d x \d/)
      }
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

describe('bibliothèque : outils de rédaction', () => {
  it('met une correction en forme : calculs en gras, pièges en liste, vérification', () => {
    const text = correction({
      steps: [
        ['A = (x + 1)²', 'Carré d’une somme.'],
        ['A = x² + 2x + 1', 'On calcule.'],
      ],
      traps: [['x² + 1', 'double produit oublié.']],
      check: 'pour x = 1, 4 = 4.',
    })
    expect(text).toBe(
      [
        '**A = (x + 1)²**\nCarré d’une somme.',
        '**A = x² + 2x + 1**\nOn calcule.',
        '**Les pièges**\n- **x² + 1**\u00A0: double produit oublié.',
        '**Vérification\u00A0:** pour x = 1, 4 = 4.',
      ].join('\n\n'),
    )
    expect(parseRichText(text).map((block) => block.type)).toEqual([
      'paragraph',
      'paragraph',
      'paragraph',
      'list',
      'paragraph',
    ])
  })

  it('désigne la bonne réponse d’un QCM par son texte', () => {
    const item = qcmQuestion({
      prompt: 'Combien font 2 + 2 ?',
      choices: ['3', '4', '5'],
      answer: '4',
      correction: { steps: [['2 + 2 = 4', 'On compte.']] },
    })
    expect(item).toMatchObject({ choices: ['3', '4', '5'], correct: [1], answers: [] })
    expect(() =>
      qcmQuestion({
        prompt: 'Sans bonne réponse',
        choices: ['1'],
        answer: '2',
        correction: { steps: [] },
      }),
    ).toThrow(/Bonne réponse absente/)
  })
})
