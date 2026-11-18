import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { listLibrary, listLibraryThemes } from '../../server/library/index.js'
import { findDifficulty } from '../../shared/rules/quests.js'

/**
 * Le README présente le catalogue de la bibliothèque. Ce test le compare aux
 * exercices réellement livrés : un exercice ajouté, renommé ou retiré sans mise
 * à jour du README le fait échouer.
 *
 * Pour récrire le tableau du README :
 *   MAJ_CATALOGUE=1 npx vitest run tests/unit/library-catalogue.test.ts
 */
const readmePath = fileURLToPath(new URL('../../README.md', import.meta.url))
const START = '<!-- catalogue : début -->'
const END = '<!-- catalogue : fin -->'

/** Le README s'écrit avec des espaces ordinaires et des apostrophes droites. */
const plain = (text: string) => text.replace(/\s/g, ' ').replace(/’/g, "'")

const width = (text: string) => [...text].length

/** Un tableau Markdown aux colonnes alignées, tel que Prettier le met en forme. */
function table(rows: readonly (readonly string[])[]): string {
  const [header = []] = rows
  const widths = header.map((_, column) =>
    Math.max(3, ...rows.map((row) => width(row[column] ?? ''))),
  )
  const line = (cells: readonly string[]) =>
    `| ${cells.map((cell, column) => cell + ' '.repeat((widths[column] ?? 0) - width(cell))).join(' | ')} |`
  return [
    line(header),
    line(widths.map((size) => '-'.repeat(size))),
    ...rows.slice(1).map(line),
  ].join('\n')
}

function catalogue(): string {
  const exercises = listLibrary()
  const rows = listLibraryThemes().flatMap((theme) =>
    exercises
      .filter((exercise) => exercise.theme === theme.id)
      .map((exercise) => [
        theme.label,
        plain(exercise.title),
        findDifficulty(exercise.difficulty).label,
        `${exercise.itemCount}, ${exercise.format === 'qcm' ? 'QCM' : 'réponses à saisir'}`,
      ]),
  )
  const count = `**${exercises.length} exercices, ${listLibraryThemes().length} thèmes.**`
  return `${count}\n\n${table([['Thème', 'Exercice', 'Difficulté', 'Questions'], ...rows])}`
}

it('le README présente le catalogue exact de la bibliothèque', () => {
  const readme = readFileSync(readmePath, 'utf8')
  const start = readme.indexOf(START)
  const end = readme.indexOf(END)
  expect(start, `le README garde le repère ${START}`).toBeGreaterThan(-1)
  expect(end, `le README garde le repère ${END}`).toBeGreaterThan(start)

  const expected = `${START}\n\n${catalogue()}\n\n`
  if (process.env.MAJ_CATALOGUE) {
    writeFileSync(readmePath, readme.slice(0, start) + expected + readme.slice(end))
    return
  }
  expect(
    readme.slice(start, end),
    'le catalogue du README se récrit avec MAJ_CATALOGUE=1 (voir l’en-tête de ce test)',
  ).toBe(expected)
})
