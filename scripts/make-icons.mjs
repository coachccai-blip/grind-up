// Fabrique les icônes de l'application, rangées dans public/icons : un « G » en
// Nunito et un chevron vers le haut, sur le dégradé « Océan » de la section 8.
//
// Outil de développement, à relancer seulement si le dessin change :
//   node scripts/make-icons.mjs
// Il dessine avec le navigateur des tests (voir « npx playwright install chromium »).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'icons')
const font = readFileSync(
  join(root, 'node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2'),
).toString('base64')

/**
 * Le dessin, sur un carré de 512 px.
 * - `scale` : taille du motif. Une icône « maskable » peut être rognée en cercle par
 *   l'appareil : son motif tient dans la zone sûre, au centre.
 * - `rounded` : coins arrondis et transparents, pour une icône affichée telle quelle.
 */
const drawing = ({ scale, rounded }) => `<!doctype html>
<style>
  @font-face {
    font-family: 'Nunito';
    font-weight: 200 1000;
    src: url(data:font/woff2;base64,${font}) format('woff2');
  }
  html, body { margin: 0; background: transparent; }
  svg { display: block; width: 100vw; height: 100vw; }
</style>
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ocean" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9CC7FF" />
      <stop offset="1" stop-color="#7AA5F7" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="url(#ocean)" />
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <text x="214" y="376" text-anchor="middle" font-family="Nunito" font-weight="900"
          font-size="330" fill="#1F2A44">G</text>
    <path d="M360 164 L402 122 L444 164" fill="none" stroke="#1F2A44" stroke-width="32"
          stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>`

const ICONS = [
  { file: 'icon-192.png', size: 192, scale: 1, rounded: true },
  { file: 'icon-512.png', size: 512, scale: 1, rounded: true },
  { file: 'maskable-192.png', size: 192, scale: 0.72, rounded: false },
  { file: 'maskable-512.png', size: 512, scale: 0.72, rounded: false },
  // iPhone : un carré plein, que l'appareil arrondit lui-même.
  { file: 'apple-touch-icon.png', size: 180, scale: 0.9, rounded: false },
  { file: 'favicon-48.png', size: 48, scale: 1, rounded: true },
]

const browser = await chromium.launch()
for (const icon of ICONS) {
  const page = await browser.newPage({ viewport: { width: icon.size, height: icon.size } })
  await page.setContent(drawing(icon))
  // La police est chargée avant la capture.
  await page.evaluate('document.fonts.ready.then(() => true)')
  await page.screenshot({ path: join(out, icon.file), omitBackground: icon.rounded })
  await page.close()
  console.log(icon.file)
}
await browser.close()
