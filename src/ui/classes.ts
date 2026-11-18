/** Assemble des noms de classes CSS en ignorant les valeurs vides. */
export function classes(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ')
}
