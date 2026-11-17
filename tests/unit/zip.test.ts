import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { unzipSync } from 'fflate'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { APP_VERSION } from '../../shared/version.js'

const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
/** Faux fichier de secrets, posé à la racine le temps du test. */
const decoySecret = join(projectRoot, '.env.zip-test')

let outputDirectory: string
let entries: Record<string, Uint8Array>

beforeAll(() => {
  outputDirectory = mkdtempSync(join(tmpdir(), 'grind-up-zip-'))
  writeFileSync(decoySecret, 'SECRET=ne-doit-pas-sortir\n')
  execFileSync('node', ['scripts/zip.mjs', '--out', outputDirectory], { cwd: projectRoot })
  entries = unzipSync(readFileSync(join(outputDirectory, `quetes-v${APP_VERSION}.zip`)))
})

afterAll(() => {
  rmSync(decoySecret, { force: true })
  rmSync(outputDirectory, { recursive: true, force: true })
})

describe('npm run zip', () => {
  it('contient le projet tel que Netlify doit le construire', () => {
    const paths = Object.keys(entries)

    for (const expected of [
      'netlify.toml',
      'package.json',
      'package-lock.json',
      'README.md',
      'index.html',
      'vite.config.ts',
      'src/main.tsx',
      'server/app.ts',
      'server/db/migrations/index.ts',
      'netlify/functions/api.mts',
    ]) {
      expect(paths).toContain(expected)
    }
  })

  it('ne contient ni dépendances, ni historique Git, ni secrets, ni fichiers générés', () => {
    const paths = Object.keys(entries)

    expect(paths.filter((path) => path.split('/').includes('node_modules'))).toEqual([])
    expect(paths.filter((path) => path.split('/').includes('.git'))).toEqual([])
    expect(paths.filter((path) => /(^|\/)\.env(\.|$)/.test(path))).toEqual([])
    expect(paths.filter((path) => /^(dist|\.netlify)\//.test(path))).toEqual([])
    expect(paths.filter((path) => path.endsWith('.zip'))).toEqual([])
  })

  it('reste sous les seuils de Netlify : 50 Mo au total, 10 Mo par fichier', () => {
    const megabyte = 1024 * 1024
    const sizes = Object.values(entries).map((content) => content.length)

    expect(Math.max(...sizes)).toBeLessThan(10 * megabyte)
    expect(sizes.reduce((total, size) => total + size, 0)).toBeLessThan(50 * megabyte)
  })

  it('range les fichiers à la racine du zip, comme dans le dépôt', () => {
    const manifest = JSON.parse(new TextDecoder().decode(entries['package.json'])) as {
      name: string
      version: string
    }

    expect(manifest).toMatchObject({ name: 'grind-up', version: APP_VERSION })
  })
})
