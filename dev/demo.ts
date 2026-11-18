import { randomInt } from 'node:crypto'
import { hashPassword } from '../server/auth/passwords.js'
import { loadConfig } from '../server/config.js'
import { seedDemo, type DemoSummary } from '../server/demo/seed.js'
import { localDeployContext, localSettings } from '../server/local.js'
import { getStorage } from '../server/runtime.js'
import { startLocalBlobs } from './local-netlify.js'

/**
 * Installe les données de démonstration dans la base locale, celle de
 * `npm run dev`. Appelé par scripts/demo.mjs.
 */
export interface DemoInstallation extends DemoSummary {
  /** Mot de passe commun à tous les comptes, tiré au sort à chaque installation. */
  password: string
}

/** Un mot de passe facile à recopier : quatre blocs de trois lettres minuscules. */
function drawPassword(): string {
  const letters = 'abcdefghjkmnpqrstuvwxyz'
  const block = () => Array.from({ length: 3 }, () => letters[randomInt(letters.length)]).join('')
  return [block(), block(), block(), block()].join('-')
}

export async function installDemo(root: string): Promise<DemoInstallation> {
  const blobs = await startLocalBlobs(root)
  try {
    // La même base que le site lancé en local.
    const { database } = getStorage(localDeployContext(localSettings()))
    // Aucun mot de passe n'est écrit dans le dépôt : celui-ci n'existe que le temps de l'afficher.
    const password = drawPassword()
    const passwordHash = await hashPassword(password, loadConfig().scrypt)
    const now = new Date()
    const summary = await database.write((tx) =>
      seedDemo(tx, { now, random: Math.random, passwordHash }),
    )
    return { ...summary, password }
  } finally {
    await blobs.stop()
  }
}
