import { DEFAULT_SCRYPT, type ScryptParameters } from './auth/passwords.js'
import { localSettings } from './local.js'

/**
 * Réglages du serveur. Le seul qui se règle de l'extérieur est le code admin,
 * par la variable d'environnement ADMIN_SIGNUP_CODE ; sa valeur ne quitte jamais
 * le serveur.
 */
export const DEFAULT_ADMIN_SIGNUP_CODE = 'SuperAdmin'

export interface AppConfig {
  /** Code spécial qui fait d'une inscription un compte admin. */
  adminSignupCode: string
  /** Durée d'une session sans activité, en jours. */
  sessionLifetimeDays: number
  scrypt: ScryptParameters
  limits: {
    /** Comptes créés par heure et par adresse IP. */
    signupsPerHour: number
    /** Essais de code admin par heure et par adresse IP. */
    adminCodeAttemptsPerHour: number
    /** Échecs de connexion par fenêtre et par adresse IP. */
    loginFailures: number
    loginWindowMinutes: number
  }
}

export function loadConfig(
  environment: Record<string, string | undefined> = process.env,
): AppConfig {
  const config: AppConfig = {
    adminSignupCode: environment.ADMIN_SIGNUP_CODE?.trim() || DEFAULT_ADMIN_SIGNUP_CODE,
    sessionLifetimeDays: 30,
    scrypt: DEFAULT_SCRYPT,
    limits: {
      signupsPerHour: 20,
      adminCodeAttemptsPerHour: 5,
      loginFailures: 10,
      loginWindowMinutes: 15,
    },
  }

  // Tests de bout en bout, en local uniquement : des dizaines de comptes y sont
  // créés en quelques secondes depuis la même adresse.
  if (localSettings(environment).e2eRun) {
    config.scrypt = { cost: 2 ** 12, blockSize: 8, parallelization: 1 }
    config.limits = {
      ...config.limits,
      signupsPerHour: 100_000,
      adminCodeAttemptsPerHour: 100_000,
      loginFailures: 100_000,
    }
  }
  return config
}
