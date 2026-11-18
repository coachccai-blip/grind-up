import { describe, expect, it } from 'vitest'
import {
  generateTemporaryPassword,
  hashPassword,
  verifyPassword,
} from '../../server/auth/passwords.js'
import { signSession, verifySession } from '../../server/auth/session.js'
import { drawPublicId, drawUnusedPublicId } from '../../server/auth/users.js'
import { SqliteBlobDatabase } from '../../server/db/database.js'
import { migrations } from '../../server/db/migrations/index.js'
import { AVATARS } from '../../shared/rules/avatars.js'
import { checkPseudo, pseudoKey } from '../../shared/rules/pseudo.js'
import {
  normalizePublicId,
  PUBLIC_ID_ALPHABET,
  PUBLIC_ID_PATTERN,
} from '../../shared/rules/public-id.js'
import { MemoryBlobStore } from '../helpers/memory-blob-store.js'

const FAST_SCRYPT = { cost: 2 ** 10, blockSize: 8, parallelization: 1 }

describe('identifiant public', () => {
  it('a la forme XXXX-XXXX : 8 majuscules ou chiffres en deux blocs de 4', () => {
    for (let draw = 0; draw < 500; draw += 1) {
      expect(drawPublicId()).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    }
  })

  it('exclut les caractères ambigus 0, O, 1, I et L', () => {
    expect(PUBLIC_ID_ALPHABET).toHaveLength(31)
    for (const ambiguous of ['0', 'O', '1', 'I', 'L']) {
      expect(PUBLIC_ID_ALPHABET).not.toContain(ambiguous)
    }
    const drawn = Array.from({ length: 500 }, drawPublicId).join('')
    expect(drawn).not.toMatch(/[0O1IL]/)
    expect(PUBLIC_ID_PATTERN.test('XH9T-U89G')).toBe(true)
    expect(PUBLIC_ID_PATTERN.test('XH0T-U89G')).toBe(false)
    expect(PUBLIC_ID_PATTERN.test('XHLT-U89G')).toBe(false)
  })

  it('est tiré au hasard : deux tirages ne se répètent pas', () => {
    const drawn = new Set(Array.from({ length: 2000 }, drawPublicId))
    expect(drawn.size).toBe(2000)
  })

  it('est retiré tant qu’il existe déjà en base', async () => {
    const database = new SqliteBlobDatabase({
      store: new MemoryBlobStore(),
      key: 'db/test.sqlite',
      migrations,
      backups: null,
    })
    await database.write((tx) =>
      tx.run(
        `INSERT INTO users (id, role, pseudo, pseudo_key, public_id, password_hash, avatar, created_at)
         VALUES ('u1', 'student', 'Léa', 'lea', 'AAAA-AAAA', 'x', 'fox', '2026-11-17T10:00:00.000Z')`,
      ),
    )
    const draws = ['AAAA-AAAA', 'AAAA-AAAA', 'BBBB-BBBB']

    const fresh = await database.read((tx) => drawUnusedPublicId(tx, () => draws.shift()!))
    expect(fresh).toBe('BBBB-BBBB')

    await expect(database.read((tx) => drawUnusedPublicId(tx, () => 'AAAA-AAAA'))).rejects.toThrow(
      /identifiant unique/,
    )
  })

  it('reste unique en base, quoi qu’il arrive', async () => {
    const database = new SqliteBlobDatabase({
      store: new MemoryBlobStore(),
      key: 'db/test.sqlite',
      migrations,
      backups: null,
    })
    const insert = (id: string, key: string) =>
      database.write((tx) =>
        tx.run(
          `INSERT INTO users (id, role, pseudo, pseudo_key, public_id, password_hash, avatar, created_at)
           VALUES (?, 'student', ?, ?, 'AAAA-AAAA', 'x', 'fox', '2026-11-17T10:00:00.000Z')`,
          [id, key, key],
        ),
      )
    await insert('u1', 'lea')

    await expect(insert('u2', 'tom')).rejects.toThrow(/UNIQUE/)
  })

  it('se reconnaît malgré les minuscules, les espaces ou le tiret oublié', () => {
    expect(normalizePublicId('xh9t-u89g')).toBe('XH9T-U89G')
    expect(normalizePublicId(' XH9TU89G ')).toBe('XH9T-U89G')
    expect(normalizePublicId('xh9t u89g')).toBe('XH9T-U89G')
    expect(normalizePublicId('Léa')).toBeNull()
    expect(normalizePublicId('XH9T-U89')).toBeNull()
    expect(normalizePublicId('XH0T-U89G')).toBeNull()
  })
})

