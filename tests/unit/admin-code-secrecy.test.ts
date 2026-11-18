import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DEFAULT_ADMIN_SIGNUP_CODE } from '../../server/config.js'

/**
 * Le code admin ne doit jamais se trouver dans le code envoyé au navigateur :
 * ni dans l'interface (src/), ni dans le code partagé (shared/) qu'elle embarque.
 */
const projectRoot = fileURLToPath(new URL('../..', import.meta.url))

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? filesUnder(path) : [path]
  })
}

describe('code admin', () => {
  it('n’apparaît que côté serveur', () => {
    const leaks = ['src', 'shared', 'index.html', 'public']
      .map((entry) => join(projectRoot, entry))
      .flatMap((path) => {
        try {
          return filesUnder(path)
        } catch {
          return [path]
        }
      })
      .filter((file) => {
        try {
          return readFileSync(file, 'utf8').includes(DEFAULT_ADMIN_SIGNUP_CODE)
        } catch {
          return false
        }
      })
      .map((file) => relative(projectRoot, file))

    expect(leaks).toEqual([])
  })

  it('n’est importé par aucun fichier de l’interface', () => {
    const importers = filesUnder(join(projectRoot, 'src'))
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => /from\s+['"][^'"]*server\//.test(readFileSync(file, 'utf8')))
      .map((file) => relative(projectRoot, file))

    expect(importers).toEqual([])
  })
})
