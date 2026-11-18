import { pseudoKey } from '../../../shared/rules/pseudo'
import type { AdminStudent } from '../../../shared/schemas/admin'

/** Un élève correspond à la recherche par son pseudo ou par son identifiant. */
export function studentMatches(
  student: Pick<AdminStudent, 'pseudo' | 'publicId'>,
  search: string,
): boolean {
  const text = search.trim()
  if (text === '') return true
  const compactId = (value: string) => value.replace(/[\s-]/g, '').toUpperCase()
  return (
    pseudoKey(student.pseudo).includes(pseudoKey(text)) ||
    compactId(student.publicId).includes(compactId(text))
  )
}
