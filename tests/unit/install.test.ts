import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { detectPlatform, INSTALL_STEPS } from '../../shared/rules/install.js'
import { PALETTE } from '../../shared/rules/palette.js'

/**
 * Installation sur l'écran d'accueil (section 11 du brief) : un manifeste web et
 * des icônes, sans passer par les magasins d'applications.
 */
const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
const publicFile = (path: string) => join(projectRoot, 'public', path)

interface ManifestIcon {
  src: string
  sizes: string
  type: string
  purpose: string
}

const manifest = JSON.parse(readFileSync(publicFile('manifest.webmanifest'), 'utf8')) as {
  name: string
  short_name: string
  lang: string
  start_url: string
  scope: string
  display: string
  background_color: string
  theme_color: string
  icons: ManifestIcon[]
}
const page = readFileSync(join(projectRoot, 'index.html'), 'utf8')

/** Largeur et hauteur d'une image PNG, lues dans son en-tête. */
function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path)
  expect(bytes.subarray(1, 4).toString('latin1')).toBe('PNG')
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

describe('manifeste web', () => {
  it('présente Grind up comme une application à part entière, en français', () => {
    expect(manifest).toMatchObject({
      name: 'Grind up',
      short_name: 'Grind up',
      lang: 'fr',
      start_url: '/',
      scope: '/',
      // Sans barre d'adresse : le site s'ouvre comme une application.
      display: 'standalone',
    })
  })

  it('reprend le fond de page de la palette, en thème clair', () => {
    expect(manifest.background_color.toLowerCase()).toBe(PALETTE.page.toLowerCase())
    expect(manifest.theme_color.toLowerCase()).toBe(PALETTE.page.toLowerCase())
    expect(page).toContain(`<meta name="theme-color" content="${manifest.theme_color}" />`)
  })

  it('fournit les icônes qu’Android demande : 192 et 512 px, ordinaires et adaptables', () => {
    const offered = manifest.icons.map((icon) => `${icon.purpose} ${icon.sizes}`).sort()

    expect(offered).toEqual(['any 192x192', 'any 512x512', 'maskable 192x192', 'maskable 512x512'])
  })

  it('chaque icône existe, à la taille annoncée, sans alourdir le site', () => {
    for (const icon of manifest.icons) {
      const path = publicFile(icon.src)
      const [width, height] = icon.sizes.split('x').map(Number)

      expect(existsSync(path), icon.src).toBe(true)
      expect(icon.type).toBe('image/png')
      expect(pngSize(path), icon.src).toEqual({ width, height })
      expect(statSync(path).size, icon.src).toBeLessThan(150 * 1024)
    }
  })
})

describe('page d’accueil', () => {
  it('déclare le manifeste et les icônes, servis par le site lui-même', () => {
    expect(page).toContain('<link rel="manifest" href="/manifest.webmanifest" />')
    const linked = [...page.matchAll(/<link rel="(?:icon|apple-touch-icon)"[^>]* href="([^"]+)"/g)]
      .map((match) => match[1]!)
      .sort()

    expect(linked).toEqual([
      '/icons/apple-touch-icon.png',
      '/icons/favicon-48.png',
      '/icons/icon-192.png',
    ])
    for (const href of linked) expect(existsSync(publicFile(href)), href).toBe(true)
  })

  it('donne à l’iPhone son icône de 180 px et le nom affiché sous elle', () => {
    expect(pngSize(publicFile('icons/apple-touch-icon.png'))).toEqual({ width: 180, height: 180 })
    expect(page).toContain('<meta name="apple-mobile-web-app-title" content="Grind up" />')
    expect(page).toContain('<meta name="apple-mobile-web-app-capable" content="yes" />')
  })
})

describe('marche à suivre pour installer', () => {
  const IPHONE =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
  const MAC =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15'
  const ANDROID =
    'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36'
  const WINDOWS =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'

  it('reconnaît l’iPhone, l’iPad, Android et l’ordinateur', () => {
    expect(detectPlatform(IPHONE, 5)).toBe('ios')
    // Un iPad se présente comme un Mac : son écran tactile le distingue.
    expect(detectPlatform(MAC, 5)).toBe('ios')
    expect(detectPlatform(MAC, 0)).toBe('desktop')
    expect(detectPlatform(ANDROID, 5)).toBe('android')
    expect(detectPlatform(WINDOWS, 0)).toBe('desktop')
  })

  it('tutoie l’élève et vouvoie l’admin, pour chaque appareil', () => {
    expect(INSTALL_STEPS.student.ios).toContain('Touche le bouton Partager')
    expect(INSTALL_STEPS.admin.ios).toContain('Touchez le bouton Partager')
    for (const platform of ['ios', 'android', 'desktop'] as const) {
      expect(INSTALL_STEPS.student[platform]).not.toBe(INSTALL_STEPS.admin[platform])
    }
  })
})
