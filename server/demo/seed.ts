import type { Random } from '../../shared/rules/bots.js'
import { shiftDay } from '../../shared/rules/streak.js'
import { createBotRequestSchema } from '../../shared/schemas/leaderboard.js'
import {
  attemptRequestSchema,
  saveQuestRequestSchema,
  type AttemptRequest,
} from '../../shared/schemas/quests.js'
import { parisDay, parisLocalToInstant } from '../../shared/time.js'
import { insertUser } from '../auth/users.js'
import { advanceBots, createBot, updateBot } from '../bots/service.js'
import type { SqlWriter } from '../db/sqlite.js'
import { awardPodiums, podiumIsDue } from '../leaderboard/service.js'
import { adjustXp } from '../progress/service.js'
import {
  archiveQuest,
  createQuest,
  rejectSubmission,
  validateSubmission,
} from '../quests/admin-service.js'
import { findAssignmentOf, findQuest, listItems } from '../quests/store.js'
import { startMyQuest, submitAttempt } from '../quests/student-service.js'

/**
 * Données de démonstration (section 11 du brief) : 1 admin, 6 élèves, 3 bots et
 * 10 quêtes couvrant tous les formats, avec trois semaines d'activité.
 *
 * Rien n'est écrit « à la main » dans les tables de progression : chaque quête
 * est créée, réalisée et validée par les mêmes fonctions que l'application, à
 * une date simulée. L'XP, les bonus, les séries, les badges et le classement
 * sont donc ceux que les règles auraient produits.
 */
export class DemoError extends Error {
  override name = 'DemoError'
}

export interface DemoOptions {
  /** L'instant présent : l'histoire de la démonstration se termine ici. */
  now: Date
  /** Hasard des bots (planning et XP de leurs missions). */
  random: Random
  /** Empreinte du mot de passe commun à tous les comptes de démonstration. */
  passwordHash: string
}

export interface DemoSummary {
  admin: string
  students: string[]
  bots: string[]
  quests: number
}

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS

const ADMIN = 'Coach'

/** Les six élèves, avec leur avatar. Des pseudos, pas des prénoms : c'est ce que conseille l'inscription. */
const STUDENTS = [
  { pseudo: 'Luciole', avatar: 'butterfly' },
  { pseudo: 'Kiwi', avatar: 'frog' },
  { pseudo: 'Zébulon', avatar: 'wizard' },
  { pseudo: 'Mistigri', avatar: 'cat' },
  { pseudo: 'Pistache', avatar: 'hamster' },
  { pseudo: 'Flocon', avatar: 'penguin' },
] as const
type Student = (typeof STUDENTS)[number]['pseudo']

type QuestKey =
  | 'tables'
  | 'capitals'
  | 'running'
  | 'fractions'
  | 'summary'
  | 'plank'
  | 'revolution'
  | 'proportions'
  | 'verbs'
  | 'talk'

/** Ce que l'élève envoie : un commentaire, un texte, ou des réponses dont `wrong` sont fausses. */
interface Answer {
  wrong?: number
  comment?: string
  text?: string
}

