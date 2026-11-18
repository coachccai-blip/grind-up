import { describe, expect, it } from 'vitest'
import { findLibraryExercise } from '../../server/library/index.js'
import { parseRichText, type Inline } from '../../shared/rules/rich-text.js'
import type { QuestItemInput } from '../../shared/schemas/quests.js'
import { evaluate, sameExpression } from '../helpers/expressions.js'

/**
 * Identités remarquables : en plus de la relecture commune à tous les
 * exercices, chaque énoncé est recalculé. La bonne réponse doit être égale à
 * l'expression de l'énoncé, chaque mauvais choix doit être vraiment faux, et
 * chaque ligne « A = … » d'une correction doit rester égale à A.
 */
const exercises = [
  'identites-remarquables-cas-simples',
  'identites-remarquables-cas-difficiles',
].map((id) => {
  const exercise = findLibraryExercise(id)
  if (!exercise) throw new Error(`Exercice introuvable\u00A0: ${id}`)
  return exercise
})

const questions = exercises.flatMap((exercise) =>
  exercise.items.map((item, index) => ({ name: `${exercise.id}, question ${index + 1}`, item })),
)

const boldText = (nodes: readonly Inline[]): string =>
  nodes.map((node) => (node.type === 'text' ? node.text : '')).join('')

/** Les lignes de calcul d'une correction : le gras qui ouvre chaque étape. */
function calculationLines(explanation: string): string[] {
  return parseRichText(explanation).flatMap((block) => {
    if (block.type !== 'paragraph') return []
    const first = block.children[0]
    if (first?.type !== 'bold') return []
    const text = boldText(first.children)
    return text === 'Les pièges' || text.startsWith('Vérification') ? [] : [text]
  })
}

const rightChoice = (item: QuestItemInput) => item.choices[item.correct[0] ?? -1] ?? ''
const wrongChoices = (item: QuestItemInput) =>
  item.choices.filter((_, position) => !item.correct.includes(position))

/** L'expression d'un énoncé « Développe et réduis A = … . » ou « Factorise A = … . ». */
const stated = (prompt: string) =>
  /^(Développe et réduis|Factorise) (\p{Lu}) = (.+)\.$/u.exec(prompt)
/** Le calcul d'un énoncé « Calcule … sans calculatrice ». */
const mental = (prompt: string) => /^Calcule (.+) sans calculatrice/.exec(prompt)
/** Le membre de gauche d'un énoncé « Résous l’équation … = 0. ». */
const equation = (prompt: string) => /^Résous l’équation (.+) = 0\.$/.exec(prompt)

describe('identités remarquables : les calculs sont justes', () => {
  it('propose six cas simples et huit cas difficiles', () => {
    expect(
      exercises.map(({ difficulty, itemCount, theme }) => [difficulty, itemCount, theme]),
    ).toEqual([
      ['easy', 6, 'calcul-litteral'],
      ['hard', 8, 'calcul-litteral'],
    ])
  })

  it('reconnaît le genre de chaque question', () => {
    for (const { name, item } of questions) {
      const kinds = [stated(item.prompt), mental(item.prompt), equation(item.prompt)].filter(
        Boolean,
      )
      expect(kinds, name).toHaveLength(1)
      expect(item.choices).toHaveLength(4)
      expect(item.explanation).toContain('**Vérification\u00A0:**')
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

  it.each(algebra)('$name : chaque ligne de la correction reste égale à l’énoncé', ({ item }) => {
    const [, , letter, expression] = stated(item.prompt)!
    let checked = 0
    for (const line of calculationLines(item.explanation)) {
      const parts = line.split(' = ')
      if (parts[0] !== letter) continue
      for (const part of parts.slice(1)) {
        expect(sameExpression(part, expression!), `${line} → ${part}`).toBe(true)
        checked += 1
      }
    }
    expect(checked).toBeGreaterThanOrEqual(2)
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
  })
})