describe('pseudo', () => {
  it('accepte 3 à 20 lettres, chiffres, tirets et tirets bas', () => {
    for (const pseudo of ['Léa', 'tom_2012', 'Super-Zoé', 'ÀÉÎÕÜ', 'a'.repeat(20), 'Ünïcødé']) {
      expect(checkPseudo(pseudo), pseudo).toBeNull()
    }
  })

  it('refuse les longueurs hors limites', () => {
    expect(checkPseudo('ab')).toBe('length')
    expect(checkPseudo('a'.repeat(21))).toBe('length')
    expect(checkPseudo('')).toBe('length')
  })

  it('refuse les espaces et les autres signes', () => {
    for (const pseudo of ['Super Léa', 'léa!', 'tom@home', '<b>tom</b>', 'a.b.c', '🦊🦊🦊']) {
      expect(checkPseudo(pseudo), pseudo).toBe('characters')
    }
  })

  it('refuse un pseudo qui ressemble à un identifiant', () => {
    expect(checkPseudo('XH9T-U89G')).toBe('looks_like_identifier')
    expect(checkPseudo('xh9tu89g')).toBe('looks_like_identifier')
  })

  it('compare sans tenir compte des majuscules ni des accents', () => {
    expect(pseudoKey('Léa')).toBe('lea')
    expect(pseudoKey('LÉA')).toBe(pseudoKey('lea'))
    expect(pseudoKey('  Zoë ')).toBe('zoe')
    expect(pseudoKey('Tom')).not.toBe(pseudoKey('Tim'))
  })
})

describe('mots de passe', () => {
  it('ne sont jamais conservés en clair et se vérifient', async () => {
    const hash = await hashPassword('correct horse battery', FAST_SCRYPT)

    expect(hash).toMatch(/^scrypt\$1024\$8\$1\$/)
    expect(hash).not.toContain('correct horse battery')
    expect(await verifyPassword('correct horse battery', hash)).toBe(true)
    expect(await verifyPassword('correct horse batterie', hash)).toBe(false)
  })

  it('donnent une empreinte différente à chaque fois, grâce au sel', async () => {
    const first = await hashPassword('même mot de passe', FAST_SCRYPT)
    const second = await hashPassword('même mot de passe', FAST_SCRYPT)

    expect(first).not.toBe(second)
  })

  it('refusent une empreinte illisible', async () => {
    expect(await verifyPassword('peu importe', 'pas-une-empreinte')).toBe(false)
    expect(await verifyPassword('peu importe', '')).toBe(false)
  })

  it('temporaires : 12 caractères sans ambiguïté, en trois blocs', () => {
    const temporary = generateTemporaryPassword()

    expect(temporary).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/)
    expect(generateTemporaryPassword()).not.toBe(temporary)
  })
})

describe('jeton de session', () => {
  const key = Buffer.from('k'.repeat(32))
  const claims = { userId: 'user-1', sessionVersion: 3, issuedAt: 1000, expiresAt: 2000 }

  it('se vérifie avec la bonne clé avant son expiration', () => {
    expect(verifySession(signSession(claims, key), key, 1500)).toEqual(claims)
  })

  it('est refusé une fois expiré', () => {
    const token = signSession(claims, key)

    expect(verifySession(token, key, 1999)).toEqual(claims)
    expect(verifySession(token, key, 2000)).toBeNull()
  })

  it('est refusé s’il a été modifié ou signé avec une autre clé', () => {
    const token = signSession(claims, key)
    const [version, payload, signature] = token.split('.') as [string, string, string]
    const forgedPayload = Buffer.from(
      JSON.stringify({ u: 'admin', v: 3, i: 1000, e: 2000 }),
    ).toString('base64url')

    expect(verifySession(`${version}.${forgedPayload}.${signature}`, key, 1500)).toBeNull()
    expect(verifySession(`${version}.${payload}.${signature.slice(0, -2)}xx`, key, 1500)).toBeNull()
    expect(verifySession(token, Buffer.from('x'.repeat(32)), 1500)).toBeNull()
    expect(verifySession('n-importe-quoi', key, 1500)).toBeNull()
    expect(verifySession('', key, 1500)).toBeNull()
  })
})

describe('galerie d’avatars', () => {
  it('propose une trentaine d’avatars aux clés uniques', () => {
    expect(AVATARS.length).toBeGreaterThanOrEqual(28)
    expect(new Set(AVATARS.map((avatar) => avatar.id)).size).toBe(AVATARS.length)
    expect(new Set(AVATARS.map((avatar) => avatar.emoji)).size).toBe(AVATARS.length)
  })
})
