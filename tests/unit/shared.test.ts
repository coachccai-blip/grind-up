import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parisDay } from '../../shared/time.js'
import { APP_VERSION } from '../../shared/version.js'

describe('version', () => {
  it('est identique à celle de package.json', () => {
    const manifest = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    ) as { version: string }

    expect(APP_VERSION).toBe(manifest.version)
  })
})

describe('parisDay', () => {
  it('donne le jour calendaire vu de Paris', () => {
    expect(parisDay(new Date('2026-11-17T12:00:00Z'))).toBe('2026-11-17')
  })

  it('passe au lendemain dès minuit à Paris, en hiver (UTC+1) comme en été (UTC+2)', () => {
    expect(parisDay(new Date('2026-01-15T22:59:59Z'))).toBe('2026-01-15')
    expect(parisDay(new Date('2026-01-15T23:00:00Z'))).toBe('2026-01-16')
    expect(parisDay(new Date('2026-07-15T21:59:59Z'))).toBe('2026-07-15')
    expect(parisDay(new Date('2026-07-15T22:00:00Z'))).toBe('2026-07-16')
  })

  it('suit les changements d’heure', () => {
    // Passage à l'heure d'été le 29 mars 2026, à l'heure d'hiver le 25 octobre 2026.
    expect(parisDay(new Date('2026-03-29T22:30:00Z'))).toBe('2026-03-30')
    expect(parisDay(new Date('2026-10-25T22:30:00Z'))).toBe('2026-10-25')
    expect(parisDay(new Date('2026-10-25T23:00:00Z'))).toBe('2026-10-26')
  })
})
