import { describe, expect, it } from 'vitest'
import { csvDate, toCsv } from '../../server/export/csv.js'
import type { AdminBotResponse } from '../../shared/schemas/leaderboard.js'
import type { AdminQuestResponse, StudentQuestResponse } from '../../shared/schemas/quests.js'
import { createTestApp, DAY, HOUR, type TestApp, type TestClient } from '../helpers/test-app.js'

/** L'horloge des tests démarre le mardi 17 novembre 2026 à 10 h UTC, soit 11 h à Paris. */
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff)

interface Scene extends TestApp {
  admin: TestClient
  lea: TestClient
  leaId: string
  leaPublicId: string
}

async function setup(): Promise<Scene> {
  const testApp = createTestApp()
  const admin = testApp.client()
  await admin.signUpAdmin('Coach')
  const lea = testApp.client()
  const user = await lea.signUpStudent('Léa')
  return { ...testApp, admin, lea, leaId: user.id, leaPublicId: user.publicId ?? '' }
}

/** Le fichier exporté, découpé en lignes puis en cellules. */
async function download(admin: TestClient, file: string): Promise<string[][]> {
  const response = await admin.get<string>(`/api/admin/export/${file}.csv`)
  if (response.status !== 200) throw new Error(JSON.stringify(response.body))
  return parse(response.body)
}

/** Lecture d'un CSV à point-virgule, guillemets doublés compris. */
function parse(csv: string): string[][] {
  const rows: string[][] = [[]]
  let cell = ''
  let quoted = false
  const text = csv.startsWith(BYTE_ORDER_MARK) ? csv.slice(1) : csv
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (character === '"') quoted = false
      else cell += character
    } else if (character === '"') quoted = true
    else if (character === ';') {
      rows.at(-1)!.push(cell)
      cell = ''
    } else if (character === '\r' && text[index + 1] === '\n') {
      rows.at(-1)!.push(cell)
      cell = ''
      rows.push([])
      index += 1
    } else cell += character
  }
  // Le fichier se termine par une fin de ligne : la dernière ligne, vide, est retirée.
  return rows.slice(0, -1)
}

async function createQuest(admin: TestClient, overrides: Record<string, unknown> = {}) {
  const response = await admin.post<AdminQuestResponse>('/api/admin/quests', {
    title: 'Courir 20 minutes',
    instructions: 'Cours sans t’arrêter.',
    category: 'sport',
    format: 'declarative',
    difficulty: 'medium',
    rewardXp: 100,
    manualValidation: false,
    deadlineAt: null,
    assignees: 'all',
    publish: true,
    ...overrides,
  })
  if (response.status !== 201) throw new Error(JSON.stringify(response.body))
  return response.body.quest
}

const done = (student: TestClient, questId: string, body: unknown = {}) =>
  student.post<StudentQuestResponse>(`/api/quests/${questId}/attempts`, body)

describe('fabrication d’un fichier CSV', () => {
  it('s’ouvre dans un tableur français : point-virgule, UTF-8 signé, fins de ligne Windows', () => {
    const csv = toCsv({
      header: ['Pseudo', 'XP'],
      rows: [
        ['Léa', 120],
        ['Tom', -50],
      ],
    })

    expect(csv).toBe(`${BYTE_ORDER_MARK}"Pseudo";"XP"\r\n"Léa";120\r\n"Tom";-50\r\n`)
  })

  it('garde entre guillemets les textes à point-virgule, guillemets et retours à la ligne', () => {
    const csv = toCsv({ header: ['Texte'], rows: [['Il a dit « oui » ; puis "non"\nfin'], [null]] })

    expect(csv).toBe(`${BYTE_ORDER_MARK}"Texte"\r\n"Il a dit « oui » ; puis ""non""\nfin"\r\n\r\n`)
  })

  it('neutralise ce qu’un tableur prendrait pour une formule', () => {
    const csv = toCsv({
      header: ['Texte'],
      rows: [['=1+1'], ['+33 6'], ['-Tom-'], ['@admin'], ['Tom-Tom'], ['1 = 1']],
    })

    expect(parse(csv).map((row) => row[0])).toEqual([
      'Texte',
      "'=1+1",
      "'+33 6",
      "'-Tom-",
      "'@admin",
      'Tom-Tom',
      '1 = 1',
    ])
  })

  it('écrit les dates à l’heure de Paris, été comme hiver', () => {
    expect(csvDate('2026-11-17T10:00:00.000Z')).toBe('17/11/2026 11:00')
    expect(csvDate('2026-07-14T22:30:00.000Z')).toBe('15/07/2026 00:30')
    expect(csvDate(null)).toBeNull()
  })
})

