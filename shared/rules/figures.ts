/**
 * Illustrations des textes : une ligne seule
 *
 *   ![texte alternatif](figure:identifiant)
 *
 * affiche l'image /figures/identifiant.svg, servie par le site lui-même. Le
 * texte alternatif décrit la figure en une phrase courte ; il est vide pour une
 * illustration purement décorative.
 *
 * Dans un texte mis en forme (consigne, rappel du cours, exemple), la ligne
 * devient un bloc à part. L'énoncé d'une question, lui, est un texte simple :
 * il peut se terminer par une ou plusieurs illustrations, que `splitPrompt`
 * sépare du texte.
 */
export interface FigureRef {
  id: string
  alt: string
}

export const FIGURE_ID_MAX = 80
export const FIGURE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const ID = '[a-z0-9]+(?:-[a-z0-9]+)*'
/** Une ligne d'illustration, seule sur sa ligne (espaces autour tolérées). */
const FIGURE_LINE = new RegExp(`^\\s*!\\[([^\\]\\n]*)\\]\\(figure:(${ID})\\)\\s*$`)
/**
 * Une illustration à la fin d'un énoncé. Un champ d'une seule ligne supprime les
 * retours à la ligne : la référence reste reconnue collée au texte qui la précède.
 */
const TRAILING_FIGURE = new RegExp(`\\s*!\\[([^\\]\\n]*)\\]\\(figure:(${ID})\\)\\s*$`)

const toRef = (alt: string, id: string): FigureRef | null =>
  id.length <= FIGURE_ID_MAX ? { id, alt: alt.trim() } : null

/** L'illustration qu'une ligne désigne, ou null si la ligne n'en est pas une. */
export function parseFigureLine(line: string): FigureRef | null {
  const match = FIGURE_LINE.exec(line)
  return match ? toRef(match[1] ?? '', match[2] ?? '') : null
}

/** La ligne qui affiche une illustration. */
export function figureLine({ id, alt }: FigureRef): string {
  if (!FIGURE_ID.test(id) || id.length > FIGURE_ID_MAX) {
    throw new Error(`Identifiant d’illustration invalide\u00A0: ${id}`)
  }
  if (/[\]\n]/.test(alt)) throw new Error(`Texte alternatif invalide\u00A0: ${alt}`)
  return `![${alt.trim()}](figure:${id})`
}

/** Adresse du fichier d'une illustration. */
export const figureSrc = (id: string) => `/figures/${id}.svg`

/** Un énoncé de question : son texte, puis les illustrations qui le terminent. */
export function splitPrompt(prompt: string): { text: string; figures: FigureRef[] } {
  const figures: FigureRef[] = []
  let text = prompt
  for (;;) {
    const match = TRAILING_FIGURE.exec(text)
    const ref = match ? toRef(match[1] ?? '', match[2] ?? '') : null
    if (!match || !ref) break
    figures.unshift(ref)
    text = text.slice(0, match.index)
  }
  return { text: text.trim(), figures }
}

/** Le texte seul d'un énoncé, pour un titre, une liste ou un export. */
export const promptText = (prompt: string) => splitPrompt(prompt).text
