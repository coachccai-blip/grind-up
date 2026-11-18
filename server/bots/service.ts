import { randomUUID } from 'node:crypto'
import {
  adaptiveTarget,
  BOT_DAY_END_HOUR,
  BOT_DAY_START_HOUR,
  drawMissionXp,
  drawWeekSchedule,
  type BotMode,
  type BotTarget,
  type DifficultyMix,
  type Random,
} from '../../shared/rules/bots.js'
import type { RewardTable } from '../../shared/rules/settings.js'
import { levelFromXp } from '../../shared/rules/levels.js'
import { periodStart, type LeaderboardPeriod } from '../../shared/rules/leaderboard.js'
import { pseudoKey } from '../../shared/rules/pseudo.js'
import { shiftDay } from '../../shared/rules/streak.js'
import type {
  AdjustBotRequest,
  AdminBot,
  CreateBotRequest,
  UpdateBotRequest,
} from '../../shared/schemas/leaderboard.js'
import { instantToParisLocal, mondayOf, parisDay } from '../../shared/time.js'
import { pseudoTaken } from '../auth/service.js'
import { isPseudoTaken } from '../auth/users.js'
import type { SqlReader, SqlRow, SqlWriter } from '../db/sqlite.js'
import { notFound } from '../http.js'
import { standingsBetween } from '../leaderboard/service.js'
import { totalsOf } from '../progress/totals.js'
import { readGameSettings } from '../settings/service.js'

/**
 * Bots : de faux participants créés par l'admin. Ils ne peuvent pas se
 * connecter et ne reçoivent pas de quêtes ; leur progression s'écrit dans le
 * même journal d'XP que celle des élèves, quand un classement est demandé.
 */
const HOUR_MS = 60 * 60 * 1000
/** Semaines reprises au plus quand personne n'a ouvert le classement depuis longtemps. */
const CATCH_UP_WEEKS = 12

interface BotRow extends SqlRow {
  id: string
  pseudo: string
  avatar: string
  created_at: string
  mode: BotMode
  missions_per_week: number
  target: BotTarget
  difficulty_mix: string
  capped: number
  state: 'active' | 'paused'
  schedule_week: string | null
  schedule: string
  progressed_at: string
}

const BOT_COLUMNS = `
  SELECT users.id, users.pseudo, users.avatar, users.created_at, bot_settings.*
  FROM users JOIN bot_settings ON bot_settings.user_id = users.id
  WHERE users.role = 'bot'
`

const botNotFound = () => notFound('Ce bot est introuvable.')

function parseJson<Value>(text: string, fallback: Value): Value {
  try {
    return JSON.parse(text) as Value
  } catch {
    return fallback
  }
}

const mixOf = (row: BotRow): DifficultyMix =>
  parseJson<DifficultyMix>(row.difficulty_mix, { easy: 0, medium: 1, hard: 0, epic: 0 })

function findBot(tx: SqlReader, id: string): BotRow | undefined {
  return tx.get<BotRow>(`${BOT_COLUMNS} AND users.id = ?`, [id])
}

function toAdminBot(tx: SqlReader, row: BotRow, now: Date): AdminBot {
  const totals = totalsOf(tx, row.id)
  const week = standingsBetween(tx, periodStart('week', now), null).get(row.id)
  return {
    id: row.id,
    pseudo: row.pseudo,
    avatar: row.avatar,
    mode: row.mode,
    missionsPerWeek: row.missions_per_week,
    target: row.target,
    difficultyMix: mixOf(row),
    capped: row.capped === 1,
    paused: row.state === 'paused',
    missions: Math.max(0, totals.missions),
    xp: totals.xp,
    level: levelFromXp(totals.xp),
    missionsThisWeek: week?.missions ?? 0,
    createdAt: row.created_at,
  }
}

export function listBots(tx: SqlReader, now: Date): AdminBot[] {
  return tx
    .all<BotRow>(`${BOT_COLUMNS} ORDER BY users.pseudo_key`)
    .map((row) => toAdminBot(tx, row, now))
}

export function readBot(tx: SqlReader, id: string, now: Date): AdminBot {
  const row = findBot(tx, id)
  if (!row) throw botNotFound()
  return toAdminBot(tx, row, now)
}

