import { describe, expect, it } from 'vitest'
import {
  correction,
  defineExercise,
  exact,
  paragraphs,
  qcm,
  workedExample,
  type ExerciseSource,
} from '../../server/library/authoring.js'
import { typography } from '../../server/library/typography.js'
import { parseRichText } from '../../shared/rules/rich-text.js'
import { equalitiesIn, statedValues, wrongEqualities } from '../helpers/equalities.js'
import { evaluate, roundsTo, sameExpression } from '../helpers/expressions.js'

/** Outils de rédaction de la bibliothèque, et outils qui en relisent le contenu. */
describe('typographie des exercices', () => {
  it('pose l’espace insécable devant les signes doubles et dans les guillemets', () => {
    expect(typography('On calcule : 3 + 4 = 7 ; puis on vérifie ! Vrai ?')).toBe(
      'On calcule\u00A0: 3 + 4 = 7\u00A0; puis on vérifie\u00A0! Vrai\u00A0?',
    )
    expect(typography('**Vérification :** le mot « somme »')).toBe(
      '**Vérification\u00A0:** le mot «\u00A0somme\u00A0»',
    )
  })

  it('ne sépare pas un nombre de son unité, ni les milliers', () => {
    expect(typography('5 cm, 12 km/h, 30 %, 2 h 30 min, 9 cm², 40 °')).toBe(
      '5\u00A0cm, 12\u00A0km/h, 30\u00A0%, 2\u00A0h 30\u00A0min, 9\u00A0cm², 40\u00A0°',
    )
    expect(typography('10 000 + 600 = 10 600 et 1 000 000')).toBe(
      '10\u202F000 + 600 = 10\u202F600 et 1\u202F000\u202F000',
    )
    expect(typography('V = 75π cm³, soit 236 cm³')).toBe('V = 75π\u00A0cm³, soit 236\u00A0cm³')
    expect(typography('augmenter de t % ; un taux en %')).toBe(
      'augmenter de t\u00A0%\u00A0; un taux en\u00A0%',
    )
    // Une liste de valeurs n'est pas un grand nombre.
    expect(typography('Notes : 8 ; 12 ; 15')).toBe('Notes\u00A0: 8\u00A0; 12\u00A0; 15')
  })

  it('écrit le signe moins des calculs et garde les tirets des mots et des listes', () => {
    expect(typography('x - 3 = -5 et (-4)² = 16')).toBe('x − 3 = −5 et (−4)² = 16')
    expect(typography('- un tiret de liste\n- c’est-à-dire le sens anti-horaire')).toBe(
      '- un tiret de liste\n- c’est-à-dire le sens anti-horaire',
    )
  })

  it('met l’apostrophe typographique et garde une parenthèse courte sur une ligne', () => {
    expect(typography("L'aire d'un carré")).toBe('L’aire d’un carré')
    expect(typography('C = (x + 4)(x − 4)')).toBe('C = (x\u00A0+\u00A04)(x\u00A0−\u00A04)')
  })

  it('ne change rien à un texte déjà mis en forme', () => {
    const text = 'On calcule\u00A0: 5\u00A0cm × 2 = 10\u00A0cm, soit 10\u202F000\u00A0µm\u00A0!'
    expect(typography(typography(text))).toBe(typography(text))
  })
})