export function seedDemo(tx: SqlWriter, options: DemoOptions): DemoSummary {
  const { now, random, passwordHash } = options

  const existing = tx.get<{ count: number }>('SELECT COUNT(*) AS count FROM users')?.count ?? 0
  if (existing > 0) {
    throw new DemoError(
      'La base contient déjà des comptes : la démonstration ne s’installe que dans une base vide.',
    )
  }

  // --- Le temps de la démonstration ------------------------------------------------------------

  const today = parisDay(now)
  /** Il y a `days` jours, à cette heure de Paris. */
  const ago = (days: number, time: string): Date => {
    const instant = parisLocalToInstant(`${shiftDay(today, -days)}T${time}`)
    if (!instant) throw new DemoError(`Heure invalide\u00A0: ${time}`)
    return instant
  }
  /** Dans `days` jours, à cette heure de Paris. */
  const ahead = (days: number, time: string): Date => ago(-days, time)
  const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * MINUTE_MS)

  const steps: { at: Date; run: () => void }[] = []
  /** Prévoit une action à un instant donné ; toutes sont jouées dans l'ordre du temps. */
  const plan = (at: Date, run: () => void) => {
    if (at.getTime() <= now.getTime()) steps.push({ at, run })
  }

  // --- Comptes ---------------------------------------------------------------------------------

  const start = ago(20, '18:00')
  const adminId = insertUser(tx, { role: 'admin', pseudo: ADMIN, passwordHash, now: start }).id
  const studentIds = {} as Record<Student, string>
  const lastSeen = {} as Record<Student, Date>
  for (const { pseudo, avatar } of STUDENTS) {
    const user = insertUser(tx, { role: 'student', pseudo, passwordHash, now: start })
    tx.run('UPDATE users SET avatar = ? WHERE id = ?', [avatar, user.id])
    studentIds[pseudo] = user.id
    lastSeen[pseudo] = start
  }
  const seen = (pseudo: Student, at: Date) => {
    if (at.getTime() > lastSeen[pseudo].getTime()) lastSeen[pseudo] = at
  }

  // --- Quêtes : dix, dans les cinq formats -----------------------------------------------------

  const questIds = {} as Record<QuestKey, string>
  const quest = (key: QuestKey, at: Date, input: Record<string, unknown>) =>
    plan(at, () => {
      const request = saveQuestRequestSchema.parse({ assignees: 'all', publish: true, ...input })
      questIds[key] = createQuest(tx, request, adminId, at)
    })

  quest('tables', ago(19, '09:00'), {
    title: 'Tables de 7 et de 8',
    instructions: 'Réponds **sans calculatrice**. Tu as trois essais.',
    category: 'maths',
    format: 'exact',
    difficulty: 'easy',
    rewardXp: 50,
    deadlineAt: ago(14, '18:00').toISOString(),
    items: [
      { prompt: '7 × 8\u00A0?', answers: ['56'] },
      { prompt: '8 × 6\u00A0?', answers: ['48'] },
      { prompt: '7 × 9\u00A0?', answers: ['63'] },
      { prompt: '8 × 8\u00A0?', answers: ['64'] },
    ],
  })

  quest('capitals', ago(18, '09:00'), {
    title: 'Capitales d’Europe',
    instructions: 'Parcours les cartes, puis passe le test.',
    category: 'memorization',
    format: 'flashcards',
    difficulty: 'medium',
    rewardXp: 100,
    deadlineAt: ago(12, '18:00').toISOString(),
    items: [
      { prompt: 'Italie', answers: ['Rome'] },
      { prompt: 'Espagne', answers: ['Madrid'] },
      { prompt: 'Allemagne', answers: ['Berlin'] },
      { prompt: 'Portugal', answers: ['Lisbonne'] },
      { prompt: 'Pologne', answers: ['Varsovie'] },
    ],
  })

  quest('running', ago(17, '09:00'), {
    title: '20 minutes de course',
    instructions:
      'Cours **20 minutes** sans t’arrêter, à ton rythme. Note ta distance ou ton ressenti en commentaire.',
    category: 'sport',
    format: 'declarative',
    difficulty: 'easy',
    rewardXp: 50,
    manualValidation: false,
    deadlineAt: ago(13, '20:00').toISOString(),
  })

  quest('fractions', ago(12, '09:00'), {
    title: 'Fractions\u00A0: le bon choix',
    instructions: 'Une ou plusieurs réponses par question.',
    category: 'maths',
    format: 'qcm',
    difficulty: 'medium',
    rewardXp: 100,
    deadlineAt: ago(7, '18:00').toISOString(),
    items: [
      {
        prompt: 'Quelle fraction est égale à 1/2\u00A0?',
        choices: ['2/4', '1/3', '3/5'],
        correct: [0],
      },
      {
        prompt: 'Quelles fractions sont plus grandes que 1\u00A0?',
        choices: ['3/2', '2/3', '7/4'],
        correct: [0, 2],
      },
      {
        prompt: 'Combien font 1/4 + 1/4\u00A0?',
        choices: ['1/8', '1/2', '2/8'],
        correct: [1],
      },
      {
        prompt: 'Quelle fraction est la plus petite\u00A0?',
        choices: ['1/10', '1/2', '1/5'],
        correct: [0],
      },
    ],
  })

  quest('summary', ago(11, '09:00'), {
    title: 'Résume le chapitre 3 de ton livre',
    instructions:
      'Écris un résumé de **cinq à dix lignes**\u00A0:\n- les personnages\n- ce qui se passe\n- ce que tu en as pensé',
    category: 'other',
    format: 'free_text',
    difficulty: 'hard',
    rewardXp: 200,
    deadlineAt: ago(5, '18:00').toISOString(),
  })

  quest('plank', ago(6, '09:00'), {
    title: 'Gainage\u00A0: 3 fois 1 minute',
    instructions:
      'Fais **3 séries d’une minute** de gainage, avec 30 secondes de repos entre chaque. Dis-moi en commentaire comment ça s’est passé.',
    category: 'sport',
    format: 'declarative',
    difficulty: 'medium',
    rewardXp: 100,
    manualValidation: true,
    deadlineAt: ahead(3, '20:00').toISOString(),
  })

  // Sa deadline tombe dans une trentaine d'heures : elle figure parmi celles qui expirent bientôt.
  const revolutionDeadline = new Date(Math.ceil((now.getTime() + 30 * HOUR_MS) / HOUR_MS) * HOUR_MS)
  quest('revolution', ago(5, '09:00'), {
    title: 'Révolution française\u00A0: les dates clés',
    instructions: 'Relis ta leçon, puis réponds. Il faut **80\u00A0%** de bonnes réponses.',
    category: 'memorization',
    format: 'qcm',
    difficulty: 'hard',
    rewardXp: 200,
    deadlineAt: revolutionDeadline.toISOString(),
    items: [
      {
        prompt: 'En quelle année la Bastille est-elle prise\u00A0?',
        choices: ['1789', '1792', '1804'],
        correct: [0],
      },
      {
        prompt: 'Que proclame-t-on en septembre 1792\u00A0?',
        choices: ['L’Empire', 'La République', 'La Restauration'],
        correct: [1],
      },
      {
        prompt: 'Quel texte est adopté en août 1789\u00A0?',
        choices: [
          'Le Code civil',
          'La Déclaration des droits de l’homme et du citoyen',
          'L’édit de Nantes',
        ],
        correct: [1],
      },
      {
        prompt: 'Qui devient empereur en 1804\u00A0?',
        choices: ['Louis XVI', 'Robespierre', 'Napoléon Bonaparte'],
        correct: [2],
      },
    ],
  })

  quest('proportions', ago(3, '09:00'), {
    title: 'Problèmes de proportionnalité',
    instructions: 'Écris seulement le nombre, sans l’unité.',
    category: 'maths',
    format: 'exact',
    difficulty: 'hard',
    rewardXp: 200,
    deadlineAt: ahead(5, '18:00').toISOString(),
    items: [
      {
        prompt: '3 cahiers coûtent 6 €. Combien coûtent 5 cahiers, en euros\u00A0?',
        answers: ['10'],
      },
      {
        prompt:
          'Une voiture roule à 90 km/h. Quelle distance parcourt-elle en 20 minutes, en kilomètres\u00A0?',
        answers: ['30'],
      },
      {
        prompt:
          'Pour 4 personnes, il faut 300 g de farine. Combien de grammes pour 6 personnes\u00A0?',
        answers: ['450'],
      },
    ],
  })

  quest('verbs', ago(1, '17:00'), {
    title: 'Verbes irréguliers anglais',
    instructions: 'Retrouve le prétérit de chaque verbe.',
    category: 'memorization',
    format: 'flashcards',
    difficulty: 'medium',
    rewardXp: 100,
    deadlineAt: null,
    items: [
      { prompt: 'to go', answers: ['went'] },
      { prompt: 'to see', answers: ['saw'] },
      { prompt: 'to take', answers: ['took'] },
      { prompt: 'to buy', answers: ['bought'] },
      { prompt: 'to think', answers: ['thought'] },
    ],
  })

  // Un brouillon : pas encore visible des élèves.
  quest('talk', ago(1, '18:30'), {
    title: 'Exposé\u00A0: mon animal préféré',
    instructions:
      'Prépare un exposé de **5 minutes** sur ton animal préféré\u00A0: où il vit, ce qu’il mange, pourquoi tu l’as choisi.',
    category: 'other',
    format: 'free_text',
    difficulty: 'epic',
    rewardXp: 400,
    deadlineAt: null,
    publish: false,
  })

  // La course est passée : la quête est archivée, l'XP gagnée reste.
  plan(ago(9, '08:40'), () => archiveQuest(tx, questIds.running, ago(9, '08:40')))

  // --- Ce que font les élèves ------------------------------------------------------------------

  /** Les réponses à une quête corrigée automatiquement, dont les `wrong` premières sont fausses. */
  const answersTo = (questId: string, wrong: number): AttemptRequest['answers'] => {
    const format = findQuest(tx, questId)?.format
    const items = listItems(tx, questId)
    const answers: AttemptRequest['answers'] = {}
    items.forEach((item, index) => {
      const isWrong = index < wrong
      if (format === 'exact') answers[item.id] = isWrong ? '0' : (item.answers[0] ?? '')
      if (format === 'qcm') {
        const miss = item.choices.findIndex((_, position) => !item.correct.includes(position))
        answers[item.id] = isWrong ? [miss] : item.correct
      }
      // Au test des cartes, l'élève désigne la carte qui porte la bonne réponse.
      if (format === 'flashcards') {
        answers[item.id] = isWrong ? items[(index + 1) % items.length]!.id : item.id
      }
    })
    return answers
  }

  /** L'élève ouvre la quête : elle passe « En cours ». */
  const open = (pseudo: Student, key: QuestKey, at: Date) =>
    plan(at, () => {
      startMyQuest(tx, studentIds[pseudo], questIds[key], at)
      seen(pseudo, at)
    })

  /** L'élève ouvre la quête, puis y répond quelques minutes plus tard. */
  const attempt = (pseudo: Student, key: QuestKey, at: Date, answer: Answer = {}) =>
    plan(at, () => {
      const studentId = studentIds[pseudo]
      const questId = questIds[key]
      startMyQuest(tx, studentId, questId, new Date(at.getTime() - 6 * MINUTE_MS))
      const request = attemptRequestSchema.parse({
        answers: answersTo(questId, answer.wrong ?? 0),
        comment: answer.comment ?? '',
        text: answer.text ?? '',
      })
      submitAttempt(tx, studentId, questId, request, at)
      seen(pseudo, at)
    })

  const assignmentOf = (pseudo: Student, key: QuestKey): string => {
    const assignment = findAssignmentOf(tx, questIds[key], studentIds[pseudo])
    if (!assignment) throw new DemoError(`${pseudo} n’a pas la quête «\u00A0${key}\u00A0».`)
    return assignment.id
  }

  const validate = (pseudo: Student, key: QuestKey, at: Date, comment = '') =>
    plan(at, () => void validateSubmission(tx, assignmentOf(pseudo, key), comment, at))

  // Luciole : régulière, en avance, sans faute. Une quête validée chaque jour où elle en a une.
  attempt('Luciole', 'tables', ago(19, '17:10'))
  attempt('Luciole', 'capitals', ago(18, '17:30'))
  attempt('Luciole', 'running', ago(17, '18:05'), { comment: '3,2 km, sans m’arrêter.' })
  attempt('Luciole', 'fractions', ago(12, '17:15'))
  attempt('Luciole', 'summary', ago(11, '18:20'), {
    text: 'Dans ce chapitre, Lila découvre la lettre cachée dans le grenier. Elle hésite à la montrer à son frère, puis décide de mener l’enquête seule. J’ai aimé le suspense de la fin.',
  })
  validate('Luciole', 'summary', ago(10, '08:30'), 'Très bon résumé, clair et complet.')
  plan(ago(8, '12:00'), () =>
    adjustXp(tx, studentIds.Luciole, 50, 'Aide apportée à un camarade', ago(8, '12:00')),
  )
  attempt('Luciole', 'plank', ago(6, '18:00'), { comment: 'La troisième série était dure.' })
  validate('Luciole', 'plank', ago(5, '08:15'))
  attempt('Luciole', 'revolution', ago(5, '17:40'))
  attempt('Luciole', 'proportions', ago(3, '17:20'))
  attempt('Luciole', 'verbs', ago(1, '18:10'))

  // Kiwi : solide en maths, moins en sport.
  attempt('Kiwi', 'tables', ago(19, '18:30'))
  attempt('Kiwi', 'capitals', ago(18, '19:00'), { wrong: 1 })
  attempt('Kiwi', 'fractions', ago(11, '17:00'))
  attempt('Kiwi', 'summary', ago(9, '17:30'), {
    text: 'Lila trouve une vieille lettre et veut savoir qui l’a écrite. Son frère ne la croit pas. Elle commence à chercher des indices dans le village.',
  })
  validate('Kiwi', 'summary', ago(8, '08:30'))
  attempt('Kiwi', 'revolution', ago(5, '18:30'), { wrong: 2 })
  attempt('Kiwi', 'revolution', ago(4, '17:45'))
  attempt('Kiwi', 'proportions', ago(3, '18:40'))
  attempt('Kiwi', 'plank', ago(2, '18:10'), { comment: 'Fait après le goûter, 3 séries.' })
  // Aujourd'hui : le classement de la semaine n'est jamais vide.
  attempt('Kiwi', 'verbs', minutesAgo(95), { wrong: 1 })

  // Zébulon : il lui faut souvent un deuxième essai.
  attempt('Zébulon', 'tables', ago(18, '17:45'), { wrong: 2 })
  attempt('Zébulon', 'tables', ago(17, '17:20'))
  attempt('Zébulon', 'running', ago(16, '11:00'), { comment: '2,5 km.' })
  attempt('Zébulon', 'capitals', ago(14, '18:15'), { wrong: 3 })
  attempt('Zébulon', 'fractions', ago(10, '18:00'), { wrong: 1 })
  attempt('Zébulon', 'fractions', ago(9, '17:10'))
  attempt('Zébulon', 'summary', ago(6, '19:00'), { text: 'Lila trouve une lettre. C’est bien.' })
  // Refusé après la deadline : la quête est rouverte pour lui, il peut recommencer.
  plan(ago(4, '08:20'), () => {
    rejectSubmission(
      tx,
      assignmentOf('Zébulon', 'summary'),
      {
        comment:
          'C’est un bon début, mais trop court\u00A0: présente les personnages et raconte ce qui se passe.',
        reopen: true,
      },
      ago(4, '08:20'),
    )
  })
  attempt('Zébulon', 'plank', ago(4, '18:20'), { comment: 'Deux séries seulement.' })
  attempt('Zébulon', 'revolution', ago(1, '17:30'), { wrong: 2 })
  attempt('Zébulon', 'revolution', minutesAgo(50))

  // Mistigri : appliquée, bloquée sur les problèmes de proportionnalité.
  attempt('Mistigri', 'tables', ago(19, '19:10'))
  attempt('Mistigri', 'capitals', ago(17, '17:50'))
  attempt('Mistigri', 'running', ago(15, '10:30'), { comment: 'Avec ma sœur, 20 minutes pile.' })
  attempt('Mistigri', 'fractions', ago(10, '17:40'))
  attempt('Mistigri', 'summary', ago(7, '18:10'), {
    text: 'Lila, l’héroïne, découvre une lettre dans le grenier de sa grand-mère. Son frère Tom pense que c’est une blague. Elle décide de retrouver l’auteur de la lettre. J’ai bien aimé ce chapitre.',
  })
  validate('Mistigri', 'summary', ago(6, '08:20'), 'Bien, les personnages sont présentés.')
  attempt('Mistigri', 'revolution', ago(4, '17:20'))
  attempt('Mistigri', 'proportions', ago(2, '17:00'), { wrong: 2 })
  attempt('Mistigri', 'proportions', ago(2, '17:20'), { wrong: 1 })
  attempt('Mistigri', 'proportions', ago(1, '17:05'), { wrong: 1 })
  attempt('Mistigri', 'verbs', minutesAgo(140))

  // Pistache : irrégulier, pas venu depuis trois jours.
  attempt('Pistache', 'tables', ago(17, '19:00'), { wrong: 1 })
  attempt('Pistache', 'tables', ago(16, '18:10'))
  attempt('Pistache', 'running', ago(14, '18:00'), { comment: 'J’ai marché un peu à la fin.' })
  attempt('Pistache', 'plank', ago(3, '18:30'), { comment: 'Trois séries, c’était long.' })

  // Flocon : bien parti, puis plus de nouvelles depuis dix jours.
  attempt('Flocon', 'tables', ago(19, '17:40'))
  attempt('Flocon', 'capitals', ago(18, '17:50'))
  attempt('Flocon', 'running', ago(17, '17:10'), { comment: '3 km.' })
  attempt('Flocon', 'fractions', ago(11, '18:00'))
  open('Flocon', 'summary', ago(10, '18:30'))

  // --- Bots et classement ----------------------------------------------------------------------

  const bots = [
    { pseudo: 'Astro', avatar: 'astronaut', mode: 'regular', missionsPerWeek: 2, capped: false },
    { pseudo: 'Comète', avatar: 'fox', mode: 'adaptive', target: 'middle', capped: true },
    { pseudo: 'Pixel', avatar: 'ninja', mode: 'regular', missionsPerWeek: 4, capped: true },
  ] as const
  const botIds: Record<string, string> = {}
  for (const bot of bots) {
    const at = ago(bot.pseudo === 'Pixel' ? 12 : 18, '08:00')
    plan(at, () => {
      botIds[bot.pseudo] = createBot(tx, createBotRequestSchema.parse(bot), at)
    })
  }
  // Un bot en pause garde sa place et ne progresse plus.
  plan(ago(2, '12:00'), () => updateBot(tx, botIds.Pixel!, { paused: true }, ago(2, '12:00')))

  // Aucune tâche planifiée : les bots avancent quand un classement est demandé. La
  // démonstration rejoue ces visites, deux par jour, puis une dernière maintenant.
  const visit = (at: Date) =>
    plan(at, () => {
      advanceBots(tx, at, random)
      if (podiumIsDue(tx, at)) awardPodiums(tx, at)
    })
  for (let days = 18; days >= 0; days -= 1) {
    visit(ago(days, '13:00'))
    visit(ago(days, '20:00'))
  }
  visit(now)

  // --- Déroulement -----------------------------------------------------------------------------

  steps.sort((first, second) => first.at.getTime() - second.at.getTime())
  for (const step of steps) step.run()

  // Dernière visite de chacun. Kiwi, Mistigri et Zébulon sont venus aujourd'hui, Luciole
  // hier ; Pistache il y a trois jours, Flocon il y a dix jours.
  for (const { pseudo } of STUDENTS) {
    tx.run('UPDATE users SET last_active_at = ? WHERE id = ?', [
      lastSeen[pseudo].toISOString(),
      studentIds[pseudo],
    ])
  }
  tx.run('UPDATE users SET last_active_at = ? WHERE id = ?', [now.toISOString(), adminId])

  // Les élèves ont déjà vu l'annonce de leurs quêtes validées et de leurs badges, sauf
  // Luciole pour sa dernière quête : l'annonce l'attend à sa prochaine visite.
  const pending = findAssignmentOf(tx, questIds.verbs, studentIds.Luciole)
  tx.run(
    `UPDATE assignments SET celebrated_at = validated_at
     WHERE status = 'validated' AND id != ?`,
    [pending?.id ?? ''],
  )
  tx.run('UPDATE badges SET seen_at = earned_at WHERE NOT (user_id = ? AND earned_at >= ?)', [
    studentIds.Luciole,
    pending?.validated_at ?? now.toISOString(),
  ])

  return {
    admin: ADMIN,
    students: STUDENTS.map((student) => student.pseudo),
    bots: bots.map((bot) => bot.pseudo),
    quests: Object.keys(questIds).length,
  }
}
