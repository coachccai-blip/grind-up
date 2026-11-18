/**
 * Texte mis en forme des consignes : gras, listes et liens, écrits dans une
 * syntaxe proche de Markdown. Le texte est découpé en une structure que
 * l'interface affiche élément par élément : aucune balise saisie par
 * l'utilisateur n'est jamais interprétée.
 *
 *   **gras**            texte en gras
 *   - élément           liste à puces
 *   1. élément          liste numérotée
 *   [texte](https://…)  lien ; une adresse https://… seule devient aussi un lien
 */
export type Inline =
  | { type: 'text'; text: string }
  | { type: 'bold'; children: Inline[] }
  | { type: 'link'; href: string; children: Inline[] }
  | { type: 'break' }

export type Block =
  { type: 'paragraph'; children: Inline[] } | { type: 'list'; ordered: boolean; items: Inline[][] }

export const RICH_TEXT_MAX_LENGTH = 5000

const BULLET = /^\s*[-*•]\s+(.*)$/
const NUMBERED = /^\s*\d{1,3}[.)]\s+(.*)$/
const SAFE_LINK = /^https?:\/\/[^\s<>"]+$/i

/** Seuls les liens http et https sont acceptés : pas de javascript:, pas de data:. */
export function isSafeLink(href: string): boolean {
  return SAFE_LINK.test(href)
}

const INLINE_TOKEN =
  /(\*\*(?=\S)([\s\S]*?\S)\*\*)|(\[([^\]\n]+)\]\((https?:\/\/[^\s)<>"]+)\))|(https?:\/\/[^\s<>"]*[^\s<>".,;:!?)])/i

function parseInline(text: string): Inline[] {
  const nodes: Inline[] = []
  let rest = text

  while (rest !== '') {
    const match = INLINE_TOKEN.exec(rest)
    if (!match) {
      nodes.push({ type: 'text', text: rest })
      break
    }
    if (match.index > 0) nodes.push({ type: 'text', text: rest.slice(0, match.index) })

    if (match[1] !== undefined) {
      nodes.push({ type: 'bold', children: parseInline(match[2] ?? '') })
    } else if (match[3] !== undefined) {
      nodes.push({ type: 'link', href: match[5] ?? '', children: parseInline(match[4] ?? '') })
    } else {
      const href = match[6] ?? ''
      nodes.push({ type: 'link', href, children: [{ type: 'text', text: href }] })
    }
    rest = rest.slice(match.index + match[0].length)
  }
  return nodes
}

/** Découpe un texte mis en forme en paragraphes et en listes. */
export function parseRichText(source: string): Block[] {
  const blocks: Block[] = []
  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    const children: Inline[] = []
    paragraph.forEach((line, index) => {
      if (index > 0) children.push({ type: 'break' })
      children.push(...parseInline(line))
    })
    blocks.push({ type: 'paragraph', children })
    paragraph = []
  }
  const flushList = () => {
    if (!list) return
    blocks.push({ type: 'list', ordered: list.ordered, items: list.items.map(parseInline) })
    list = null
  }

  for (const rawLine of source.replace(/\r\n?/g, '\n').split('\n')) {
    const line = rawLine.trimEnd()
    const bullet = BULLET.exec(line)
    const numbered = bullet ? null : NUMBERED.exec(line)

    if (bullet || numbered) {
      const ordered = numbered !== null
      flushParagraph()
      if (list && list.ordered !== ordered) flushList()
      list ??= { ordered, items: [] }
      list.items.push((bullet ?? numbered)![1] ?? '')
    } else if (line.trim() === '') {
      flushParagraph()
      flushList()
    } else {
      flushList()
      paragraph.push(line.trim())
    }
  }
  flushParagraph()
  flushList()
  return blocks
}

/** Texte brut d'un contenu mis en forme, pour un aperçu ou une recherche. */
export function richTextToPlainText(source: string): string {
  const inline = (nodes: Inline[]): string =>
    nodes
      .map((node) =>
        node.type === 'text' ? node.text : node.type === 'break' ? ' ' : inline(node.children),
      )
      .join('')
  return parseRichText(source)
    .map((block) =>
      block.type === 'paragraph' ? inline(block.children) : block.items.map(inline).join(' '),
    )
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}
