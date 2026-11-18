/**
 * Identifiant public d'un élève : 8 caractères en majuscules et chiffres, en deux
 * blocs de 4 séparés par un tiret (par exemple XH9T-U89G). Les caractères
 * ambigus 0, O, 1, I et L sont exclus.
 */
export const PUBLIC_ID_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export const PUBLIC_ID_PATTERN = /^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/

/** Met huit caractères au format XXXX-XXXX. */
export function formatPublicId(characters: string): string {
  return `${characters.slice(0, 4)}-${characters.slice(4, 8)}`
}

/**
 * Ramène une saisie à la forme XXXX-XXXX, ou renvoie null si ce n'est pas un
 * identifiant. Tolère les minuscules, les espaces et le tiret oublié.
 */
export function normalizePublicId(input: string): string | null {
  const compact = input.replace(/[\s-]/g, '').toUpperCase()
  if (compact.length !== 8) return null
  const candidate = formatPublicId(compact)
  return PUBLIC_ID_PATTERN.test(candidate) ? candidate : null
}