describe('outils de rédaction', () => {
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
        '**A = (x\u00A0+\u00A01)²**\nCarré d’une somme.',
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

  it('signale l’erreur à éviter d’une réponse à saisir', () => {
    expect(correction({ steps: [['2 + 2 = 4', 'On compte.']], mistake: 'répondre 5.' })).toBe(
      '**2 + 2 = 4**\nOn compte.\n\n**Erreur à éviter\u00A0:** répondre 5.',
    )
  })

  it('met un exemple en forme : énoncé, méthode, conclusion ; deux exemples sont numérotés', () => {
    const one = {
      statement: 'Calcule 2 + 3.',
      steps: [['2 + 3 = 5', 'On ajoute.']],
      conclusion: '5.',
    } as const
    expect(workedExample(one)).toBe(
      '**Énoncé\u00A0:** Calcule 2 + 3.\n\n**2 + 3 = 5**\nOn ajoute.\n\n**Conclusion\u00A0:** 5.',
    )
    expect(workedExample([one, one])).toContain('**Exemple 2**')
  })

  const source: ExerciseSource = {
    id: 'essai',
    title: 'Essai : un titre',
    theme: 'nombres',
    difficulty: 'easy',
    description: 'Un exercice pour les tests.',
    lesson: paragraphs('Un rappel.', '- une ligne\n- une autre'),
    example: {
      statement: 'Calcule 1 + 1.',
      steps: [['1 + 1 = 2', 'On ajoute.']],
      conclusion: '2.',
    },
    questions: [
      qcm({
        prompt: 'Combien font 2 + 2 ?',
        choices: ['3', '4', '5'],
        answer: '4',
        correction: { steps: [['2 + 2 = 4', 'On compte.']] },
      }),
    ],
  }

  it('construit un exercice : format, consigne commune, bonne réponse désignée par son texte', () => {
    const exercise = defineExercise(source)
    expect(exercise).toMatchObject({
      id: 'essai',
      title: 'Essai\u00A0: un titre',
      level: '3e',
      category: 'maths',
      format: 'qcm',
      lesson: 'Un rappel.\n\n- une ligne\n- une autre',
    })
    expect(exercise.items[0]).toMatchObject({
      prompt: 'Combien font 2 + 2\u00A0?',
      choices: ['3', '4', '5'],
      correct: [1],
      answers: [],
    })
    expect(exercise.instructions).toContain('une seule est juste par question')
    expect(exercise.instructions).toContain('correction détaillée')
  })

  it('accepte des réponses à saisir, mais pas un mélange des deux genres', () => {
    const typed = exact({
      prompt: 'Combien font 2 + 2 ?',
      answers: ['4'],
      correction: { steps: [['2 + 2 = 4', 'On compte.']] },
    })
    const exercise = defineExercise({ ...source, questions: [typed] })
    expect(exercise.format).toBe('exact')
    expect(exercise.items[0]).toMatchObject({ answers: ['4'], choices: [], correct: [] })
    // L'unité que demande l'énoncé peut accompagner le nombre : la réponse reste juste.
    const answersTo = (prompt: string, answers: string[]) =>
      defineExercise({
        ...source,
        questions: [exact({ prompt, answers, correction: { steps: [] } })],
      }).items[0]?.answers
    expect(answersTo('Calcule BC, en cm, arrondi au dixième.', ['7,2'])).toEqual(['7,2', '7,2 cm'])
    expect(answersTo('Un train roule à 90 km/h. Calcule la durée, en minutes.', ['40'])).toEqual([
      '40',
      '40 min',
      '40 minutes',
    ])
    expect(answersTo('Quel est le prix, en euros ?', ['45', '45,00'])).toEqual([
      '45',
      '45,00',
      '45 €',
      '45,00 €',
      '45 euros',
    ])
    expect(answersTo('Calcule l’angle, en degrés.', ['53'])).toEqual(['53', '53 °', '53 degrés'])
    expect(answersTo('Calcule la température moyenne, en °C.', ['15'])).toEqual([
      '15',
      '15 °C',
      '15 °',
    ])
    // Ce que l'on compte, ou l'inconnue de l'énoncé, peuvent aussi accompagner le nombre.
    expect(answersTo('Pour combien de séances les deux tarifs sont-ils égaux ?', ['12'])).toEqual([
      '12',
      '12 séances',
    ])
    expect(answersTo('Dans combien d’années sera-t-il deux fois plus âgé ?', ['16'])).toEqual([
      '16',
      '16 ans',
      '16 années',
    ])
    expect(answersTo('Résous l’équation 3x + 5 = 29.', ['8'])).toEqual(['8', 'x = 8'])
    expect(answersTo('Combien de temps dure le trajet, en minutes ?', ['40'])).toEqual([
      '40',
      '40 min',
      '40 minutes',
    ])
    expect(
      answersTo('Est-il rectangle, en comptant en cm ? Réponds par oui ou par non.', ['oui']),
    ).toEqual(['oui'])
    expect(exercise.instructions).toContain('seulement le nombre demandé')
    expect(() => defineExercise({ ...source, questions: [typed, ...source.questions] })).toThrow(
      /pas les deux/,
    )
    expect(() =>
      defineExercise({
        ...source,
        questions: [
          qcm({
            prompt: 'Sans bonne réponse',
            choices: ['1'],
            answer: '2',
            correction: { steps: [] },
          }),
        ],
      }),
    ).toThrow(/Bonne réponse absente/)
  })
})

