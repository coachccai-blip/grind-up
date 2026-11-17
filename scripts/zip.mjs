#!/usr/bin/env node
/**
 * Fabrique le zip à déposer sur Netlify : `npm run zip`.
 *
 * Le zip contient le projet tel que Netlify doit le construire (code source,
 * netlify.toml, fonctions, migrations), sans node_modules, sans .git et sans
 * fichier .env. Il s'appelle quetes-v<version>.zip, d'après la version de package.json.
 *
 * Options : --out <dossier> pour écrire le zip ailleurs qu'à la racine du projet.
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { zipSync } from 'fflate'

const MEGABYTE = 1024 * 1024
/** Seuils au-delà desquels Netlify recommande un autre mode de déploiement. */
const MAX_ZIP_BYTES = 50 * MEGABYTE
const MAX_FILE_BYTES = 10 * MEGABYTE

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Dossiers et fichiers qui ne doivent jamais se retrouver dans le zip. */
const EXCLUDED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  '.netlify',
  'coverage',
  'playwright-report',
  'test-results',
])
const isSecretFile = (name) => name === '.env' || name.startsWith('.env.')
const isArchive = (name) => name.endsWith('.zip')

function isExcluded(path) {
  const parts = path.split('/')
  const name = parts.at(-1)
  return (
    parts.slice(0, -1).some((part) => EXCLUDED_DIRECTORIES.has(part)) ||
    isSecretFile(name) ||
    isArchive(name)
  )
}

/** Fichiers suivis par Git ou nouveaux, hors fichiers ignorés par .gitignore. */
function listWithGit() {
  const output = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { cwd: projectRoot, encoding: 'utf8', maxBuffer: 64 * MEGABYTE },
  )
  return output.split('\0').filter(Boolean)
}

/** Sans Git (dossier téléchargé tel quel) : parcours du dossier, hors exclusions. */
function listByWalking(directory = projectRoot) {
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRECTORIES.has(entry.name)) files.push(...listByWalking(path))
    } else if (entry.isFile()) {
      files.push(relative(projectRoot, path).split(sep).join('/'))
    }
  }
  return files
}

function listProjectFiles() {
  let candidates
  try {
    candidates = listWithGit()
  } catch {
    candidates = listByWalking()
  }
  // Git liste aussi les fichiers supprimés mais pas encore validés : on ne garde que ceux qui existent.
  return [...new Set(candidates)]
    .filter((path) => !isExcluded(path))
    .filter((path) => statSync(join(projectRoot, path), { throwIfNoEntry: false })?.isFile())
    .sort()
}

function fail(message) {
  console.error(`\nÉchec : ${message}`)
  process.exit(1)
}

function outputDirectory() {
  const index = process.argv.indexOf('--out')
  if (index === -1) return projectRoot
  const value = process.argv[index + 1]
  if (!value) fail('--out attend un dossier.')
  return resolve(value)
}

const { version } = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'))
const files = listProjectFiles()

for (const required of ['netlify.toml', 'package.json', 'package-lock.json', 'README.md']) {
  if (!files.includes(required)) fail(`le fichier ${required} est introuvable.`)
}

const entries = {}
for (const path of files) {
  const content = readFileSync(join(projectRoot, path))
  if (content.length > MAX_FILE_BYTES) {
    fail(`${path} pèse ${(content.length / MEGABYTE).toFixed(1)} Mo (10 Mo au plus par fichier).`)
  }
  entries[path] = new Uint8Array(content)
}

const archive = zipSync(entries, { level: 9 })
if (archive.length > MAX_ZIP_BYTES) {
  fail(`le zip pèse ${(archive.length / MEGABYTE).toFixed(1)} Mo (50 Mo au plus).`)
}

const zipPath = join(outputDirectory(), `quetes-v${version}.zip`)
writeFileSync(zipPath, archive)

console.log(`${zipPath}`)
console.log(`${files.length} fichiers, ${(archive.length / 1024).toFixed(0)} Ko`)
