import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * Typographie française, vérifiée dans les textes affichés :
 * - devant « ! », « ? », « : » et « ; », l'espace est insécable (&nbsp; dans le JSX, le
 *   caractère U+00A0 dans une chaîne), pour que le signe ne se retrouve jamais seul en début
 *   de ligne sur un petit écran ;
 * - un nombre et son unité ne se séparent pas non plus : « 24 h », « 80 % », « 50 XP » ;
 * - l'apostrophe est typographique (’), jamais droite (').
 */
const projectRoot = fileURLToPath(new URL('../..', import.meta.url))

/** Une lettre, un chiffre ou une fermeture, suivi d'une espace ordinaire puis d'un signe double. */
const BREAKABLE_SPACE = /[\p{L}\p{N}»)’'}%] [!?;:](?=[\s"'`<]|$)/u

/** Un nombre, une espace ordinaire, puis son unité. */
const BREAKABLE_UNIT = /\d (?:h|%|XP|min)(?![\p{L}\p{N}])/u

/** La même chose après une valeur calculée : « ${count} XP », « {percent} % ». */
const BREAKABLE_UNIT_AFTER_VALUE = /^ (?:h|%|XP|min)(?![\p{L}\p{N}])/u

/** Une apostrophe droite entre deux lettres : « l'élève » au lieu de « l’élève ». */
const STRAIGHT_APOSTROPHE = /\p{L}'\p{L}/u

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx|mts|mjs)$/.test(entry.name) ? [path] : []
  })
}

interface DisplayedText {
  text: string
  line: number
  /** Vrai si le texte suit une valeur calculée : la suite d'un gabarit, ou du texte JSX. */
  afterValue: boolean
}

/** Textes affichables d'un fichier : texte JSX, chaînes et morceaux de gabarits. */
function displayedTexts(path: string): DisplayedText[] {
  const source = ts.createSourceFile(
    path,
    readFileSync(path, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const texts: DisplayedText[] = []
  const visit = (node: ts.Node) => {
    if (
      ts.isJsxText(node) ||
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      texts.push({
        text: node.text,
        line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1,
        afterValue: ts.isJsxText(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node),
      })
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return texts
}

describe('typographie française', () => {
  it('utilise une espace insécable devant les signes doubles, dans toute l’interface', () => {
    const files = [
      ...sourceFiles(join(projectRoot, 'src')),
      ...sourceFiles(join(projectRoot, 'shared')),
      join(projectRoot, 'server/health.ts'),
      join(projectRoot, 'server/http.ts'),
      join(projectRoot, 'server/app.ts'),
      join(projectRoot, 'server/auth/service.ts'),
    ]

    const offences = files.flatMap((file) =>
      displayedTexts(file)
        .filter(({ text }) => BREAKABLE_SPACE.test(text))
        .map(({ text, line }) => `${relative(projectRoot, file)}:${line} « ${text.trim()} »`),
    )

    expect(offences).toEqual([])
  })

  it('ne sépare jamais un nombre de son unité', () => {
    const files = [
      ...sourceFiles(join(projectRoot, 'src')),
      ...sourceFiles(join(projectRoot, 'shared')),
      ...sourceFiles(join(projectRoot, 'server')),
    ]

    const offences = files.flatMap((file) =>
      displayedTexts(file)
        .filter(
          ({ text, afterValue }) =>
            BREAKABLE_UNIT.test(text) || (afterValue && BREAKABLE_UNIT_AFTER_VALUE.test(text)),
        )
        .map(({ text, line }) => `${relative(projectRoot, file)}:${line} « ${text.trim()} »`),
    )

    expect(offences).toEqual([])
  })

  it('écrit les espaces insécables sous forme échappée, jamais en caractère invisible', () => {
    // Un caractère invisible dans le code ne se distingue pas d'une espace ordinaire à la
    // relecture : on écrit \u00A0 dans une chaîne et &nbsp; dans le JSX.
    const invisible = /[\u00A0\u202F\u200B\u2060\uFEFF]/
    const files = ['src', 'shared', 'server', 'dev', 'netlify', 'tests', 'scripts'].flatMap(
      (directory) => sourceFiles(join(projectRoot, directory)),
    )

    const offences = files.flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .map((line, index) => ({ line, number: index + 1 }))
        .filter(({ line }) => invisible.test(line))
        .map(({ number }) => `${relative(projectRoot, file)}:${number}`),
    )

    expect(offences).toEqual([])
  })

  it('utilise l’apostrophe typographique dans tous les textes affichés', () => {
    const files = [
      ...sourceFiles(join(projectRoot, 'src')),
      ...sourceFiles(join(projectRoot, 'shared')),
      ...sourceFiles(join(projectRoot, 'server')),
    ]

    const offences = files.flatMap((file) =>
      displayedTexts(file)
        .filter(({ text }) => STRAIGHT_APOSTROPHE.test(text))
        .map(({ text, line }) => `${relative(projectRoot, file)}:${line} « ${text.trim()} »`),
    )

    expect(offences).toEqual([])
  })
})
