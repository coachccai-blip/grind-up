import { evaluate, roundsTo, sameExpression } from './expressions.js'

/**
 * Relecture des égalités écrites dans un texte d'exercice : pour chaque signe
 * « = » ou « ≈ », les deux calculs qu'il relie sont recalculés quand ils se
 * lisent. Une phrase, une lettre autre que x ou une unité ne se calculent pas :
 * l'égalité est alors laissée de côté.
 */
export interface WrittenEquality {
  left: string
  right: string
  /** Vrai pour « ≈ » : la valeur de droite est un arrondi de celle de gauche. */
  approximate: boolean
}

/** Mots et signes qui prolongent un calcul : ce qui les touche n'est qu'un morceau de calcul. */
const OPERATOR_BEFORE = /(?:[×÷+−\-/(]|\b(?:de|du|des|d’|fois|sur|plus|moins))$/u
const OPERATOR_AFTER = /^(?:[×÷+−\-/^]|(?:fois|de|du|des|d’|sur|plus|moins)\b)/u

/** Une unité collée à son nombre par une espace insécable redevient un mot à part. */
const detachUnits = (text: string) => text.replace(/(?<=\d)\u00A0(?=[\p{L}€])/gu, ' ')

/**
 * Le plus long calcul lisible à la fin d'un texte, en partant d'un début de mot.
 * Null si ce calcul n'est que la fin d'un calcul plus long qui ne se lit pas
 * (« 5 cm × 2 », « 20 % de 150 ») : mieux vaut ne rien comparer que comparer un morceau.
 */
function calculationBefore(text: string): string | null {
  const words = detachUnits(text).split(' ')
  for (let start = 0; start < words.length; start += 1) {
    const candidate = words.slice(start).join(' ')
    if (evaluate(candidate, 1) === null) continue
    const before = words.slice(0, start).join(' ').trimEnd()
    return OPERATOR_BEFORE.test(before) ? null : candidate
  }
  return null
}

/** Le plus long calcul lisible au début d'un texte, jusqu'à une fin de mot ; même réserve. */
function calculationAfter(text: string): string | null {
  const words = detachUnits(text).split(' ')
  for (let end = words.length; end > 0; end -= 1) {
    const candidate = words
      .slice(0, end)
      .join(' ')
      .replace(/[\s.,;:!?»]+$/u, '')
    if (evaluate(candidate, 1) === null) continue
    const after = words.slice(end).join(' ').trimStart()
    return OPERATOR_AFTER.test(after) ? null : candidate
  }
  return null
}

/** Pour chaque signe « = » ou « ≈ » d'une ligne, les deux calculs qu'il relie, s'ils se lisent. */
export function equalitiesIn(line: string): WrittenEquality[] {
  const pairs: WrittenEquality[] = []
  for (const match of line.matchAll(/ ([=≈]) /g)) {
    const left = calculationBefore(line.slice(0, match.index))
    const right = calculationAfter(line.slice(match.index + match[0].length))
    if (left !== null && right !== null) {
      pairs.push({ left, right, approximate: match[1] === '≈' })
    }
  }
  return pairs
}

/** Les valeurs données à x dans un texte : « x = 4 », « pour x = −3 », « x = 12 ÷ 3 ». */
export function statedValues(text: string): number[] {
  const values: number[] = []
  for (const line of text.replaceAll('**', '').split('\n')) {
    // « 3x = 12 » ne donne pas de valeur à x : la lettre doit être seule à gauche du signe égal.
    for (const match of line.matchAll(/(?<![\p{L}\p{N})])x = /gu)) {
      const expression = calculationAfter(line.slice(match.index + match[0].length))
      if (expression === null || expression.includes('x')) continue
      const value = evaluate(expression, 0)
      if (value !== null) values.push(value)
    }
  }
  return values
}

const hasX = (text: string) => text.includes('x')

/**
 * Les égalités fausses d'un texte, telles qu'elles y sont écrites.
 *
 * - Entre nombres, les deux membres doivent être égaux (ou, pour « ≈ », l'un
 *   l'arrondi de l'autre).
 * - Avec la lettre x, l'égalité doit être vraie pour tout x : c'est une identité.
 *   Sinon c'est une équation, et elle doit être vraie pour l'une des valeurs que
 *   le texte donne à x (sa solution). Une équation dont le texte ne donne aucune
 *   solution ne peut pas être jugée.
 */
export function wrongEqualities(text: string): string[] {
  const values = statedValues(text)
  const wrong: string[] = []
  const lines = text
    .replaceAll('**', '')
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-•]|\d{1,3}[.)])\s+/, ''))

  for (const line of lines) {
    for (const { left, right, approximate } of equalitiesIn(line)) {
      const written = `${left} ${approximate ? '≈' : '='} ${right}`
      if (!hasX(left) && !hasX(right)) {
        const holds = approximate ? roundsTo(left, right) : sameExpression(left, right)
        if (holds === false) wrong.push(written)
        continue
      }
      if (approximate) continue
      if (sameExpression(left, right)) continue
      // Une équation : vraie pour l'une des valeurs données à x, si le texte en donne.
      const oneSided = hasX(left) !== hasX(right)
      if (values.length === 0 && oneSided) continue
      const solved = values.some((value) => {
        const a = evaluate(left, value)
        const b = evaluate(right, value)
        return a !== null && b !== null && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a))
      })
      if (!solved) wrong.push(written)
    }
  }
  return wrong
}
