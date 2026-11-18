#!/usr/bin/env node
/**
 * Vérifie la fonction serveur telle que Netlify l'empaquette.
 *
 * Usage : node scripts/verify-bundle.mjs <dossier du projet construit par `netlify build`>
 *
 * Les autres tests exécutent le code source. Sur Netlify, la fonction tourne
 * sous une autre forme : un paquet où ne figurent que les fichiers que
 * l'empaqueteur a jugés nécessaires. Ce script décompresse ce paquet dans un
 * dossier vide, le charge comme le fait Netlify et lui fait jouer un parcours
 * complet (test de déploiement, inscriptions, session, droits de l'admin). Un
 * module oublié par l'empaqueteur fait échouer le script.
 *
 * Seul le stockage est remplacé : par l'émulateur local de Netlify Blobs.
 */
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { BlobsServer } from '@netlify/blobs/server'
import { unzipSync } from 'fflate'

const SITE = 'https://grind-up.example'
const ADMIN_CODE = 'code-de-verification'
const PUBLIC_ID_PATTERN = /^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/

const builtProject = resolve(process.argv[2] ?? '.')
const failures = []

function check(label, passed, detail = '') {
  console.log(`${passed ? 'OK    ' : 'ÉCHEC '} ${label}${detail ? ` — ${detail}` : ''}`)
  if (!passed) failures.push(label)
}

