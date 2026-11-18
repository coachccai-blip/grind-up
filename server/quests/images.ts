import { randomUUID } from 'node:crypto'
import type { Context } from 'hono'
import type { AppEnv, Storage } from '../context.js'
import type { SqlReader, SqlWriter } from '../db/sqlite.js'
import { ApiError, notFound } from '../http.js'
import { findQuest, type QuestRow } from './store.js'

/**
 * Image facultative de la consigne d'une quête.
 *
 * L'image est rangée dans le stockage de fichiers, à côté de la base et non
 * dedans : la base, relue et réécrite en entier à chaque changement, reste
 * légère. Chaque envoi reçoit un nouvel emplacement ; l'adresse servie à
 * l'interface change donc avec l'image, et le navigateur peut la garder en cache.
 */
export const IMAGE_MAX_BYTES = 1_500_000
/** Longueur maximale de l'image encodée en base64, en-tête compris. */
export const IMAGE_MAX_DATA_URL_LENGTH = Math.ceil((IMAGE_MAX_BYTES * 4) / 3) + 64

const FORMATS = [
  { type: 'image/jpeg', extension: 'jpg', signature: [0xff, 0xd8, 0xff] },
  {
    type: 'image/png',
    extension: 'png',
    signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  // « RIFF » ; le format WebP est contrôlé plus bas, quatre octets plus loin.
  { type: 'image/webp', extension: 'webp', signature: [0x52, 0x49, 0x46, 0x46] },
] as const

const invalidImage = (message: string) =>
  new ApiError(400, 'invalid_image', message, { fields: { image: message } })

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0) =>
  signature.every((value, index) => bytes[offset + index] === value)

/**
 * Lit une image envoyée sous forme d'adresse « data: ». Seules les images
 * JPEG, PNG et WebP sont acceptées, et leur contenu doit correspondre au type
 * annoncé : aucun fichier d'un autre genre ne peut se faire passer pour une image.
 */
export function parseImageDataUrl(dataUrl: string): { bytes: Uint8Array; extension: string } {
  const match = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/]+=*)$/.exec(dataUrl)
  const format = FORMATS.find((candidate) => candidate.type === match?.[1])
  if (!match || !format) {
    throw invalidImage('Choisissez une image au format JPEG, PNG ou WebP.')
  }
  const bytes = new Uint8Array(Buffer.from(match[2] ?? '', 'base64'))
  if (bytes.length === 0 || bytes.length > IMAGE_MAX_BYTES) {
    throw invalidImage('Cette image est trop lourde.')
  }
  const isWebp = format.type !== 'image/webp' || startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  if (!startsWith(bytes, format.signature) || !isWebp) {
    throw invalidImage('Ce fichier n’est pas une image lisible.')
  }
  return { bytes, extension: format.extension }
}

const contentTypeOf = (key: string) =>
  FORMATS.find((format) => key.endsWith(`.${format.extension}`))?.type ?? 'application/octet-stream'

const newImageKey = (questId: string, extension: string) =>
  `images/${questId}/${randomUUID()}.${extension}`

/** Adresse de l'image d'une quête pour l'interface, ou null. Elle change avec l'image. */
export function imageUrl(quest: QuestRow, audience: 'admin' | 'student'): string | null {
  if (!quest.image_key) return null
  const version = quest.image_key.split('/').at(-1)?.split('.')[0] ?? ''
  const base = audience === 'admin' ? '/api/admin/quests' : '/api/quests'
  return `${base}/${quest.id}/image?v=${version}`
}

function setImageKey(tx: SqlWriter, questId: string, key: string | null, now: Date): void {
  tx.run('UPDATE quests SET image_key = ?, updated_at = ? WHERE id = ?', [
    key,
    now.toISOString(),
    questId,
  ])
}

/** Supprime un fichier d'image sans faire échouer l'opération en cours. */
async function discard(storage: Storage, key: string | null | undefined): Promise<void> {
  if (!key) return
  try {
    await storage.store.delete(key)
  } catch (error) {
    console.error('[grind-up] Image non supprimée du stockage.', error)
  }
}

/** Enregistre l'image d'une quête, à la place de la précédente s'il y en avait une. */
export async function saveQuestImage(
  storage: Storage,
  questId: string,
  dataUrl: string,
  now: Date,
): Promise<void> {
  const { bytes, extension } = parseImageDataUrl(dataUrl)
  const before = await storage.database.read((tx) => findQuest(tx, questId))
  if (!before) throw notFound('Cette quête est introuvable.')

  const key = newImageKey(questId, extension)
  await storage.store.write(key, bytes)
  try {
    await storage.database.write((tx) => {
      if (!findQuest(tx, questId)) throw notFound('Cette quête est introuvable.')
      setImageKey(tx, questId, key, now)
    })
  } catch (error) {
    await discard(storage, key)
    throw error
  }
  await discard(storage, before.image_key)
}

export async function removeQuestImage(
  storage: Storage,
  questId: string,
  now: Date,
): Promise<void> {
  const previous = await storage.database.write((tx) => {
    const quest = findQuest(tx, questId)
    if (!quest) throw notFound('Cette quête est introuvable.')
    setImageKey(tx, questId, null, now)
    return quest.image_key
  })
  await discard(storage, previous)
}

/** Donne à la copie d'une quête sa propre copie de l'image. */
export async function copyQuestImage(
  storage: Storage,
  sourceKey: string | null,
  copyId: string,
  now: Date,
): Promise<void> {
  if (!sourceKey) return
  const source = await storage.store.read(sourceKey)
  if (source.status !== 'found') return
  const key = newImageKey(copyId, sourceKey.split('.').at(-1) ?? 'jpg')
  await storage.store.write(key, source.blob.bytes)
  await storage.database.write((tx) => setImageKey(tx, copyId, key, now))
}

export const discardQuestImage = discard

/** Sert l'image d'une quête que l'appelant a le droit de voir. */
export async function serveQuestImage(
  c: Context<AppEnv>,
  find: (tx: SqlReader) => QuestRow,
): Promise<Response> {
  const quest = await c.var.storage.database.read(find)
  const stored = quest.image_key ? await c.var.storage.store.read(quest.image_key) : null
  if (!quest.image_key || stored?.status !== 'found') {
    throw notFound('Cette image est introuvable.')
  }
  return c.body(stored.blob.bytes as Uint8Array<ArrayBuffer>, 200, {
    'Content-Type': contentTypeOf(quest.image_key),
    // L'adresse change avec l'image : le navigateur de l'utilisateur peut la garder.
    'Cache-Control': 'private, max-age=31536000, immutable',
    'Content-Disposition': 'inline',
  })
}
