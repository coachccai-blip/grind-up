import { describe, expect, it } from 'vitest'
import {
  defineExercise,
  exact,
  figure,
  paragraphs,
  qcm,
  workedExample,
} from '../../server/library/authoring.js'
import {
  defineFigure,
  drawing,
  escapeXml,
  frenchNumber,
  text,
  withUnit,
} from '../../server/library/figures/svg.js'
import { typography } from '../../server/library/typography.js'
import { figureLine, parseFigureLine, promptText, splitPrompt } from '../../shared/rules/figures.js'
import { parseRichText, richTextToPlainText } from '../../shared/rules/rich-text.js'

/** Illustrations : la syntaxe, les outils de rédaction et la typographie. */
const text1 = (value: string) => ({ type: 'text' as const, text: value })

describe('syntaxe des illustrations', () => {
  it('reconnaît une ligne seule « ![texte](figure:id) »', () => {
    expect(parseFigureLine('![Un carré découpé](figure:carre-somme)')).toEqual({
      id: 'carre-somme',
      alt: 'Un carré découpé',
    })
    expect(parseFigureLine('  ![](figure:decor-1)  ')).toEqual({ id: 'decor-1', alt: '' })
  })

  it('refuse un identifiant mal formé ou trop long, et une image extérieure', () => {
    for (const line of [
      '![x](figure:Carre)',
      '![x](figure:carre--somme)',
      '![x](figure:-carre)',
      '![x](figure:carre_somme)',
      '![x](figure:../secret)',
      `![x](figure:${'a'.repeat(81)})`,
      '![x](https://exemple.fr/image.svg)',
      'Voir ![x](figure:carre-somme)',
    ]) {
      expect(parseFigureLine(line), line).toBeNull()
    }
    expect(parseFigureLine(`![x](figure:${'a'.repeat(80)})`)).not.toBeNull()
  })

  it('écrit la ligne d’une illustration, et refuse ce qui la casserait', () => {
    expect(figureLine({ id: 'carre-somme', alt: ' Un carré ' })).toBe(
      '![Un carré](figure:carre-somme)',
    )
    expect(() => figureLine({ id: 'Carré', alt: 'x' })).toThrow()
    expect(() => figureLine({ id: 'carre', alt: 'a ] b' })).toThrow()
  })

  it('fait de l’illustration un bloc qui coupe le paragraphe ou la liste', () => {
    expect(
      parseRichText(
        'Avant\n![Un carré](figure:carre-somme)\nAprès\n- un\n![](figure:deco)\n- deux',
      ),
    ).toEqual([
      { type: 'paragraph', children: [text1('Avant')] },
      { type: 'figure', id: 'carre-somme', alt: 'Un carré' },
      { type: 'paragraph', children: [text1('Après')] },
      { type: 'list', ordered: false, items: [[text1('un')]] },
      { type: 'figure', id: 'deco', alt: '' },
      { type: 'list', ordered: false, items: [[text1('deux')]] },
    ])
  })

  it('laisse une référence au milieu d’une phrase telle quelle, en texte', () => {
    expect(parseRichText('Voir ![x](figure:carre) ici')).toEqual([
      { type: 'paragraph', children: [text1('Voir ![x](figure:carre) ici')] },
    ])
  })

  it('ne met pas les illustrations dans le texte brut', () => {
    expect(richTextToPlainText('Avant\n\n![Un carré](figure:carre-somme)\n\nAprès')).toBe(
      'Avant Après',
    )
  })
})

describe('énoncé illustré d’une question', () => {
  it('sépare le texte des illustrations qui le terminent', () => {
    expect(
      splitPrompt('Calcule BC.\n![Le triangle ABC](figure:triangle)\n![Le repère](figure:repere)'),
    ).toEqual({
      text: 'Calcule BC.',
      figures: [
        { id: 'triangle', alt: 'Le triangle ABC' },
        { id: 'repere', alt: 'Le repère' },
      ],
    })
    expect(splitPrompt('Combien font 12² ?')).toEqual({ text: 'Combien font 12² ?', figures: [] })
  })

  it('reconnaît encore l’illustration quand un champ d’une ligne a retiré le retour à la ligne', () => {
    expect(splitPrompt('Calcule BC.![Le triangle ABC](figure:triangle)')).toEqual({
      text: 'Calcule BC.',
      figures: [{ id: 'triangle', alt: 'Le triangle ABC' }],
    })
  })

  it('garde dans le texte une référence qui n’est pas à la fin', () => {
    expect(promptText('![a](figure:a) puis la question')).toBe('![a](figure:a) puis la question')
    expect(promptText('Calcule BC.\n![Le triangle](figure:triangle)')).toBe('Calcule BC.')
  })
})

