import { normalizePublicId } from './public-id.js'

/**
 * Pseudo : 3 à 20 caractères, lettres (accents compris), chiffres, tiret et
 * tiret bas. Deux pseudos qui ne diffèrent que par les majuscules ou les accents
 * sont considérés comme identiques : on ne peut pas imiter « Léa » avec « lea ».
 */
export const PSEUDO_MIN_LENGTH = 3
export const PSEUDO_MAX_LENGTH = 20

const ALLOWED_CHARACTERS = /^[\p{L}\p{N}_-]+$/u

export type PseudoProblem = 'length' | 'characters' | 'looks_like_identifier'

export const PSEUDO_PROBLEM_MESSAGES: Record<PseudoProblem, string> = {
  length: `Le pseudo doit faire entre ${PSEUDO_MIN_LENGTH} et ${PSEUDO_MAX_LENGTH} caractères.`,
  characters:
    'Le pseudo ne peut contenir que des lettres, des chiffres, des tirets et des tirets bas.',
  looks_like_identifier: 'Ce pseudo ressemble à un identifiant.',
}

/** Renvoie ce qui empêche d'accepter ce pseudo, ou null s'il est valide. */
export function checkPseudo(pseudo: string): PseudoProblem | null {
  const length = [...pseudo].length
  if (length < PSEUDO_MIN_LENGTH || length > PSEUDO_MAX_LENGTH) return 'length'
  if (!ALLOWED_CHARACTERS.test(pseudo)) return 'characters'
  // La connexion accepte l'identifiant ou le pseudo : un pseudo ne doit pas pouvoir passer pour un identifiant.
  if (normalizePublicId(pseudo) !== null) return 'looks_like_identifier'
  return null
}

/** Clé d'unicité et de recherche d'un pseudo : sans majuscules ni accents. */
export function pseudoKey(pseudo: string): string {
  return pseudo.trim().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().normalize('NFC')
}
