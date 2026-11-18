/**
 * Exécution locale (`npm run dev` ou `netlify dev`). Netlify pose alors
 * NETLIFY_DEV ou NETLIFY_LOCAL ; rien de ce qui suit ne peut s'activer sur un
 * site publié.
 */
export interface LocalSettings {
  /** Vrai quand le site tourne sur la machine d'un développeur, pas sur Netlify. */
  local: boolean
  /**
   * Identifiant d'une série de tests de bout en bout (variable GRIND_UP_E2E_RUN).
   * Chaque série travaille sur sa propre base, avec des limites de tentatives
   * relâchées et un hachage de mots de passe allégé.
   */
  e2eRun: string | null
}

export function localSettings(
  environment: Record<string, string | undefined> = process.env,
): LocalSettings {
  const local = Boolean(environment.NETLIFY_DEV || environment.NETLIFY_LOCAL)
  const e2eRun = local ? environment.GRIND_UP_E2E_RUN?.replace(/[^a-z0-9-]/gi, '') || null : null
  return { local, e2eRun }
}

/** Contexte de déploiement d'une exécution locale : « dev », ou celui de la série de tests. */
export function localDeployContext(settings: LocalSettings): string {
  return settings.e2eRun ? `e2e-${settings.e2eRun}` : 'dev'
}