describe('outils de rédaction : les illustrations', () => {
  const steps = [
    ['3 × 4 = 12', 'On multiplie.'],
    ['12 + 1 = 13', 'On ajoute.'],
  ] as const

  it('figure(id, alt) donne la ligne à passer à paragraphs(...)', () => {
    const lesson = paragraphs('Un rappel.', figure('carre-somme', 'Un carré de côté a + b'))
    expect(lesson).toBe('Un rappel.\n\n![Un carré de côté a + b](figure:carre-somme)')
  })

  it('place l’illustration d’un exemple juste après son énoncé', () => {
    const blocks = parseRichText(
      workedExample({
        statement: 'Calcule 3 × 4 + 1.',
        figure: { id: 'machine', alt: 'Une machine à calculer' },
        steps,
        conclusion: 'Le résultat est 13.',
      }),
    )
    expect(blocks.map((block) => block.type)).toEqual([
      'paragraph',
      'figure',
      'paragraph',
      'paragraph',
      'paragraph',
    ])
    expect(blocks[1]).toEqual({ type: 'figure', id: 'machine', alt: 'Une machine à calculer' })
  })

  it('ajoute l’illustration d’une question à la fin de son énoncé, jamais à sa correction', () => {
    const exercise = defineExercise({
      id: 'essai',
      title: 'Essai',
      theme: 'nombres',
      difficulty: 'easy',
      description: 'Un essai.',
      lesson: 'Un rappel.',
      example: { statement: 'Calcule 3 × 4 + 1.', steps, conclusion: 'Le résultat est 13.' },
      questions: [
        exact({
          prompt: 'Calcule la longueur BC, en cm.',
          figure: { id: 'triangle-abc', alt: 'Le triangle ABC, rectangle en B' },
          answers: ['5'],
          correction: { steps, mistake: 'Oublier la racine.' },
        }),
      ],
    })
    const [item] = exercise.items
    expect(item!.prompt).toBe(
      'Calcule la longueur BC, en cm.\n![Le triangle ABC, rectangle en B](figure:triangle-abc)',
    )
    expect(splitPrompt(item!.prompt).text).toBe('Calcule la longueur BC, en cm.')
    // Les réponses acceptées se lisent dans le texte seul de l'énoncé.
    expect(item!.answers).toEqual(['5', '5 cm'])
    expect(item!.explanation).not.toContain('figure:')
  })

  it('accepte une illustration dans un QCM', () => {
    const question = qcm({
      prompt: 'Quelle droite ?',
      figure: { id: 'repere', alt: 'Deux droites dans un repère' },
      choices: ['d', 'e'],
      answer: 'd',
      correction: { steps, traps: [['e', 'non.']] },
    })
    expect(question.figure).toEqual({ id: 'repere', alt: 'Deux droites dans un repère' })
  })
})

describe('typographie et illustrations', () => {
  it('ne touche qu’au texte alternatif d’une ligne d’illustration', () => {
    expect(typography("![L'aire vaut 4 cm - un carré : (a + b)](figure:x-2-carre-3)")).toBe(
      '![L’aire vaut 4\u00A0cm − un carré\u00A0: (a\u00A0+\u00A0b)](figure:x-2-carre-3)',
    )
  })

  it('laisse intact l’identifiant, même quand il ressemble à un calcul', () => {
    for (const id of ['moins-2', 'x-3', 'a-b-c', '10-000']) {
      expect(typography(`Texte ?\n![Figure](figure:${id})`)).toBe(
        `Texte\u00A0?\n![Figure](figure:${id})`,
      )
    }
  })
})

describe('outils de dessin', () => {
  it('écrit les nombres à la française, espace insécable en entité dans le fichier', () => {
    expect(frenchNumber(-3.5)).toBe('−3,5')
    expect(frenchNumber(2, 1)).toBe('2,0')
    expect(escapeXml(withUnit(3.5, 'cm'))).toBe('3,5&#160;cm')
    expect(text([0, 0], withUnit(6, 'cm'))).toContain('>6&#160;cm</text>')
    expect(text([0, 0], 'a < b & c')).toContain('>a &lt; b &amp; c</text>')
  })

  it('refuse un texte plus petit que 13', () => {
    expect(() => text([0, 0], 'petit', { size: 12 })).toThrow()
  })

  it('produit un SVG de 320 de large, sans fond', () => {
    const { svg } = defineFigure('essai', drawing(150, text([160, 75], 'Bonjour')))
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="320" height="150"/)
    expect(svg).toContain('viewBox="0 0 320 150"')
    expect(svg).not.toContain('<rect')
  })
})
