/**
 * Comparaison d'une réponse d'élève à la réponse attendue, avec la tolérance du
 * brief : espaces, virgule ou point, majuscules. Les accents, eux, comptent :
 * « école » et « ecole » sont deux réponses différentes.
 */

/** Forme canonique d'un nombre : sans signe plus, sans zéros inutiles. */
function canonicalNumber(text: string): string | null {
  const match = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(text)
  if (!match || (match[2] === '' && (match[3] ?? '') === '')) return null
  const integer = (match[2] ?? '').replace(/^0+(?=\d)/, '') || '0'
  const decimals = (match[3] ?? '').replace(/0+$/, '')
  const value = decimals ? `${integer}.${decimals}` : integer
  const isZero = /^0(\.0*)?$/.test(value)
  return match[1] === '-' && !isZero ? `-${value}` : value
}

/** Clé de comparaison d'une réponse : deux réponses équivalentes ont la même clé. */
export function answerKey(answer: string): string {
  const compact = answer
    .normalize('NFKC')
    .toLocaleLowerCase('fr-FR')
    // Toutes les espaces, y compris insécables, fines ou de largeur nulle.
    .replace(/[\s\p{Z}\p{Cf}]+/gu, '')
    // Signe moins typographique et tirets voisins, puis virgule décimale.
    .replace(/[\u2212\u2012\u2013]/g, '-')
    .replace(/,/g, '.')
  return canonicalNumber(compact) ?? compact
}

/** Vrai si la réponse donnée correspond à l'une des réponses acceptées. */
export function isAnswerAccepted(given: string, accepted: readonly string[]): boolean {
  const key = answerKey(given)
  if (key === '') return false
  return accepted.some((candidate) => answerKey(candidate) === key)
}

/** Pourcentage de réussite, arrondi à l'entier le plus proche. */
export function scorePercent(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100)
}
