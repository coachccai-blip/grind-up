#!/usr/bin/env node
/**
 * Planche de contrôle des illustrations de la bibliothèque.
 *
 *   node scripts/figures-planche.mjs <sortie.png> [identifiants…]
 *
 * Fabrique une image PNG des figures demandées (toutes par défaut), chacune à
 * sa taille réelle de 320 px de large, sur le fond de carte où l'élève la voit,
 * avec son identifiant dessous. L'image est rendue en densité 2, comme sur un
 * téléphone. Les fichiers lus sont ceux de public/figures/ : les réengendrer
 * d'abord après une modification (voir docs/bibliotheque.md).
 *
 * Options : --colonnes <n> (3 par défaut).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const directory = join(projectRoot, 'public', 'figures')

function fail(message) {
  console.error(`Échec : ${message}`)
  process.exit(1)
}

const args = process.argv.slice(2)
let columns = 3
const columnsAt = args.indexOf('--colonnes')
if (columnsAt !== -1) {
  columns = Number(args[columnsAt + 1])
  if (!Number.isInteger(columns) || columns < 1) fail('--colonnes attend un nombre entier.')
  args.splice(columnsAt, 2)
}
const [output, ...wanted] = args
if (!output || !output.endsWith('.png')) {
  fail('usage : node scripts/figures-planche.mjs <sortie.png> [identifiants…]')
}

const available = existsSync(directory)
  ? readdirSync(directory)
      .filter((name) => name.endsWith('.svg'))
      .map((name) => name.slice(0, -4))
      .sort()
  : []
const ids = wanted.length > 0 ? wanted : available
const unknown = ids.filter((id) => !available.includes(id))
if (unknown.length > 0) fail(`figure introuvable dans public/figures/ : ${unknown.join(', ')}`)
if (ids.length === 0) fail('aucune figure dans public/figures/.')

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const cards = ids
  .map((id) => {
    const svg = readFileSync(join(directory, `${id}.svg`))
    const source = `data:image/svg+xml;base64,${svg.toString('base64')}`
    return `<figure><div class="figure"><img src="${source}" alt=""></div><figcaption>${escape(id)}</figcaption></figure>`
  })
  .join('')

const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><style>
  body { margin: 0; padding: 24px; background: #ffffff; font-family: system-ui, sans-serif; color: #1f2a44; }
  main { display: grid; grid-template-columns: repeat(${columns}, 336px); gap: 24px; align-items: start; }
  figure { margin: 0; }
  .figure { padding: 8px; border-radius: 12px; background: #f5f9ff; box-shadow: inset 0 0 0 1px #e3eaf6; }
  img { display: block; width: 320px; height: auto; }
  figcaption { margin-top: 6px; font-size: 13px; font-weight: 700; color: #5b6b8a; }
</style><main>${cards}</main></html>`

const browser = await chromium.launch()
try {
  const page = await browser.newPage({
    viewport: { width: columns * 360 + 48, height: 400 },
    deviceScaleFactor: 2,
  })
  await page.setContent(html, { waitUntil: 'load' })
  await page.screenshot({ path: resolve(output), fullPage: true })
} finally {
  await browser.close()
}
console.log(`${resolve(output)} : ${ids.length} figure${ids.length > 1 ? 's' : ''}`)
