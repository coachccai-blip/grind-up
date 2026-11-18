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
 * complet (test de déploiement, inscriptions, session, droits, quête, classement,
 * paramètres, export, bibliothèque d'exercices). Un module oublié par l'empaqueteur
 * fait échouer le script.
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
    text,
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

  // 7. Une quête de bout en bout : création, lecture sans les réponses, correction, XP.
  const created = await call(handler, 'POST', '/api/admin/quests', {
    cookie: admin.cookie,
    body: {
      title: 'Quête du paquet',
      category: 'maths',
      format: 'exact',
      difficulty: 'medium',
      rewardXp: 100,
      items: [{ prompt: 'Mot de passe ?', answers: ['sésame-du-paquet'] }],
      assignees: 'all',
      publish: true,
    },
  })
  const questId = created.json?.quest?.id
  check("L'admin crée et publie une quête", created.status === 201, `statut ${created.status}`)
  const mine = await call(handler, 'GET', `/api/quests/${questId}`, { cookie: student.cookie })
  check(
    "L'élève lit sa quête sans la réponse attendue",
    mine.status === 200 && !JSON.stringify(mine.json).includes('sésame-du-paquet'),
    `statut ${mine.status}`,
  )
  const itemId = mine.json?.quest?.items?.[0]?.id
  const attempt = await call(handler, 'POST', `/api/quests/${questId}/attempts`, {
    cookie: student.cookie,
    body: { answers: { [itemId]: ' Sésame-du-paquet ' } },
  })
  check(
    'La réponse est corrigée et la quête validée',
    attempt.json?.quest?.status === 'validated',
    `statut ${attempt.status}`,
  )
  check(
    "L'XP est créditée, bonus sans faute compris",
    attempt.json?.quest?.xpAwarded === 110,
    `${attempt.json?.quest?.xpAwarded} XP`,
  )
  const replay = await call(handler, 'POST', `/api/quests/${questId}/attempts`, {
    cookie: student.cookie,
    body: { answers: { [itemId]: 'sésame-du-paquet' } },
  })
  check('Une quête validée ne se crédite pas deux fois', replay.status === 409)
  const progress = await call(handler, 'GET', '/api/progress', { cookie: student.cookie })
  check(
    'La progression suit : XP, niveau, série et premier badge',
    progress.json?.progress?.xp === 110 &&
      progress.json?.progress?.level?.level === 2 &&
      progress.json?.progress?.streak?.current === 1 &&
      progress.json?.progress?.celebration?.badges?.includes('first_step') === true,
    JSON.stringify(progress.json?.progress?.level),
  )

  // 8. Leaderboard et bots : un bot créé par l'admin entre au classement, l'élève y est premier.
  const bot = await call(handler, 'POST', '/api/admin/bots', {
    cookie: admin.cookie,
    body: { pseudo: 'BotDuPaquet', avatar: 'fox', mode: 'regular' },
  })
  check("L'admin crée un bot", bot.status === 201, `statut ${bot.status}`)
  const board = await call(handler, 'GET', '/api/leaderboard?period=week', {
    cookie: student.cookie,
  })
  const entries = board.json?.entries ?? []
  check(
    "Le leaderboard classe l'élève premier et montre le bot",
    entries[0]?.pseudo === 'EleveDuPaquet' &&
      entries[0]?.rank === 1 &&
      entries.some((entry) => entry.pseudo === 'BotDuPaquet'),
    `statut ${board.status}`,
  )
  check(
    "L'élève ne sait pas quel participant est un bot",
    entries.every((entry) => entry.isBot === false),
  )

  // 9. Finitions : vue d'ensemble, paramètres et export CSV de l'admin.
  const overview = await call(handler, 'GET', '/api/admin/overview', { cookie: admin.cookie })
  check(
    "La vue d'ensemble compte l'élève inscrit",
    overview.json?.overview?.activeStudents === 1,
    `statut ${overview.status}`,
  )
  const settings = await call(handler, 'PATCH', '/api/admin/settings', {
    cookie: admin.cookie,
    body: { latePercent: 40 },
  })
  check(
    'Les paramètres se modifient, le barème du brief reste en place',
    settings.json?.settings?.latePercent === 40 && settings.json?.settings?.rewards?.medium === 100,
    `statut ${settings.status}`,
  )
  const exported = await call(handler, 'GET', '/api/admin/export/students.csv', {
    cookie: admin.cookie,
  })
  check(
    "L'export CSV des élèves se télécharge",
    exported.status === 200 &&
      (exported.headers.get('content-type') ?? '').startsWith('text/csv') &&
      exported.text.includes('"EleveDuPaquet"'),
    `statut ${exported.status}`,
  )
  const forbidden = await call(handler, 'GET', '/api/admin/export/students.csv', {
    cookie: student.cookie,
  })
  check('Un élève ne peut rien exporter', forbidden.status === 403, `statut ${forbidden.status}`)

  // 10. Bibliothèque d'exercices et corrections détaillées : le contenu est bien dans le paquet,
  //     réservé à l'admin, et l'élève ne lit les corrections qu'une fois la quête validée.
  const library = await call(handler, 'GET', '/api/admin/library', { cookie: admin.cookie })
  check(
    "L'admin lit la bibliothèque d'exercices",
    library.status === 200 && (library.json?.exercises?.length ?? 0) >= 2,
    `statut ${library.status}`,
  )
  const libraryAsStudent = await call(handler, 'GET', '/api/admin/library', {
    cookie: student.cookie,
  })
  check('Un élève ne lit pas la bibliothèque', libraryAsStudent.status === 403)
  const exercise = await call(
    handler,
    'GET',
    `/api/admin/library/${library.json?.exercises?.[0]?.id}`,
    { cookie: admin.cookie },
  )
  const exerciseItems = exercise.json?.exercise?.items ?? []
  check(
    'Un exercice arrive avec ses questions et la correction de chacune',
    exerciseItems.length > 0 && exerciseItems.every((item) => item.explanation.length > 0),
    `${exerciseItems.length} questions`,
  )
  check(
    'Un exercice commence par un rappel du cours et un exemple expliqué',
    (exercise.json?.exercise?.lesson ?? '').length > 0 &&
      (exercise.json?.exercise?.example ?? '').includes('Énoncé'),
  )
  check(
    'La bibliothèque couvre plusieurs thèmes du programme',
    (library.json?.themes?.length ?? 0) >= 2,
    `${library.json?.themes?.length} thèmes, ${library.json?.exercises?.length} exercices`,
  )
  const { title, lesson, example, instructions, category, format, difficulty } =
    exercise.json?.exercise ?? {}
  const fromLibrary = await call(handler, 'POST', '/api/admin/quests', {
    cookie: admin.cookie,
    body: {
      title,
      lesson,
      example,
      instructions,
      category,
      format,
      difficulty,
      rewardXp: 50,
      items: exerciseItems,
      assignees: 'all',
      publish: true,
    },
  })
  const libraryQuest = fromLibrary.json?.quest
  check("L'exercice devient une quête publiée", fromLibrary.status === 201)
  const unsolved = await call(handler, 'GET', `/api/quests/${libraryQuest?.id}`, {
    cookie: student.cookie,
  })
  check(
    "L'élève reçoit la quête avec son rappel du cours, sans ses corrections",
    unsolved.status === 200 &&
      unsolved.json?.quest?.lesson === lesson &&
      unsolved.json?.quest?.explanations === null &&
      !unsolved.text.includes('Les pièges'),
    `statut ${unsolved.status}`,
  )
  const solved = await call(handler, 'POST', `/api/quests/${libraryQuest?.id}/attempts`, {
    cookie: student.cookie,
    body: {
      answers: Object.fromEntries(
        (libraryQuest?.items ?? []).map((item) => [item.id, item.correct]),
      ),
    },
  })
  check(
    'Une fois la quête validée, chaque question a sa correction détaillée',
    solved.json?.quest?.status === 'validated' &&
      Object.keys(solved.json?.quest?.explanations ?? {}).length === exerciseItems.length,
    `statut ${solved.status}`,
  )

  // 11. Rien de ce que renvoie la fonction ne contient le code admin.
  const everything = JSON.stringify([
    health,
    student,
    session,
    refused,
    admin,
    asAdmin,
    wrong,
    overview,
    settings,
    exported,
    library,
    exercise,
    solved,
  ])
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
