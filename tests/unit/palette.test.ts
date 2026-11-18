import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  ALLOWED_TEXT_PAIRS,
  contrastRatio,
  MIN_TEXT_CONTRAST,
  PALETTE,
  type PaletteColor,
} from '../../shared/rules/palette.js'

/** Nom de la variable CSS qui porte chaque couleur de la palette. */
const CSS_VARIABLES: Record<PaletteColor, string> = {
  page: '--color-page',
  card: '--color-card',
  text: '--color-text',
  textSecondary: '--color-text-secondary',
  accent: '--color-accent',
  skyFrom: '--color-sky-from',
  skyTo: '--color-sky-to',
  oceanFrom: '--color-ocean-from',
  oceanTo: '--color-ocean-to',
  maths: '--color-maths',
  memorisation: '--color-memorisation',
  sport: '--color-sport',
  other: '--color-other',
  success: '--color-success',
  warning: '--color-warning',
  urgent: '--color-urgent',
}

const tokens = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8')

function cssColor(variable: string): string | undefined {
  return new RegExp(`${variable}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(tokens)?.[1]?.toUpperCase()
}

describe('palette de la section 8', () => {
  it('reprend les valeurs du brief', () => {
    expect(PALETTE).toEqual({
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
    })
  })

  it('est déclarée à l’identique dans les styles de l’interface', () => {
    for (const [color, variable] of Object.entries(CSS_VARIABLES)) {
      expect(cssColor(variable), variable).toBe(PALETTE[color as PaletteColor])
    }
  })

  it('donne un contraste d’au moins 4,5:1 à chaque couple texte / fond autorisé', () => {
    // Bleu nuit sur tous les fonds ; texte secondaire et bleu soutenu sur blanc et fond de page.
    expect(ALLOWED_TEXT_PAIRS).toHaveLength(13 + 2 + 2)
    for (const [text, background] of ALLOWED_TEXT_PAIRS) {
      const ratio = contrastRatio(PALETTE[text], PALETTE[background])
      expect(ratio, `${text} sur ${background} : ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(
        MIN_TEXT_CONTRAST,
      )
    }
  })

  it('n’autorise le texte secondaire et le bleu soutenu que sur les fonds neutres', () => {
    const backgroundsOf = (text: PaletteColor) =>
      ALLOWED_TEXT_PAIRS.filter(([color]) => color === text).map(([, background]) => background)

    expect(backgroundsOf('textSecondary')).toEqual(['page', 'card'])
    expect(backgroundsOf('accent')).toEqual(['page', 'card'])
    // Sur l'orange pastel, par exemple, le texte secondaire serait trop peu lisible.
    expect(contrastRatio(PALETTE.textSecondary, PALETTE.oceanTo)).toBeLessThan(MIN_TEXT_CONTRAST)
  })

  it('calcule le contraste selon la définition WCAG', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBe(1)
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5)
  })

  it('dessine le contour des champs avec un contraste d’au moins 3:1 sur le blanc', () => {
    const border = cssColor('--color-field-border')

    expect(border).toBeDefined()
    expect(contrastRatio(border!, PALETTE.card)).toBeGreaterThanOrEqual(3)
  })
})
