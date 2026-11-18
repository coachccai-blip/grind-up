import { describe, expect, it } from 'vitest'
import { answerKey, isAnswerAccepted, scorePercent } from '../../shared/rules/answers.js'

describe('comparaison des réponses', () => {
  it('ne tient pas compte des majuscules', () => {
    expect(isAnswerAccepted('PARIS', ['Paris'])).toBe(true)
    expect(isAnswerAccepted('pythagore', ['Pythagore'])).toBe(true)
  })

  it('ne tient pas compte des espaces, même insécables', () => {
    expect(isAnswerAccepted('  Victor   Hugo ', ['Victor Hugo'])).toBe(true)
    expect(isAnswerAccepted('1 000', ['1000'])).toBe(true)
    expect(isAnswerAccepted('1\u00A0000', ['1000'])).toBe(true)
    expect(isAnswerAccepted('5cm', ['5 cm'])).toBe(true)
  })

  it('accepte la virgule comme le point', () => {
    expect(isAnswerAccepted('3,5', ['3.5'])).toBe(true)
    expect(isAnswerAccepted('3.5', ['3,5'])).toBe(true)
  })

  it('reconnaît un même nombre écrit différemment', () => {
    expect(isAnswerAccepted('3,50', ['3.5'])).toBe(true)
    expect(isAnswerAccepted('03', ['3'])).toBe(true)
    expect(isAnswerAccepted('+7', ['7'])).toBe(true)
    expect(isAnswerAccepted('12,0', ['12'])).toBe(true)
    expect(isAnswerAccepted('0,50', ['.5'])).toBe(true)
    expect(isAnswerAccepted('-0', ['0'])).toBe(true)
    expect(isAnswerAccepted('\u22124', ['-4'])).toBe(true)
  })

  it('distingue des nombres différents', () => {
    expect(isAnswerAccepted('3,51', ['3.5'])).toBe(false)
    expect(isAnswerAccepted('-4', ['4'])).toBe(false)
    expect(isAnswerAccepted('35', ['3.5'])).toBe(false)
  })

  it('tient compte des accents', () => {
    expect(isAnswerAccepted('ecole', ['école'])).toBe(false)
    expect(isAnswerAccepted('École', ['école'])).toBe(true)
  })

  it('accepte l’une quelconque des réponses prévues', () => {
    expect(isAnswerAccepted('un demi', ['1/2', '0,5', 'un demi'])).toBe(true)
    expect(isAnswerAccepted('0.5', ['1/2', '0,5', 'un demi'])).toBe(true)
    expect(isAnswerAccepted('2', ['1/2', '0,5', 'un demi'])).toBe(false)
  })

  it('refuse une réponse vide', () => {
    expect(isAnswerAccepted('', ['Paris'])).toBe(false)
    expect(isAnswerAccepted('   ', ['Paris', ''])).toBe(false)
  })

  it('donne la même clé à deux écritures équivalentes', () => {
    expect(answerKey(' 3,50 ')).toBe(answerKey('3.5'))
    expect(answerKey('Bonjour  Le Monde')).toBe(answerKey('bonjour le monde'))
  })
})

describe('score', () => {
  it('est un pourcentage arrondi à l’entier le plus proche', () => {
    expect(scorePercent(4, 5)).toBe(80)
    expect(scorePercent(2, 3)).toBe(67)
    expect(scorePercent(1, 3)).toBe(33)
    expect(scorePercent(0, 4)).toBe(0)
    expect(scorePercent(4, 4)).toBe(100)
    expect(scorePercent(0, 0)).toBe(0)
  })
})
