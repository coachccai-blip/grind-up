import { randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto'
import { PUBLIC_ID_ALPHABET } from '../../shared/rules/public-id.js'

/**
 * Mots de passe : hachés avec scrypt, intégré à Node (aucun module à compiler).
 * Les réglages sont enregistrés avec chaque empreinte, ce qui permet de les
 * durcir plus tard sans invalider les mots de passe existants.
 */
export interface ScryptParameters {
  /** Coût (N) : puissance de 2. */
  cost: number
  /** Taille de bloc (r). */
  blockSize: number
  /** Parallélisation (p). */
  parallelization: number
}

/** Réglages recommandés par l'OWASP pour scrypt : N = 2^17, r = 8, p = 1 (environ 130 Mo par calcul). */
export const DEFAULT_SCRYPT: ScryptParameters = { cost: 2 ** 17, blockSize: 8, parallelization: 1 }

const KEY_LENGTH = 32
const SALT_LENGTH = 16

function derive(password: string, salt: Buffer, parameters: ScryptParameters): Promise<Buffer> {
  const { cost, blockSize, parallelization } = parameters
  return new Promise((resolve, reject) => {
    scrypt(
      // Même mot de passe, même empreinte, quel que soit le clavier qui l'a saisi.
      password.normalize('NFKC'),
      salt,
      KEY_LENGTH,
      { N: cost, r: blockSize, p: parallelization, maxmem: 256 * cost * blockSize },
      (error, key) => (error ? reject(error) : resolve(key)),
    )
  })
}

export async function hashPassword(
  password: string,
  parameters: ScryptParameters = DEFAULT_SCRYPT,
): Promise<string> {
  const salt = randomBytes(SALT_LENGTH)
  const key = await derive(password, salt, parameters)
  const { cost, blockSize, parallelization } = parameters
  return [
    'scrypt',
    cost,
    blockSize,
    parallelization,
    salt.toString('base64url'),
    key.toString('base64url'),
  ].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, cost, blockSize, parallelization, salt, key] = stored.split('$')
  if (scheme !== 'scrypt' || !cost || !blockSize || !parallelization || !salt || !key) return false
  const expected = Buffer.from(key, 'base64url')
  const actual = await derive(password, Buffer.from(salt, 'base64url'), {
    cost: Number(cost),
    blockSize: Number(blockSize),
    parallelization: Number(parallelization),
  })
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

/**
 * Mot de passe temporaire donné par l'admin : 12 caractères sans ambiguïté, en
 * trois blocs de 4, dans le même esprit que l'identifiant d'un élève.
 */
export function generateTemporaryPassword(): string {
  const characters = Array.from(
    { length: 12 },
    () => PUBLIC_ID_ALPHABET[randomInt(PUBLIC_ID_ALPHABET.length)],
  ).join('')
  return `${characters.slice(0, 4)}-${characters.slice(4, 8)}-${characters.slice(8, 12)}`
}