describe('export des données', () => {
  it('est réservé à l’admin, et ne connaît que ses quatre fichiers', async () => {
    const scene = await setup()

    expect((await scene.client().get('/api/admin/export/students.csv')).status).toBe(401)
    expect((await scene.lea.get('/api/admin/export/students.csv')).status).toBe(403)
    expect((await scene.admin.get('/api/admin/export/users.csv')).status).toBe(404)
    expect((await scene.admin.get('/api/admin/export/students')).status).toBe(404)
    for (const file of ['students', 'quests', 'assignments', 'xp-journal']) {
      expect((await scene.admin.get(`/api/admin/export/${file}.csv`)).status).toBe(200)
    }
  })

  it('se télécharge sous un nom daté, sans être mis en cache', async () => {
    const scene = await setup()
    const { admin } = scene

    const response = await admin.get<string>('/api/admin/export/students.csv')
    // Les octets tels qu'ils partent : la lecture en texte retire la marque d'en-tête.
    const raw = await scene.app.request(
      'https://grind-up.test/api/admin/export/students.csv',
      { headers: { cookie: `gu_session=${admin.cookie}` } },
      { ip: '203.0.113.10', deployContext: 'production', local: false },
    )
    const bytes = new Uint8Array(await raw.arrayBuffer())

    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8')
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="grind-up-eleves-2026-11-17.csv"',
    )
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    expect(response.body.startsWith('"Pseudo";"Identifiant"')).toBe(true)
  })

  it('élèves : pseudo, identifiant, niveau, XP, missions, série, badges, dates', async () => {
    const scene = await setup()
    const { admin, lea, leaPublicId } = scene
    const tom = scene.client()
    await tom.signUpStudent('Tom')
    const quest = await createQuest(admin, { rewardXp: 300 })
    await done(lea, quest.id)
    await admin.patch(`/api/admin/students/${(await tom.currentUser())!.id}`, { isActive: false })

    const rows = await download(admin, 'students')

    expect(rows[0]).toEqual([
      'Pseudo',
      'Identifiant',
      'Compte',
      'Niveau',
      'XP',
      'Missions',
      'Série en cours (jours)',
      'Record de série (jours)',
      'Badges',
      'Inscription',
      'Dernière activité',
    ])
    expect(rows.slice(1)).toEqual([
      [
        'Léa',
        leaPublicId,
        'Actif',
        '3',
        '300',
        '1',
        '1',
        '1',
        'Premier pas',
        '17/11/2026 11:00',
        '17/11/2026 11:00',
      ],
      [
        'Tom',
        expect.stringMatching(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/),
        'Désactivé',
        '1',
        '0',
        '0',
        '0',
        '0',
        '',
        '17/11/2026 11:00',
        '17/11/2026 11:00',
      ],
    ])
  })

  it('quêtes : réglages et avancement, brouillons compris', async () => {
    const scene = await setup()
    const { admin, lea } = scene
    const sport = await createQuest(admin, { deadlineAt: '2026-11-20T17:00:00.000Z' })
    await done(lea, sport.id)
    scene.advance(HOUR)
    await admin.post<AdminQuestResponse>('/api/admin/quests', {
      title: 'Tables de 7',
      category: 'maths',
      format: 'exact',
      difficulty: 'easy',
      rewardXp: 50,
      passThreshold: 70,
      maxAttempts: 2,
      publish: false,
    })

    const rows = await download(admin, 'quests')

    expect(rows[0]).toContain('Seuil de réussite (%)')
    expect(rows.slice(1)).toEqual([
      [
        'Courir 20 minutes',
        'Sport',
        'Déclaratif',
        'Moyen',
        '100',
        '20/11/2026 18:00',
        'Publiée',
        'Immédiate',
        '',
        '',
        '1',
        '1',
        '0',
        '17/11/2026 11:00',
      ],
      [
        'Tables de 7',
        'Maths',
        'Questions à réponse exacte',
        'Facile',
        '50',
        '',
        'Brouillon',
        'Automatique',
        '70',
        '2',
        '0',
        '0',
        '0',
        '17/11/2026 12:00',
      ],
    ])
  })

  it('réalisations : une ligne par quête et par élève, avec son statut du moment', async () => {
    const scene = await setup()
    const { admin, lea, leaPublicId } = scene
    const expired = await createQuest(admin, {
      title: 'Expirée',
      deadlineAt: '2026-11-17T12:00:00.000Z',
    })
    scene.advance(HOUR)
    const essay = await createQuest(admin, {
      title: 'Résumé',
      category: 'other',
      format: 'free_text',
      instructions: 'Résume le chapitre.',
    })
    await done(lea, essay.id, { text: 'Mon résumé.' })
    const assignmentId = essay.assignments[0]!.id
    await admin.post(`/api/admin/assignments/${assignmentId}/reject`, {
      comment: '=À reprendre ; trop court',
    })
    scene.advance(2 * HOUR)

    const rows = await download(admin, 'assignments')

    expect(rows[0]).toEqual([
      'Quête',
      'Élève',
      'Identifiant',
      'Statut',
      'Deadline',
      'Assignée le',
      'Commencée le',
      'Soumise le',
      'Validée le',
      'XP attribuée',
      'Tentatives',
      'Meilleur score (%)',
      'Commentaire de l’admin',
    ])
    expect(rows.slice(1)).toEqual([
      [
        'Expirée',
        'Léa',
        leaPublicId,
        'Expirée',
        '17/11/2026 13:00',
        '17/11/2026 11:00',
        '',
        '',
        '',
        '',
        '0',
        '',
        '',
      ],
      [
        'Résumé',
        'Léa',
        leaPublicId,
        'Refusée',
        '',
        '17/11/2026 12:00',
        '17/11/2026 12:00',
        '17/11/2026 12:00',
        '',
        '',
        '1',
        '',
        // Un commentaire qui commence par « = » ne devient pas une formule.
        "'=À reprendre ; trop court",
      ],
    ])
    expect(expired.id).not.toBe(essay.id)
  })

  it('journal d’XP : quêtes, bonus, ajustements et bots, du plus ancien au plus récent', async () => {
    const scene = await setup()
    const { admin, lea, leaId, leaPublicId } = scene
    const quest = await createQuest(admin, {
      title: '=SOMME(A1:A9)',
      deadlineAt: '2026-11-20T17:00:00.000Z',
    })
    await done(lea, quest.id)
    scene.advance(HOUR)
    await admin.post(`/api/admin/students/${leaId}/xp`, { amount: -30, reason: 'Retard au cours' })
    const bot = await admin.post<AdminBotResponse>('/api/admin/bots', {
      pseudo: 'Astro',
      avatar: 'astronaut',
      mode: 'regular',
    })
    await admin.post(`/api/admin/bots/${bot.body.bot.id}/adjust`, { missions: 1, xp: 40 })

    const rows = await download(admin, 'xp-journal')

    expect(rows).toEqual([
      [
        'Date',
        'Participant',
        'Identifiant',
        'Rôle',
        'Montant (XP)',
        'Motif',
        'Détail',
        'Quête',
        'Mission',
      ],
      ['17/11/2026 11:00', 'Léa', leaPublicId, 'Élève', '100', 'Quête', '', "'=SOMME(A1:A9)", '1'],
      [
        '17/11/2026 11:00',
        'Léa',
        leaPublicId,
        'Élève',
        '10',
        'Bonus',
        'Bonus d’avance',
        "'=SOMME(A1:A9)",
        '0',
      ],
      [
        '17/11/2026 12:00',
        'Léa',
        leaPublicId,
        'Élève',
        '-30',
        'Ajustement manuel',
        'Retard au cours',
        '',
        '0',
      ],
      [
        '17/11/2026 12:00',
        'Astro',
        '',
        'Bot',
        '0',
        'Ajustement manuel',
        'Ajustement de l’admin',
        '',
        '1',
      ],
      [
        '17/11/2026 12:00',
        'Astro',
        '',
        'Bot',
        '40',
        'Ajustement manuel',
        'Ajustement de l’admin',
        '',
        '0',
      ],
    ])
  })

  it('ne contient ni mot de passe ni identifiant interne', async () => {
    const scene = await setup()
    const { admin, lea, leaId } = scene
    const quest = await createQuest(admin)
    await done(lea, quest.id)
    scene.advance(DAY)
    await admin.post('/api/auth/login', { login: 'Coach', password: 'motdepasse-admin' })
    const hash = await scene
      .database()
      .read((tx) =>
        tx.get<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = ?', [leaId]),
      )

    for (const file of ['students', 'quests', 'assignments', 'xp-journal']) {
      const csv = (await admin.get<string>(`/api/admin/export/${file}.csv`)).body
      expect(csv).not.toContain(leaId)
      expect(csv).not.toContain(quest.id)
      expect(csv).not.toContain(hash!.password_hash)
      expect(csv.toLowerCase()).not.toContain('scrypt')
    }
  })
})