export function createBot(tx: SqlWriter, request: CreateBotRequest, now: Date): string {
  if (isPseudoTaken(tx, request.pseudo)) throw pseudoTaken()
  const id = randomUUID()
  const at = now.toISOString()
  // Un bot n'a ni identifiant public ni mot de passe : il ne peut pas se connecter.
  tx.run(
    `INSERT INTO users (id, role, pseudo, pseudo_key, avatar, created_at)
     VALUES (?, 'bot', ?, ?, ?, ?)`,
    [id, request.pseudo, pseudoKey(request.pseudo), request.avatar, at],
  )
  tx.run(
    `INSERT INTO bot_settings (
       user_id, mode, missions_per_week, target, difficulty_mix, capped, state, progressed_at
     ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
    [
      id,
      request.mode,
      request.missionsPerWeek,
      request.target,
      JSON.stringify(request.difficultyMix),
      request.capped ? 1 : 0,
      at,
    ],
  )
  return id
}

export function updateBot(tx: SqlWriter, id: string, changes: UpdateBotRequest, now: Date): void {
  const row = findBot(tx, id)
  if (!row) throw botNotFound()

  if (changes.pseudo !== undefined && isPseudoTaken(tx, changes.pseudo, id)) throw pseudoTaken()
  if (changes.pseudo !== undefined || changes.avatar !== undefined) {
    const pseudo = changes.pseudo ?? row.pseudo
    tx.run('UPDATE users SET pseudo = ?, pseudo_key = ?, avatar = ? WHERE id = ?', [
      pseudo,
      pseudoKey(pseudo),
      changes.avatar ?? row.avatar,
      id,
    ])
  }

  const state = changes.paused === undefined ? row.state : changes.paused ? 'paused' : 'active'
  // Un rythme changé ou une reprise après une pause repartent de maintenant : rien n'est
  // rattrapé, et le planning de la semaine est tiré à nouveau.
  const restarts =
    (changes.mode !== undefined && changes.mode !== row.mode) ||
    (changes.missionsPerWeek !== undefined && changes.missionsPerWeek !== row.missions_per_week) ||
    (row.state === 'paused' && state === 'active')
  tx.run(
    `UPDATE bot_settings SET
       mode = ?, missions_per_week = ?, target = ?, difficulty_mix = ?, capped = ?, state = ?,
       schedule_week = ?, schedule = ?, progressed_at = ?
     WHERE user_id = ?`,
    [
      changes.mode ?? row.mode,
      changes.missionsPerWeek ?? row.missions_per_week,
      changes.target ?? row.target,
      changes.difficultyMix ? JSON.stringify(changes.difficultyMix) : row.difficulty_mix,
      changes.capped === undefined ? row.capped : changes.capped ? 1 : 0,
      state,
      restarts ? null : row.schedule_week,
      restarts ? '[]' : row.schedule,
      restarts ? now.toISOString() : row.progressed_at,
      id,
    ],
  )
}

/** Supprime un bot : il disparaît du leaderboard, passé compris. */
export function deleteBot(tx: SqlWriter, id: string): void {
  if (!findBot(tx, id)) throw botNotFound()
  tx.run(`DELETE FROM users WHERE id = ? AND role = 'bot'`, [id])
}

function addEntry(
  tx: SqlWriter,
  botId: string,
  entry: { amount: number; mission: -1 | 0 | 1; reason: 'bot' | 'manual'; at: string },
): void {
  tx.run(
    `INSERT INTO xp_entries (id, user_id, amount, reason, detail, mission_delta, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      botId,
      entry.amount,
      entry.reason,
      entry.reason === 'manual' ? 'Ajustement de l’admin' : null,
      entry.mission,
      entry.at,
    ],
  )
}

/** Ajustement manuel d'un bot par l'admin : des missions et de l'XP, en plus ou en moins. */
export function adjustBot(tx: SqlWriter, id: string, change: AdjustBotRequest, now: Date): void {
  if (!findBot(tx, id)) throw botNotFound()
  const at = now.toISOString()
  const step = change.missions > 0 ? 1 : -1
  for (let count = 0; count < Math.abs(change.missions); count += 1) {
    addEntry(tx, id, { amount: 0, mission: step, reason: 'manual', at })
  }
  if (change.xp !== 0) addEntry(tx, id, { amount: change.xp, mission: 0, reason: 'manual', at })
}

// --- Progression des bots ----------------------------------------------------------------------

const PERIODS: readonly LeaderboardPeriod[] = ['week', 'month', 'all']

/** Les élèves réels : ceux par rapport à qui un bot se place, et qu'il ne doit pas dépasser. */
function realStudentIds(tx: SqlReader): string[] {
  return tx
    .all<{ id: string }>(`SELECT id FROM users WHERE role = 'student' AND is_active = 1`)
    .map((row) => row.id)
}

/**
 * Plafond « ne dépasse jamais le premier élève réel » : sur la semaine, le mois
 * et depuis toujours, le bot doit rester derrière le meilleur élève, en missions
 * comme en XP, une fois la mission créditée.
 */
function staysBehindStudents(
  tx: SqlReader,
  botId: string,
  students: readonly string[],
  xp: number,
  now: Date,
): boolean {
  return PERIODS.every((period) => {
    const done = standingsBetween(tx, periodStart(period, now), null)
    const best = students.reduce(
      (top, id) => ({
        missions: Math.max(top.missions, done.get(id)?.missions ?? 0),
        xp: Math.max(top.xp, done.get(id)?.xp ?? 0),
      }),
      { missions: 0, xp: 0 },
    )
    const bot = done.get(botId) ?? { missions: 0, xp: 0 }
    return bot.missions + 1 < best.missions && bot.xp + xp < best.xp
  })
}