describe('recalcul des expressions', () => {
  it('lit les calculs de collège', () => {
    expect(evaluate('(x + 3)²', 1)).toBe(16)
    expect(evaluate('−x² + 25', 2)).toBe(21)
    expect(evaluate('(3x)² − 2 × 3x × 4 + 4²', 2)).toBe(4)
    expect(evaluate('1² − 6 × (−4)', 0)).toBe(25)
    expect(evaluate('10 000 + 600 + 9', 0)).toBe(10609)
    expect(evaluate('2 × −3', 0)).toBe(-6)
    expect(evaluate('3,5 × 2', 0)).toBe(7)
  })

  it('lit les fractions, les puissances, les racines et les pourcentages', () => {
    expect(evaluate('2/3 + 1/4', 0)).toBeCloseTo(11 / 12, 12)
    expect(evaluate('5/6 ÷ 2/3', 0)).toBeCloseTo(1.25, 12)
    expect(evaluate('(8 + 12 + 10) ÷ 3', 0)).toBe(10)
    expect(evaluate('2³ × 2⁴', 0)).toBe(128)
    expect(evaluate('4,2 × 10⁻⁴', 0)).toBeCloseTo(0.00042, 12)
    expect(evaluate('√(9 + 16)', 0)).toBe(5)
    expect(evaluate('2√3', 0)).toBeCloseTo(2 * Math.sqrt(3), 12)
    expect(evaluate('20 % × 150', 0)).toBeCloseTo(30, 12)
    expect(evaluate('4/3 × π × 3³', 0)).toBeCloseTo(36 * Math.PI, 9)
  })

  it('lit la trigonométrie en degrés', () => {
    expect(evaluate('cos(60°)', 0)).toBeCloseTo(0.5, 12)
    expect(evaluate('8 × sin(30°)', 0)).toBeCloseTo(4, 12)
    expect(evaluate('arctan(1)', 0)).toBeCloseTo(45, 12)
  })

  it('ne lit pas une phrase, une autre lettre ou une unité', () => {
    for (const text of ['2ab', 'AB', '5 cm', 'x +', '', 'la moitié', '3 = 3']) {
      expect(evaluate(text, 1), text).toBeNull()
    }
  })

  it('compare deux expressions et contrôle un arrondi', () => {
    expect(sameExpression('(x + 7)(x − 1)', 'x² + 6x − 7')).toBe(true)
    expect(sameExpression('(x + 7)(x + 1)', 'x² + 6x − 7')).toBe(false)
    expect(sameExpression('a²', 'x²')).toBeNull()
    expect(roundsTo('√52', '7,2')).toBe(true)
    expect(roundsTo('√52', '7,3')).toBe(false)
    expect(roundsTo('5 × cos(40°)', '3,8')).toBe(true)
    expect(roundsTo('arccos(0,6)', '53°')).toBe(true)
    expect(roundsTo('1/3', '0,33')).toBe(true)
    expect(roundsTo('2/3', '0,66')).toBe(false)
  })
})

describe('relecture des égalités d’un texte', () => {
  it('retrouve les calculs de part et d’autre de chaque signe égal', () => {
    expect(equalitiesIn('On calcule\u00A0: (3x)² = 3² × x² = 9x², puis 4² = 16.')).toEqual([
      { left: '(3x)²', right: '3² × x²', approximate: false },
      { left: '3² × x²', right: '9x²', approximate: false },
      { left: '4²', right: '16', approximate: false },
    ])
    expect(equalitiesIn('BC = √52 ≈ 7,2\u00A0cm')).toEqual([
      { left: '√52', right: '7,2', approximate: true },
    ])
    expect(equalitiesIn('avec a = x et b = 3')).toEqual([])
    // Un morceau de calcul n'est pas comparé : mieux vaut ne rien dire que se tromper.
    expect(equalitiesIn('20\u00A0% de 150 = 30')).toEqual([])
    expect(equalitiesIn('5\u00A0cm × 2 = 10\u00A0cm')).toEqual([])
    expect(equalitiesIn('12 = 2 fois 6')).toEqual([])
    expect(equalitiesIn('AC = 3 × AB')).toEqual([])
  })

  it('relève les valeurs données à x', () => {
    expect(statedValues('**3x = 12**\nOn divise par 3.\n**x = 12 ÷ 3 = 4**')).toEqual([4])
    expect(statedValues('x = −3 ou x = 7')).toEqual([-3, 7])
    expect(statedValues('Pour x = 1, on trouve 16.')).toEqual([1])
  })

  it('signale une égalité fausse entre nombres, ou un arrondi faux', () => {
    expect(wrongEqualities('3² + 4² = 9 + 16 = 25, donc BC = √25 = 5\u00A0cm')).toEqual([])
    expect(wrongEqualities('3² + 4² = 9 + 16 = 24')).toEqual(['9 + 16 = 24'])
    expect(wrongEqualities('√52 ≈ 7,3')).toEqual(['√52 ≈ 7,3'])
    expect(wrongEqualities('- 3² = 9')).toEqual([])
  })

  it('distingue une identité d’une équation', () => {
    // Une identité doit être vraie pour tout x.
    expect(wrongEqualities('(x + 3)² = x² + 6x + 9')).toEqual([])
    expect(wrongEqualities('(x + 3)² = x² + 5x + 9')).toEqual(['(x + 3)² = x² + 5x + 9'])
    // Une équation doit être vraie pour la solution que donne le texte.
    const solved = '**5x − 3 = 2x + 9**\n**3x = 12**\n**x = 4**'
    expect(wrongEqualities(solved)).toEqual([])
    expect(wrongEqualities(solved.replace('3x = 12', '3x = 13'))).toEqual(['3x = 13'])
    // Sans solution annoncée, une équation à un seul membre en x ne peut pas être jugée.
    expect(wrongEqualities('On cherche x tel que 2x + 3 = 11.')).toEqual([])
  })
})
