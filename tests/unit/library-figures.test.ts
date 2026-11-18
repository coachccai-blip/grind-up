import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { FIGURES } from '../../server/library/figures/index.js'
import {
  MAX_HEIGHT,
  MIN_HEIGHT,
  PALETTE,
  SMALL_FONT_SIZE,
  WIDTH,
} from '../../server/library/figures/svg.js'
import { findLibraryExercise, listLibrary } from '../../server/library/index.js'
import { FIGURE_ID, FIGURE_ID_MAX, splitPrompt } from '../../shared/rules/figures.js'
import { parseRichText } from '../../shared/rules/rich-text.js'
import type { LibraryExercise } from '../../shared/schemas/library.js'

/**
 * Illustrations de la bibliothèque. Elles sont définies en TypeScript dans
 * server/library/figures/ et enregistrées dans le dépôt sous public/figures/,
 * où le site les sert telles quelles. Ce test les réengendre et les compare aux
 * fichiers : une définition modifiée sans mise à jour des fichiers le fait
 * échouer.
 *
 * Pour récrire les fichiers :
 *   MAJ_FIGURES=1 npx vitest run tests/unit/library-figures.test.ts
 */
const directory = fileURLToPath(new URL('../../public/figures', import.meta.url))
const fileOf = (id: string) => join(directory, `${id}.svg`)

if (process.env.MAJ_FIGURES) {
  rmSync(directory, { recursive: true, force: true })
  mkdirSync(directory, { recursive: true })
  for (const figure of FIGURES) writeFileSync(fileOf(figure.id), figure.svg)
}

const files = () =>
  readdirSync(directory)
    .filter((name) => name.endsWith('.svg'))
    .map((name) => name.slice(0, -'.svg'.length))
    .sort()

const exercises: LibraryExercise[] = listLibrary().map(({ id }) => findLibraryExercise(id)!)

/** Les illustrations qu'un exercice montre, et où. */
function references(exercise: LibraryExercise) {
  const inText = (where: string, source: string) =>
    parseRichText(source).flatMap((block) =>
      block.type === 'figure' ? [{ where, id: block.id, alt: block.alt }] : [],
    )
  return [
    ...inText('rappel du cours', exercise.lesson),
    ...inText('exemple expliqué', exercise.example),
    ...inText('consigne', exercise.instructions),
    ...exercise.items.flatMap((item, index) =>
      splitPrompt(item.prompt).figures.map((figure) => ({
        where: `question ${index + 1}`,
        ...figure,
      })),
    ),
  ].map((reference) => ({ ...reference, where: `${exercise.id}, ${reference.where}` }))
}

const allReferences = exercises.flatMap(references)
const defined = new Set(FIGURES.map((figure) => figure.id))

describe('illustrations : les fichiers', () => {
  it('ont chacune un identifiant unique et valide', () => {
    const ids = FIGURES.map((figure) => figure.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id).toMatch(FIGURE_ID)
      expect(id.length).toBeLessThanOrEqual(FIGURE_ID_MAX)
    }
  })

  it('sont à jour dans public/figures/ (MAJ_FIGURES=1 pour les récrire)', () => {
    expect(files(), 'aucun fichier sans définition, aucune définition sans fichier').toEqual(
      [...defined].sort(),
    )
    for (const figure of FIGURES) {
      expect(
        readFileSync(fileOf(figure.id), 'utf8'),
        `${figure.id}.svg se récrit avec MAJ_FIGURES=1 (voir l’en-tête de ce test)`,
      ).toBe(figure.svg)
    }
  })
})

describe.each(FIGURES)('illustration « $id »', ({ svg }) => {
  it('occupe 320 de large et de 120 à 260 de haut', () => {
    const match = /^<svg [^>]*width="(\d+)" height="(\d+)" viewBox="0 0 (\d+) (\d+)"/.exec(svg)
    expect(match, 'width, height et viewBox renseignés').not.toBeNull()
    const [, width, height, boxWidth, boxHeight] = match!.map(Number)
    expect(width).toBe(WIDTH)
    expect(boxWidth).toBe(WIDTH)
    expect(boxHeight).toBe(height)
    expect(height).toBeGreaterThanOrEqual(MIN_HEIGHT)
    expect(height).toBeLessThanOrEqual(MAX_HEIGHT)
  })

  it('est autonome et sobre : ni script, ni lien, ni image incorporée, moins de 12 Ko', () => {
    expect(svg).not.toMatch(/<script|<foreignObject|<image|<a[ >]|href=|url\(|<style|@import/i)
    expect(svg).not.toMatch(/\son[a-z]+=/i)
    expect(new TextEncoder().encode(svg).length).toBeLessThan(12 * 1024)
  })

  it('n’utilise que les couleurs de l’application', () => {
    const colors = [...svg.matchAll(/(?:fill|stroke)="(#[0-9a-f]{6})"/g)].map((match) => match[1])
    for (const color of colors) expect(PALETTE, color).toContain(color)
    expect(svg).not.toMatch(/(?:fill|stroke)="(?!#|none)/)
  })

  it('écrit lisiblement : 13 au moins, en 600 ou 700, espaces insécables en entités', () => {
    for (const [, size] of svg.matchAll(/font-size="([\d.]+)"/g)) {
      expect(Number(size)).toBeGreaterThanOrEqual(SMALL_FONT_SIZE)
    }
    for (const [, weight] of svg.matchAll(/font-weight="(\d+)"/g)) {
      expect(['600', '700']).toContain(weight)
    }
    expect(svg).not.toMatch(/[\u00A0\u202F\u200B]/)
    // Nombres à la française : pas de point décimal dans un texte.
    for (const [, content] of svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)) {
      expect(content).not.toMatch(/\d\.\d/)
    }
  })
})

describe('illustrations : les exercices', () => {
  it('ne désignent que des figures qui existent', () => {
    const missing = allReferences.filter((reference) => !defined.has(reference.id))
    expect(missing).toEqual([])
  })

  it('décrivent chaque figure par un texte alternatif utile, sans calcul', () => {
    for (const { where, alt } of allReferences) {
      expect(alt.length, where).toBeGreaterThanOrEqual(15)
      expect(alt.length, where).toBeLessThanOrEqual(200)
      // Le test des égalités lit aussi ce texte : une description, pas un calcul.
      expect(alt, where).not.toMatch(/[=≈*]/)
    }
  })

  it('n’illustrent jamais une correction', () => {
    for (const exercise of exercises) {
      exercise.items.forEach((item, index) => {
        expect(item.explanation, `${exercise.id}, correction ${index + 1}`).not.toMatch(
          /\]\(figure:/,
        )
      })
    }
  })

  it('ne placent une illustration d’énoncé qu’à la fin de l’énoncé', () => {
    for (const exercise of exercises) {
      for (const item of exercise.items) {
        expect(splitPrompt(item.prompt).text, item.prompt).not.toMatch(/\]\(figure:/)
        for (const choice of item.choices) expect(choice).not.toMatch(/\]\(figure:/)
      }
    }
  })

  it('l’exercice modèle est illustré', () => {
    const illustrated = new Set(allReferences.map((reference) => reference.where.split(',')[0]))
    expect(illustrated).toContain('identites-remarquables-cas-simples')
    expect(illustrated).toContain('identites-remarquables-cas-difficiles')
  })
})