/** Ce qui vaut pour tous les bots d'un même passage. */
interface Round {
  /** Les élèves réels, par rapport à qui un bot se place. */
  students: readonly string[]
  now: Date
  random: Random
  /** Le barème d'XP des paramètres, où est tirée l'XP de chaque mission. */
  rewards: RewardTable
}

/** Crédite une mission au bot, sauf si son plafond l'interdit. */
function creditMission(tx: SqlWriter, bot: BotRow, at: string, round: Round): void {
  const xp = drawMissionXp(mixOf(bot), round.random, round.rewards)
  if (bot.capped === 1 && !staysBehindStudents(tx, bot.id, round.students, xp, round.now)) return
  addEntry(tx, bot.id, { amount: xp, mission: 1, reason: 'bot', at })
}

/** Bot régulier : crédite les missions de son planning dont l'heure est passée. */
function advanceRegular(tx: SqlWriter, bot: BotRow, round: Round): void {
  const { now, random } = round
  const thisWeek = mondayOf(parisDay(now))
  const oldest = shiftDay(thisWeek, -7 * (CATCH_UP_WEEKS - 1))
  const startWeek = mondayOf(parisDay(new Date(bot.progressed_at)))
  let schedule: string[] = []

  for (
    let week = startWeek < oldest ? oldest : startWeek;
    week <= thisWeek;
    week = shiftDay(week, 7)
  ) {
    // Au début de chaque semaine, le serveur tire au sort les jours et les heures des missions.
    schedule =
      week === bot.schedule_week
        ? parseJson<string[]>(bot.schedule, [])
        : drawWeekSchedule(week, bot.missions_per_week, random)
    for (const instant of schedule) {
      // Une mission compte dès que son heure est passée ; elle est datée de cette heure.
      if (instant > bot.progressed_at && instant <= now.toISOString()) {
        creditMission(tx, bot, instant, round)
      }
    }
  }
  tx.run(
    'UPDATE bot_settings SET schedule_week = ?, schedule = ?, progressed_at = ? WHERE user_id = ?',
    [thisWeek, JSON.stringify(schedule), now.toISOString(), bot.id],
  )
}

const isDaytime = (now: Date) => {
  const hour = Number(instantToParisLocal(now).slice(11, 13))
  return hour >= BOT_DAY_START_HOUR && hour < BOT_DAY_END_HOUR
}

/**
 * Bot adaptatif : sa position est réévaluée au plus une fois par heure, et il
 * avance d'une mission à la fois, entre 8 h et 21 h, pour éviter les sauts brutaux.
 */
function advanceAdaptive(tx: SqlWriter, bot: BotRow, round: Round): void {
  const { now, students } = round
  const week = standingsBetween(tx, periodStart('week', now), null)
  const goal = adaptiveTarget(
    bot.target,
    students.map((id) => week.get(id)?.missions ?? 0),
  )
  if ((week.get(bot.id)?.missions ?? 0) < goal) {
    creditMission(tx, bot, now.toISOString(), round)
  }
  tx.run('UPDATE bot_settings SET progressed_at = ? WHERE user_id = ?', [now.toISOString(), bot.id])
}

function adaptiveIsDue(bot: BotRow, now: Date): boolean {
  return isDaytime(now) && now.getTime() - new Date(bot.progressed_at).getTime() >= HOUR_MS
}

function regularIsDue(bot: BotRow, now: Date): boolean {
  if (bot.schedule_week !== mondayOf(parisDay(now))) return true
  const nowIso = now.toISOString()
  return parseJson<string[]>(bot.schedule, []).some(
    (instant) => instant > bot.progressed_at && instant <= nowIso,
  )
}

function activeBots(tx: SqlReader): BotRow[] {
  return tx.all<BotRow>(`${BOT_COLUMNS} AND bot_settings.state = 'active' ORDER BY users.id`)
}

const isDue = (bot: BotRow, now: Date) =>
  bot.mode === 'regular' ? regularIsDue(bot, now) : adaptiveIsDue(bot, now)

/** Vrai si un bot au moins a de la progression à faire : évite une écriture inutile. */
export function botsAreDue(tx: SqlReader, now: Date): boolean {
  return activeBots(tx).some((bot) => isDue(bot, now))
}

/**
 * Fait progresser les bots jusqu'à maintenant. Appelée quand un classement est
 * demandé : aucune tâche planifiée ne tourne entre deux visites.
 */
export function advanceBots(tx: SqlWriter, now: Date, random: Random): void {
  const round: Round = {
    students: realStudentIds(tx),
    now,
    random,
    rewards: readGameSettings(tx).rewards,
  }
  for (const bot of activeBots(tx)) {
    if (!isDue(bot, now)) continue
    if (bot.mode === 'regular') advanceRegular(tx, bot, round)
    else advanceAdaptive(tx, bot, round)
  }
}