/** Décompresse le paquet de la fonction « api » dans un dossier vide. */
function unpackFunction(workDirectory) {
  const manifestPath = join(builtProject, '.netlify', 'functions', 'manifest.json')
  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch {
    throw new Error(
      `Aucun paquet de fonction dans ${builtProject} : lancer d'abord « netlify build » dans ce dossier.`,
    )
  }
  const description = manifest.functions.find((entry) => entry.name === 'api')
  if (!description) throw new Error('La fonction « api » est absente du paquet construit.')

  const directory = join(workDirectory, 'function')
  const files = unzipSync(readFileSync(description.path))
  for (const [name, content] of Object.entries(files)) {
    if (name.endsWith('/')) continue
    const target = join(directory, name)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
  return { directory, description, fileCount: Object.keys(files).length }
}

/** Démarre un stockage Blobs local et indique son adresse au paquet. */
async function startStorage(workDirectory) {
  const directory = join(workDirectory, 'blobs')
  mkdirSync(directory, { recursive: true })
  const server = new BlobsServer({ directory, token: 'verification' })
  const { port } = await server.start()
  const address = `http://localhost:${port}`
  process.env.NETLIFY_BLOBS_CONTEXT = Buffer.from(
    JSON.stringify({
      edgeURL: address,
      uncachedEdgeURL: address,
      siteID: 'verification',
      token: 'verification',
    }),
  ).toString('base64')
  return server
}

/** Appelle la fonction comme le ferait Netlify et renvoie statut, corps et cookie de session. */
async function call(handler, method, path, { body, cookie } = {}) {
  const headers = { origin: SITE }
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (cookie) headers.cookie = cookie
  const response = await handler(
    new Request(SITE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    { ip: '203.0.113.7', deploy: { context: 'production' } },
  )
  const text = await response.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    // Une réponse qui n'est pas du JSON est signalée par les vérifications ci-dessous.
  }
  const setCookie = response.headers.getSetCookie()[0] ?? ''
  return {
    status: response.status,
    json,
    setCookie,
    cookie: setCookie.split(';')[0] ?? '',
    headers: response.headers,
  }
}

async function runScenario(handler) {
  // 1. Test de déploiement : base SQLite chargée, écrite puis relue.
  const health = await call(handler, 'GET', '/api/sante')
  const checks = health.json?.checks ?? []
  check(
    'Le test de déploiement répond avec ses vérifications',
    checks.length >= 5,
    `statut ${health.status}`,
  )
  for (const item of checks) {
    if (item.id === 'conditional_write') {
      // Les écritures simultanées dépendent du vrai stockage de Netlify : l'émulateur local ne
      // les garantit pas. Ce point n'est donc pas exigé ici ; la page /sante le vérifie en ligne.
      console.log(`INFO   Test de déploiement : ${item.label} — non exigé avec le stockage local`)
    } else {
      check(`Test de déploiement : ${item.label}`, item.ok === true, item.detail)
    }
  }

  // 2. Inscription d'un élève : validation des saisies, empreinte du mot de passe, cookie.
  const student = await call(handler, 'POST', '/api/auth/signup', {
    body: { pseudo: 'EleveDuPaquet', password: 'motdepasse-solide' },
  })
  check("Inscription d'un élève", student.status === 201, `statut ${student.status}`)
  check(
    "L'élève reçoit un identifiant XXXX-XXXX",
    PUBLIC_ID_PATTERN.test(student.json?.user?.publicId ?? ''),
    student.json?.user?.publicId ?? 'aucun',
  )
  check(
    'Le cookie de session est inaccessible au JavaScript de la page et réservé au https',
    /;\s*HttpOnly/i.test(student.setCookie) &&
      /;\s*Secure/i.test(student.setCookie) &&
      /;\s*SameSite=Lax/i.test(student.setCookie),
  )

  // 3. Session relue à partir du cookie.
  const session = await call(handler, 'GET', '/api/session', { cookie: student.cookie })
  check('La session est reconnue', session.json?.user?.pseudo === 'EleveDuPaquet')

  // 4. Code admin lu dans la variable d'environnement, jamais dans le paquet par défaut.
  const refused = await call(handler, 'POST', '/api/auth/signup', {
    body: { pseudo: 'FauxAdmin', password: 'motdepasse-solide', specialCode: 'SuperAdmin' },
  })
  check(
    'Le code par défaut est refusé quand ADMIN_SIGNUP_CODE est défini',
    refused.status >= 400 && refused.cookie === '',
    `statut ${refused.status}`,
  )
  const admin = await call(handler, 'POST', '/api/auth/signup', {
    body: { pseudo: 'AdminDuPaquet', password: 'motdepasse-solide', specialCode: ADMIN_CODE },
  })
  check("Inscription d'un admin avec le code défini", admin.json?.user?.role === 'admin')

  // 5. Droits : la liste des élèves est réservée à l'admin.
  const asVisitor = await call(handler, 'GET', '/api/admin/students')
  const asStudent = await call(handler, 'GET', '/api/admin/students', { cookie: student.cookie })
  const asAdmin = await call(handler, 'GET', '/api/admin/students', { cookie: admin.cookie })
  check('Un visiteur ne lit pas la liste des élèves', asVisitor.status === 401)
  check('Un élève ne lit pas la liste des élèves', asStudent.status === 403)
  check(
    "L'admin lit la liste des élèves",
    asAdmin.status === 200 && JSON.stringify(asAdmin.json).includes('EleveDuPaquet'),
    `statut ${asAdmin.status}`,
  )

  // 6. Connexion : mauvais mot de passe refusé, bon mot de passe accepté.
  const wrong = await call(handler, 'POST', '/api/auth/login', {
    body: { login: 'EleveDuPaquet', password: 'mauvais-mot-de-passe' },
  })
  const right = await call(handler, 'POST', '/api/auth/login', {
    body: { login: student.json?.user?.publicId ?? '', password: 'motdepasse-solide' },
  })
  check('Un mauvais mot de passe est refusé', wrong.status === 401, `statut ${wrong.status}`)
  check("La connexion par l'identifiant fonctionne", right.status === 200, `statut ${right.status}`)

  // 7. Rien de ce que renvoie la fonction ne contient le code admin.
  const everything = JSON.stringify([health, student, session, refused, admin, asAdmin, wrong])
  check('Le code admin ne figure dans aucune réponse', !everything.includes(ADMIN_CODE))
}

const workDirectory = mkdtempSync(join(tmpdir(), 'grind-up-paquet-'))
let storage
try {
  const { directory, description, fileCount } = unpackFunction(workDirectory)
  console.log(
    `Paquet « ${description.name} » : ${fileCount} fichiers, empaqueteur ${description.bundler}, ${description.runtimeVersion}.\n`,
  )
  storage = await startStorage(workDirectory)
  // Ni NETLIFY_DEV ni NETLIFY_LOCAL : le paquet se comporte comme sur un site publié.
  delete process.env.NETLIFY_DEV
  delete process.env.NETLIFY_LOCAL
  process.env.ADMIN_SIGNUP_CODE = ADMIN_CODE

  const entry = await import(pathToFileURL(join(directory, 'netlify/functions/api.mjs')).href)
  check(
    'La fonction déclare répondre sous /api/',
    JSON.stringify(entry.config?.path ?? '').includes('/api/*'),
    JSON.stringify(entry.config),
  )
  await runScenario(entry.default)
} catch (error) {
  check(
    'Le paquet se charge et répond',
    false,
    error instanceof Error ? error.stack : String(error),
  )
} finally {
  await storage?.stop()
  rmSync(workDirectory, { recursive: true, force: true })
}

if (failures.length > 0) {
  console.error(`\n${failures.length} vérification(s) en échec.`)
  process.exit(1)
}
console.log('\nLa fonction empaquetée fonctionne.')
