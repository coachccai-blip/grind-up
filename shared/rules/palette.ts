/**
 * Palette de la section 8 du brief. Les mêmes valeurs sont déclarées dans
 * src/styles/tokens.css ; un test vérifie que les deux fichiers concordent et
 * que chaque couple texte / fond autorisé atteint un contraste de 4,5:1.
 */
export const PALETTE = {
  page: '#F5F9FF',
  card: '#FFFFFF',
  text: '#1F2A44',
  textSecondary: '#5B6B8A',
  accent: '#2A66D9',
  skyFrom: '#CFE8FF',
  skyTo: '#A9CCFF',
  oceanFrom: '#9CC7FF',
  oceanTo: '#7AA5F7',
  maths: '#E4E1FF',
  memorisation: '#D5F3EA',
  sport: '#FFE5D6',
  other: '#FFF3C9',
  success: '#E1F5C4',
  warning: '#FFE8CC',
  urgent: '#FFDDE1',
} as const

export type PaletteColor = keyof typeof PALETTE

/** Fonds neutres : le blanc des cartes et le blanc bleuté de la page. */
export const NEUTRAL_BACKGROUNDS: readonly PaletteColor[] = ['page', 'card']

/** Fonds pastel et couleurs de dégradé : le texte y est toujours en bleu nuit. */
export const TINTED_BACKGROUNDS: readonly PaletteColor[] = [
  'skyFrom',
  'skyTo',
  'oceanFrom',
  'oceanTo',
  'maths',
  'memorisation',
  'sport',
  'other',
  'success',
  'warning',
  'urgent',
]

/**
 * Couples texte / fond autorisés par les règles de couleur : le bleu nuit partout,
 * le texte secondaire et le bleu soutenu uniquement sur les fonds neutres.
 */
export const ALLOWED_TEXT_PAIRS: readonly (readonly [PaletteColor, PaletteColor])[] = [
  ...[...NEUTRAL_BACKGROUNDS, ...TINTED_BACKGROUNDS].map(
    (background) => ['text', background] as const,
  ),
  ...NEUTRAL_BACKGROUNDS.map((background) => ['textSecondary', background] as const),
  ...NEUTRAL_BACKGROUNDS.map((background) => ['accent', background] as const),
]

/** Contraste minimal entre un texte et son fond. */
export const MIN_TEXT_CONTRAST = 4.5

function channelToLinear(value: number): number {
  const scaled = value / 255
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
}

/** Luminance relative d'une couleur #RRGGBB (définition WCAG). */
export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!match) throw new Error(`Couleur invalide\u00A0: ${hex}`)
  const [red, green, blue] = [match[1]!, match[2]!, match[3]!].map((part) =>
    channelToLinear(Number.parseInt(part, 16)),
  ) as [number, number, number]
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

/** Rapport de contraste entre deux couleurs, de 1 à 21 (définition WCAG). */
export function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort(
    (a, b) => b - a,
  ) as [number, number]
  return (lighter + 0.05) / (darker + 0.05)
}
